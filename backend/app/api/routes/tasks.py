from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.redis_pubsub import redis_pubsub
from app.api.ws import manager

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task"""
    task = Task(**task_data.model_dump(), owner_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # Publish to Redis Pub/Sub for real-time updates
    task_dict = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "is_completed": task.is_completed,
        "priority": task.priority.value if task.priority else None,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "room_id": task.room_id,
        "created_at": task.created_at.isoformat(),
    }
    redis_pubsub.publish_task_created(current_user.id, task_dict)
    
    # Also broadcast via WebSocket
    import asyncio
    asyncio.create_task(manager.broadcast_to_user({
        "type": "task_created",
        "data": task_dict
    }, current_user.id))
    
    return task


@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    skip: int = 0,
    limit: int = 100,
    room_id: Optional[int] = None,
    completed: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tasks for current user"""
    query = db.query(Task).filter(Task.owner_id == current_user.id)
    
    if room_id:
        query = query.filter(Task.room_id == room_id)
    if completed is not None:
        query = query.filter(Task.is_completed == completed)
    
    tasks = query.offset(skip).limit(limit).all()
    return tasks


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific task"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.owner_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a task"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.owner_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    update_data = task_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    
    # Publish to Redis Pub/Sub for real-time updates
    task_dict = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "is_completed": task.is_completed,
        "priority": task.priority.value if task.priority else None,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "room_id": task.room_id,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }
    redis_pubsub.publish_task_update(current_user.id, task_dict)
    
    # Also broadcast via WebSocket
    import asyncio
    asyncio.create_task(manager.broadcast_to_user({
        "type": "task_update",
        "data": task_dict
    }, current_user.id))
    
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a task"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.owner_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    task_id_to_delete = task.id
    db.delete(task)
    db.commit()
    
    # Publish to Redis Pub/Sub for real-time updates
    redis_pubsub.publish_task_deleted(current_user.id, task_id_to_delete)
    
    # Also broadcast via WebSocket
    import asyncio
    asyncio.create_task(manager.broadcast_to_user({
        "type": "task_deleted",
        "data": {"task_id": task_id_to_delete}
    }, current_user.id))
    
    return None
