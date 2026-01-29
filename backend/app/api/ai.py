"""
API endpoints for AI features
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models import User, Task, Room, Category
from app.services.ai import ai_service
from app.services.permissions import permission_service
from app.services.statistics import statistics_service
from app.core.logging import logger
from app.config import settings
from pydantic import BaseModel


router = APIRouter(prefix="/ai", tags=["ai"])


class AISuggestionRequest(BaseModel):
    """Request for AI suggestions"""
    room_id: Optional[int] = None
    include_tasks: bool = True
    include_categories: bool = True


class AutoTagRequest(BaseModel):
    """Request for auto-tagging"""
    task_title: str
    task_description: Optional[str] = None


class OptimalOrderRequest(BaseModel):
    """Request for optimal order calculation"""
    task_ids: Optional[List[int]] = None
    room_id: Optional[int] = None


@router.get("/suggestions/organization")
def get_organization_suggestions(
    room_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get AI suggestions for room organization
    """
    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI features are disabled",
        )

    if room_id:
        # Check permissions
        if not permission_service.can_access_room(db, current_user.id, room_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this room",
            )

        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found",
            )

        # Get tasks for this room
        tasks = (
            db.query(Task)
            .filter(Task.room_id == room_id, Task.user_id == current_user.id)
            .limit(20)
            .all()
        )

        tasks_data = [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
            }
            for task in tasks
        ]

        # Get categories
        categories = (
            db.query(Category)
            .filter(Category.user_id == current_user.id)
            .all()
        )

        categories_data = [
            {"id": cat.id, "name": cat.name, "icon": cat.icon}
            for cat in categories
        ]

        suggestions = ai_service.suggest_organization(
            room_name=room.name,
            tasks=tasks_data,
            categories=categories_data,
        )

        if suggestions:
            logger.info(
                "AI organization suggestions generated",
                extra={"room_id": room_id, "user_id": current_user.id},
            )
            return suggestions
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to generate AI suggestions",
            )

    else:
        # Get suggestions for all rooms
        rooms = permission_service.get_user_rooms(db, current_user.id)
        all_suggestions = []

        for room in rooms[:5]:  # Limit to 5 rooms
            tasks = (
                db.query(Task)
                .filter(Task.room_id == room.id, Task.user_id == current_user.id)
                .limit(10)
                .all()
            )

            tasks_data = [
                {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "completed": task.completed,
                }
                for task in tasks
            ]

            categories = (
                db.query(Category)
                .filter(Category.user_id == current_user.id)
                .all()
            )

            categories_data = [
                {"id": cat.id, "name": cat.name, "icon": cat.icon}
                for cat in categories
            ]

            suggestions = ai_service.suggest_organization(
                room_name=room.name,
                tasks=tasks_data,
                categories=categories_data,
            )

            if suggestions:
                suggestions["room_id"] = room.id
                suggestions["room_name"] = room.name
                all_suggestions.append(suggestions)

        return {"suggestions": all_suggestions}


@router.post("/auto-tag")
def auto_tag_task(
    request: AutoTagRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Auto-tag a task with category and tags using AI
    """
    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI features are disabled",
        )

    # Get existing categories
    categories = (
        db.query(Category)
        .filter(Category.user_id == current_user.id)
        .all()
    )

    category_names = [cat.name for cat in categories]

    result = ai_service.auto_tag_task(
        task_title=request.task_title,
        task_description=request.task_description,
        existing_categories=category_names if category_names else None,
    )

    if result:
        logger.info(
            "AI auto-tagging completed",
            extra={"user_id": current_user.id, "task_title": request.task_title},
        )
        return result
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to generate auto-tags",
        )


@router.post("/optimal-order")
def calculate_optimal_order(
    request: OptimalOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate optimal order for completing tasks
    """
    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI features are disabled",
        )

    # Get tasks
    query = db.query(Task).filter(Task.user_id == current_user.id, Task.completed == False)

    if request.task_ids:
        query = query.filter(Task.id.in_(request.task_ids))
    elif request.room_id:
        # Check permissions
        if not permission_service.can_access_room(db, current_user.id, request.room_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this room",
            )
        query = query.filter(Task.room_id == request.room_id)

    tasks = query.limit(20).all()

    if not tasks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tasks found",
        )

    # Prepare tasks data
    tasks_data = []
    for task in tasks:
        room_name = None
        if task.room_id:
            room = db.query(Room).filter(Room.id == task.room_id).first()
            if room:
                room_name = room.name

        tasks_data.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "room_name": room_name,
            "priority": "high" if task.due_date else "medium",
            "estimated_time": 30,  # Default estimate
        })

    # Get rooms for context
    rooms = permission_service.get_user_rooms(db, current_user.id)
    rooms_data = [{"id": room.id, "name": room.name} for room in rooms]

    result = ai_service.calculate_optimal_order(
        tasks=tasks_data,
        rooms=rooms_data,
    )

    if result:
        logger.info(
            "AI optimal order calculated",
            extra={"user_id": current_user.id, "tasks_count": len(tasks)},
        )
        return result
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to calculate optimal order",
        )


@router.get("/suggestions/room-improvements/{room_id}")
def get_room_improvements(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get AI suggestions for room improvements
    """
    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI features are disabled",
        )

    # Check permissions
    if not permission_service.can_access_room(db, current_user.id, room_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this room",
        )

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    # Get tasks
    tasks = (
        db.query(Task)
        .filter(Task.room_id == room_id, Task.user_id == current_user.id)
        .limit(20)
        .all()
    )

    tasks_data = [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
        }
        for task in tasks
    ]

    # Calculate completion rate
    stats = statistics_service.calculate_task_statistics_by_room(db, current_user.id, room_id)
    completion_rate = stats.get("completion_rate", 0.0)

    suggestions = ai_service.suggest_room_improvements(
        room_name=room.name,
        tasks=tasks_data,
        completion_rate=completion_rate,
    )

    if suggestions:
        logger.info(
            "AI room improvements generated",
            extra={"room_id": room_id, "user_id": current_user.id},
        )
        return suggestions
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to generate AI suggestions",
        )


@router.get("/health")
def ai_health_check():
    """
    Check if AI service is available
    """
    return {
        "enabled": settings.AI_ENABLED,
        "available": ai_service.client is not None,
        "model": settings.AI_MODEL if settings.AI_ENABLED else None,
    }
