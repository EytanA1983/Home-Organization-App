from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class TodoItemResponse(BaseModel):
    id: int
    text: str
    is_completed: bool
    todo_list_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TodoListBase(BaseModel):
    name: str
    description: Optional[str] = None


class TodoListCreate(TodoListBase):
    pass


class TodoListUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None


class TodoListResponse(TodoListBase):
    id: int
    owner_id: int
    is_completed: bool
    items: List[TodoItemResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
