"""
API endpoints for drag & drop ordering
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models import User, Task, Category, Todo
from app.services.permissions import permission_service
from app.core.logging import logger
from pydantic import BaseModel


router = APIRouter(prefix="/drag-drop", tags=["drag-drop"])


class ReorderRequest(BaseModel):
    """Request for reordering items"""
    item_ids: List[int]  # List of IDs in new order


class ReorderTasksRequest(BaseModel):
    """Request for reordering tasks"""
    task_ids: List[int]  # List of task IDs in new order
    room_id: Optional[int] = None  # Optional: reorder within a room
    category_id: Optional[int] = None  # Optional: reorder within a category


class ReorderCategoriesRequest(BaseModel):
    """Request for reordering categories"""
    category_ids: List[int]  # List of category IDs in new order


class ReorderTodosRequest(BaseModel):
    """Request for reordering todos"""
    todo_ids: List[int]  # List of todo IDs in new order
    task_id: int  # Parent task ID


@router.put("/tasks/reorder")
def reorder_tasks(
    request: ReorderTasksRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Reorder tasks based on drag & drop
    """
    try:
        # Get all tasks that belong to user
        query = db.query(Task).filter(Task.user_id == current_user.id)
        
        if request.room_id:
            # Check permissions
            if not permission_service.can_edit_room(db, current_user.id, request.room_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to edit this room",
                )
            query = query.filter(Task.room_id == request.room_id)
        
        if request.category_id:
            query = query.filter(Task.category_id == request.category_id)
        
        # Verify all task IDs belong to user
        tasks = query.filter(Task.id.in_(request.task_ids)).all()
        
        if len(tasks) != len(request.task_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some tasks not found or not authorized",
            )
        
        # Update positions
        for position, task_id in enumerate(request.task_ids, start=1):
            task = next((t for t in tasks if t.id == task_id), None)
            if task:
                task.position = position
        
        db.commit()
        
        logger.info(
            "Tasks reordered",
            extra={
                "user_id": current_user.id,
                "task_count": len(request.task_ids),
                "room_id": request.room_id,
                "category_id": request.category_id,
            },
        )
        
        return {"message": "Tasks reordered successfully", "count": len(request.task_ids)}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reordering tasks: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reorder tasks",
        )


@router.put("/categories/reorder")
def reorder_categories(
    request: ReorderCategoriesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Reorder categories based on drag & drop
    """
    try:
        # Get all categories that belong to user
        categories = (
            db.query(Category)
            .filter(
                Category.user_id == current_user.id,
                Category.id.in_(request.category_ids),
            )
            .all()
        )
        
        if len(categories) != len(request.category_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some categories not found or not authorized",
            )
        
        # Update positions
        for position, category_id in enumerate(request.category_ids, start=1):
            category = next((c for c in categories if c.id == category_id), None)
            if category:
                category.position = position
        
        db.commit()
        
        logger.info(
            "Categories reordered",
            extra={
                "user_id": current_user.id,
                "category_count": len(request.category_ids),
            },
        )
        
        return {"message": "Categories reordered successfully", "count": len(request.category_ids)}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reordering categories: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reorder categories",
        )


@router.put("/todos/reorder")
def reorder_todos(
    request: ReorderTodosRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Reorder todos within a task based on drag & drop
    """
    try:
        # Get parent task and verify ownership
        task = (
            db.query(Task)
            .filter(Task.id == request.task_id, Task.user_id == current_user.id)
            .first()
        )
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or not authorized",
            )
        
        # Get all todos for this task
        todos = (
            db.query(Todo)
            .filter(
                Todo.task_id == request.task_id,
                Todo.id.in_(request.todo_ids),
            )
            .all()
        )
        
        if len(todos) != len(request.todo_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some todos not found",
            )
        
        # Update positions
        for position, todo_id in enumerate(request.todo_ids, start=1):
            todo = next((t for t in todos if t.id == todo_id), None)
            if todo:
                todo.position = position
        
        db.commit()
        
        logger.info(
            "Todos reordered",
            extra={
                "user_id": current_user.id,
                "task_id": request.task_id,
                "todo_count": len(request.todo_ids),
            },
        )
        
        return {"message": "Todos reordered successfully", "count": len(request.todo_ids)}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reordering todos: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reorder todos",
        )
