"""
GraphQL Types - Type definitions for GraphQL schema
"""
from typing import Optional, List
from datetime import datetime
import strawberry
from strawberry.types import Info


@strawberry.type
class UserType:
    """User GraphQL type"""
    id: int
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool


@strawberry.type
class RoomType:
    """Room GraphQL type"""
    id: int
    name: str
    user_id: int
    is_shared: bool
    owner: Optional["UserType"] = None
    
    @strawberry.field
    def tasks(self, info: Info) -> List["TaskType"]:
        """Get tasks for this room"""
        from app.db.models import Task
        from app.api.deps import get_db
        from app.services.permissions import permission_service
        
        db = next(get_db())
        current_user = info.context.get("current_user")
        
        if not current_user:
            return []
        
        # Check permissions
        if not permission_service.can_access_room(db, current_user.id, self.id):
            return []
        
        tasks = db.query(Task).filter(Task.room_id == self.id).all()
        return [TaskType.from_model(task) for task in tasks]


@strawberry.type
class CategoryType:
    """Category GraphQL type"""
    id: int
    name: str
    icon: Optional[str] = None
    user_id: int


@strawberry.type
class TodoType:
    """Todo GraphQL type"""
    id: int
    title: str
    completed: bool
    task_id: int


@strawberry.type
class TaskType:
    """Task GraphQL type"""
    id: int
    title: str
    description: Optional[str] = None
    completed: bool
    due_date: Optional[datetime] = None
    recurrence: Optional[str] = None
    category_id: Optional[int] = None
    room_id: Optional[int] = None
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    @strawberry.field
    def category(self, info: Info) -> Optional["CategoryType"]:
        """Get category for this task"""
        if not self.category_id:
            return None
        
        from app.db.models import Category
        from app.db.session import SessionLocal
        
        db = SessionLocal()
        try:
            category = db.query(Category).filter(Category.id == self.category_id).first()
            if category:
                return CategoryType(
                    id=category.id,
                    name=category.name,
                    icon=category.icon,
                    user_id=category.user_id,
                )
            return None
        finally:
            db.close()
    
    @strawberry.field
    def room(self, info: Info) -> Optional["RoomType"]:
        """Get room for this task"""
        if not self.room_id:
            return None
        
        from app.db.models import Room
        from app.db.session import SessionLocal
        from app.services.permissions import permission_service
        
        current_user = info.context.get("current_user")
        if not current_user:
            return None
        
        db = SessionLocal()
        try:
            # Check permissions
            if not permission_service.can_access_room(db, current_user.id, self.room_id):
                return None
            
            room = db.query(Room).filter(Room.id == self.room_id).first()
            if room:
                return RoomType(
                    id=room.id,
                    name=room.name,
                    user_id=room.owner_id,
                    is_shared=room.is_shared,
                )
            return None
        finally:
            db.close()
    
    @strawberry.field
    def todos(self, info: Info) -> List["TodoType"]:
        """Get todos for this task"""
        from app.db.models import Todo
        from app.db.session import SessionLocal
        
        db = SessionLocal()
        try:
            todos = db.query(Todo).filter(Todo.task_id == self.id).all()
            return [
                TodoType(
                    id=todo.id,
                    title=todo.title,
                    completed=todo.completed,
                    task_id=todo.task_id,
                )
                for todo in todos
            ]
        finally:
            db.close()
    
    @classmethod
    def from_model(cls, task):
        """Create TaskType from SQLAlchemy model"""
        return cls(
            id=task.id,
            title=task.title,
            description=task.description,
            completed=task.completed,
            due_date=task.due_date,
            recurrence=task.recurrence.value if task.recurrence else None,
            category_id=task.category_id,
            room_id=task.room_id,
            user_id=task.user_id,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )


@strawberry.type
class RoomShareType:
    """RoomShare GraphQL type"""
    id: int
    room_id: int
    user_id: int
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    permission: str
    shared_by: int
    created_at: datetime


@strawberry.type
class StatisticsType:
    """Statistics GraphQL type"""
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    completion_rate: float
    avg_tasks_per_room: float
    rooms_count: int
