"""
GraphQL Queries
"""
from typing import Optional, List
import strawberry
from strawberry.types import Info
from app.graphql.types import (
    UserType,
    RoomType,
    TaskType,
    CategoryType,
    TodoType,
    StatisticsType,
)
from app.db.models import User, Room, Task, Category, Todo
from app.api.deps import get_db
from app.services.permissions import permission_service
from app.services.statistics import statistics_service


@strawberry.type
class Query:
    """GraphQL Query root"""
    
    @strawberry.field
    def me(self, info: Info) -> Optional[UserType]:
        """Get current user"""
        current_user = info.context.get("current_user")
        if not current_user:
            return None
        
        return UserType(
            id=current_user.id,
            email=current_user.email,
            full_name=getattr(current_user, "full_name", None),
            is_active=current_user.is_active,
            is_superuser=current_user.is_superuser,
        )
    
    @strawberry.field
    def rooms(
        self,
        info: Info,
        skip: int = 0,
        limit: int = 100,
    ) -> List[RoomType]:
        """Get all rooms for current user (owned + shared)"""
        current_user = info.context.get("current_user")
        if not current_user:
            return []
        
        db = SessionLocal()
        try:
            rooms = permission_service.get_user_rooms(db, current_user.id)
        finally:
            db.close()
        
        # Apply pagination
        paginated_rooms = rooms[skip:skip + limit]
        
        return [
            RoomType(
                id=room.id,
                name=room.name,
                user_id=room.owner_id,
                is_shared=room.is_shared,
            )
            for room in paginated_rooms
        ]
    
    @strawberry.field
    def room(self, info: Info, room_id: int) -> Optional[RoomType]:
        """Get a specific room"""
        current_user = info.context.get("current_user")
        if not current_user:
            return None
        
        db = SessionLocal()
        try:
            # Check permissions
            if not permission_service.can_access_room(db, current_user.id, room_id):
                return None
            
            room = db.query(Room).filter(Room.id == room_id).first()
            if not room:
                return None
            
            return RoomType(
                id=room.id,
                name=room.name,
                user_id=room.owner_id,
                is_shared=room.is_shared,
            )
        finally:
            db.close()
    
    @strawberry.field
    def tasks(
        self,
        info: Info,
        room_id: Optional[int] = None,
        category_id: Optional[int] = None,
        completed: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[TaskType]:
        """Get tasks with optional filters"""
        current_user = info.context.get("current_user")
        if not current_user:
            return []
        
        db = SessionLocal()
        try:
            query = db.query(Task).filter(Task.user_id == current_user.id)
            
            if room_id:
                # Check permissions
                if not permission_service.can_access_room(db, current_user.id, room_id):
                    return []
                query = query.filter(Task.room_id == room_id)
            
            if category_id:
                query = query.filter(Task.category_id == category_id)
            
            if completed is not None:
                query = query.filter(Task.completed == completed)
            
            tasks = query.offset(skip).limit(limit).all()
            return [TaskType.from_model(task) for task in tasks]
        finally:
            db.close()
    
    @strawberry.field
    def task(self, info: Info, task_id: int) -> Optional[TaskType]:
        """Get a specific task"""
        current_user = info.context.get("current_user")
        if not current_user:
            return None
        
        db = SessionLocal()
        try:
            # Check permissions
            if not permission_service.can_access_task(db, current_user.id, task_id):
                return None
            
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                return None
            
            return TaskType.from_model(task)
        finally:
            db.close()
    
    @strawberry.field
    def categories(self, info: Info) -> List[CategoryType]:
        """Get all categories for current user"""
        current_user = info.context.get("current_user")
        if not current_user:
            return []
        
        db = SessionLocal()
        try:
            categories = db.query(Category).filter(Category.user_id == current_user.id).all()
            
            return [
                CategoryType(
                    id=cat.id,
                    name=cat.name,
                    icon=cat.icon,
                    user_id=cat.user_id,
                )
                for cat in categories
            ]
        finally:
            db.close()
    
    @strawberry.field
    def statistics(self, info: Info) -> Optional[StatisticsType]:
        """Get statistics for current user"""
        current_user = info.context.get("current_user")
        if not current_user:
            return None
        
        db = SessionLocal()
        try:
            stats = statistics_service.calculate_overall_statistics(db, current_user.id)
            
            return StatisticsType(
                total_tasks=stats["overall"]["total"],
                completed_tasks=stats["overall"]["completed"],
                pending_tasks=stats["overall"]["pending"],
                completion_rate=stats["overall"]["completion_rate"],
                avg_tasks_per_room=stats["by_room"]["avg_tasks_per_room"],
                rooms_count=stats["by_room"]["rooms_count"],
            )
        finally:
            db.close()
