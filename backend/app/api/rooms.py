from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_user
from app.api.deps_audit import get_audit_context
from app.db.models import User, Room
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from app.services.audit import audit_service, AuditAction
from app.services.permissions import permission_service, Permission
from app.core.logging import logger
from app.core.cache import invalidate_user_cache, cache_get, cache_set, make_cache_key, CACHE_TTL_MEDIUM

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("/", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    request: Request,
    room_data: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    audit_context: dict = Depends(get_audit_context),
):
    """Create a new room"""
    room = Room(**room_data.model_dump(), owner_id=current_user.id)
    db.add(room)
    db.flush()  # Flush to get the ID
    
    # Create audit log
    new_values = room_data.model_dump()
    audit_service.create_audit_log(
        session=db,
        instance=room,
        action=AuditAction.CREATE,
        user_id=audit_context["user_id"],
        user_email=audit_context["user_email"],
        new_values=new_values,
        ip_address=audit_context["ip_address"],
        user_agent=audit_context["user_agent"],
    )
    
    db.commit()
    db.refresh(room)
    
    # Invalidate rooms cache for this user
    invalidate_user_cache(current_user.id, ["rooms"])
    
    logger.info("Room created", extra={"room_id": room.id, "user_id": current_user.id})
    return RoomResponse(id=room.id, name=room.name, user_id=room.owner_id)


@router.get("/", response_model=List[RoomResponse])
def get_rooms(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all rooms for current user (owned + shared) - with Redis caching"""
    # Try cache first
    cache_key = make_cache_key("rooms", current_user.id, skip=skip, limit=limit)
    cached = cache_get(cache_key)
    if cached is not None:
        return [RoomResponse(**r) for r in cached]
    
    # Get all rooms user can access
    rooms = permission_service.get_user_rooms(db, current_user.id)
    # Apply pagination
    paginated_rooms = rooms[skip:skip + limit]
    # API response keeps `user_id` for compatibility, but DB model uses `owner_id`
    result = [RoomResponse(id=r.id, name=r.name, user_id=r.owner_id) for r in paginated_rooms]
    
    # Cache the result
    cache_set(cache_key, [r.model_dump() for r in result], CACHE_TTL_MEDIUM)
    
    return result


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific room (check permissions)"""
    # Check if user can access room
    if not permission_service.can_access_room(db, current_user.id, room_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this room"
        )
    
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    return RoomResponse(id=room.id, name=room.name, user_id=room.owner_id)


@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    request: Request,
    room_id: int,
    room_data: RoomUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    audit_context: dict = Depends(get_audit_context),
):
    """Update a room (check permissions - only owner/editor can edit)"""
    # Check if user can edit room
    if not permission_service.can_edit_room(db, current_user.id, room_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this room"
        )
    
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )

    # Get old values before update
    old_values = {field: getattr(room, field) for field in room_data.model_dump(exclude_unset=True).keys() if hasattr(room, field)}
    
    update_data = room_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(room, field):  # Only update fields that exist in the model
            setattr(room, field, value)
    
    db.flush()  # Flush to get updated values
    
    # Get changed fields
    changed_fields = audit_service.get_changed_fields(room, db)
    
    # Create audit log
    if changed_fields:
        new_values = {field: changed_fields[field]["new"] for field in changed_fields}
        audit_service.create_audit_log(
            session=db,
            instance=room,
            action=AuditAction.UPDATE,
            user_id=audit_context["user_id"],
            user_email=audit_context["user_email"],
            old_values=old_values,
            new_values=new_values,
            changed_fields=changed_fields,
            ip_address=audit_context["ip_address"],
            user_agent=audit_context["user_agent"],
        )

    db.commit()
    db.refresh(room)
    
    # Invalidate rooms cache for this user
    invalidate_user_cache(current_user.id, ["rooms"])
    
    logger.info("Room updated", extra={"room_id": room.id, "user_id": current_user.id, "changed_fields": list(changed_fields.keys())})
    return RoomResponse(id=room.id, name=room.name, user_id=room.owner_id)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    request: Request,
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    audit_context: dict = Depends(get_audit_context),
):
    """Delete a room (only owner can delete)"""
    # Check if user can delete room (only owner)
    if not permission_service.can_delete_room(db, current_user.id, room_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only room owner can delete the room"
        )
    
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Get old values before delete
    old_values = {"id": room.id, "name": room.name, "user_id": room.owner_id}
    
    # Create audit log before delete
    audit_service.create_audit_log(
        session=db,
        instance=room,
        action=AuditAction.DELETE,
        user_id=audit_context["user_id"],
        user_email=audit_context["user_email"],
        old_values=old_values,
        ip_address=audit_context["ip_address"],
        user_agent=audit_context["user_agent"],
    )
    
    db.delete(room)
    db.commit()
    
    # Invalidate rooms cache for this user
    invalidate_user_cache(current_user.id, ["rooms"])
    
    logger.info("Room deleted", extra={"room_id": room_id, "user_id": current_user.id})
    return None
