"""Todo schemas for API validation and serialization"""
from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List


class TodoBase(BaseModel):
    """Base schema for Todo (sub-task)"""
    title: str = Field(..., min_length=1, max_length=200, description="Todo title")
    completed: bool = Field(False, description="Whether the todo is completed")


class TodoCreate(TodoBase):
    """Schema for creating a new todo"""
    pass


class TodoUpdate(BaseModel):
    """Schema for updating an existing todo (all fields optional)"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    completed: Optional[bool] = None
    position: Optional[int] = Field(None, description="Display order for drag & drop")


class TodoRead(TodoBase):
    """Schema for reading todo data"""
    id: int
    task_id: int
    position: int = 0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== TodoList/TodoItem schemas (legacy compatibility) ====================

class TodoItemResponse(BaseModel):
    """Response schema for TodoItem (legacy)"""
    id: int
    text: str
    is_completed: bool
    todo_list_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TodoListBase(BaseModel):
    """Base schema for TodoList (legacy)"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class TodoListCreate(TodoListBase):
    """Schema for creating a new TodoList"""
    pass


class TodoListUpdate(BaseModel):
    """Schema for updating an existing TodoList"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_completed: Optional[bool] = None


class TodoListResponse(TodoListBase):
    """Response schema for TodoList with items"""
    id: int
    owner_id: int
    is_completed: bool
    items: List[TodoItemResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TodoItemCreate(BaseModel):
    """Schema for creating a new TodoItem"""
    text: str = Field(..., min_length=1, max_length=500)


class TodoItemUpdate(BaseModel):
    """Schema for updating an existing TodoItem"""
    text: Optional[str] = Field(None, min_length=1, max_length=500)
    is_completed: Optional[bool] = None
