from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.todo_list import TodoList
from app.schemas.todo_list import TodoListCreate, TodoListUpdate, TodoListResponse

router = APIRouter(prefix="/todo-lists", tags=["todo-lists"])


@router.post("/", response_model=TodoListResponse, status_code=status.HTTP_201_CREATED)
def create_todo_list(
    todo_list_data: TodoListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new todo list"""
    todo_list = TodoList(**todo_list_data.model_dump(), owner_id=current_user.id)
    db.add(todo_list)
    db.commit()
    db.refresh(todo_list)
    return todo_list


@router.get("/", response_model=List[TodoListResponse])
def get_todo_lists(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all todo lists for current user"""
    todo_lists = db.query(TodoList).filter(
        TodoList.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return todo_lists


@router.get("/{todo_list_id}", response_model=TodoListResponse)
def get_todo_list(
    todo_list_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific todo list"""
    todo_list = db.query(TodoList).filter(
        TodoList.id == todo_list_id,
        TodoList.owner_id == current_user.id
    ).first()
    if not todo_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo list not found"
        )
    return todo_list


@router.put("/{todo_list_id}", response_model=TodoListResponse)
def update_todo_list(
    todo_list_id: int,
    todo_list_data: TodoListUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a todo list"""
    todo_list = db.query(TodoList).filter(
        TodoList.id == todo_list_id,
        TodoList.owner_id == current_user.id
    ).first()
    if not todo_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo list not found"
        )

    update_data = todo_list_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(todo_list, field, value)

    db.commit()
    db.refresh(todo_list)
    return todo_list


@router.delete("/{todo_list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo_list(
    todo_list_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a todo list"""
    todo_list = db.query(TodoList).filter(
        TodoList.id == todo_list_id,
        TodoList.owner_id == current_user.id
    ).first()
    if not todo_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo list not found"
        )
    db.delete(todo_list)
    db.commit()
    return None
