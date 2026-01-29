from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.room import Room
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("/", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    room_data: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new room"""
    room = Room(**room_data.model_dump(), owner_id=current_user.id)
    db.add(room)
    db.commit()
    db.refresh(room)
    return RoomResponse(id=room.id, name=room.name, user_id=room.owner_id)


@router.get("/", response_model=List[RoomResponse])
def get_rooms(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all rooms for current user"""
    rooms = db.query(Room).filter(
        Room.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return [RoomResponse(id=r.id, name=r.name, user_id=r.owner_id) for r in rooms]


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific room"""
    room = db.query(Room).filter(
        Room.id == room_id,
        Room.owner_id == current_user.id
    ).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    return RoomResponse(id=room.id, name=room.name, user_id=room.owner_id)


@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int,
    room_data: RoomUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a room"""
    room = db.query(Room).filter(
        Room.id == room_id,
        Room.owner_id == current_user.id
    ).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )

    update_data = room_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(room, field, value)

    db.commit()
    db.refresh(room)
    return RoomResponse(id=room.id, name=room.name, user_id=room.owner_id)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a room"""
    room = db.query(Room).filter(
        Room.id == room_id,
        Room.owner_id == current_user.id
    ).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    db.delete(room)
    db.commit()
    return None
