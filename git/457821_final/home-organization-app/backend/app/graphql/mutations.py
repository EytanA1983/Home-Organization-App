"""
GraphQL Mutations
"""
from typing import Optional
import strawberry
from strawberry.types import Info
from app.graphql.types import RoomType, TaskType, CategoryType, TodoType
from app.db.models import Room, Task, Category, Todo, Recurrence
from app.db.session import SessionLocal
from app.services.permissions import permission_service, Permission
from app.services.recurring_tasks import recurring_tasks_service
from datetime import datetime, timedelta


@strawberry.input
class RoomCreateInput:
    """Input for creating a room"""
    name: str


@strawberry.input
class RoomUpdateInput:
    """Input for updating a room"""
    name: Optional[str] = None


@strawberry.input
class TaskCreateInput:
    """Input for creating a task"""
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    recurrence: Optional[str] = None
    category_id: Optional[int] = None
    room_id: Optional[int] = None
    rrule_string: Optional[str] = None
    rrule_start_date: Optional[datetime] = None
    rrule_end_date: Optional[datetime] = None


@strawberry.input
class TaskUpdateInput:
    """Input for updating a task"""
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None
    category_id: Optional[int] = None
    room_id: Optional[int] = None


@strawberry.input
class CategoryCreateInput:
    """Input for creating a category"""
    name: str
    icon: Optional[str] = None


@strawberry.input
class TodoCreateInput:
    """Input for creating a todo"""
    title: str
    task_id: int


@strawberry.type
class Mutation:
    """GraphQL Mutation root"""
    
    @strawberry.mutation
    def create_room(self, info: Info, input: RoomCreateInput) -> Optional[RoomType]:
        """Create a new room"""
        current_user = info.context.get("current_user")
        if not current_user:
            return None
        
        db = SessionLocal()
        try:
            room = Room(name=input.name, owner_id=current_user.id)
            db.add(room)
            db.commit()
            db.refresh(room)
            
            return RoomType(
                id=room.id,
                name=room.name,
                user_id=room.owner_id,
                is_shared=room.is_shared,
            )
        finally:
            db.close()
    
    @strawberry.mutation
    def update_room(
        self,
        info: Info,
        room_id: int,
        input: RoomUpdateInput,
    ) -> Optional[RoomType]:
        """Update a room"""
        current_user = info.context.get("current_user")
        if not current_user:
            return None
        
        db = SessionLocal()
        try:
            # Check permissions
            if not permission_service.can_edit_room(db, current_user.id, room_id):
                return None
            
            room = db.query(Room).filter(Room.id == room_id).first()
            if not room:
                return None
            
            if input.name is not None:
                room.name = input.name
            
            db.commit()
            db.refresh(room)
            
            return RoomType(
                id=room.id,
                name=room.name,
                user_id=room.owner_id,
                is_shared=room.is_shared,
            )
        finally:
            db.close()
    
    @strawberry.mutation
    def delete_room(self, info: Info, room_id: int) -> bool:
        """Delete a room"""
        current_user = info.context.get("current_user")
        if not current_user:
            return False
        
        db = SessionLocal()
        try:
            # Check permissions (only owner can delete)
            if not permission_service.can_delete_room(db, current_user.id, room_id):
                return False
            
            room = db.query(Room).filter(Room.id == room_id).first()
            if not room:
                return False
            
            db.delete(room)
            db.commit()
            return True
        finally:
            db.close()
    
    @strawberry.mutation
    def create_task(self, info: Info, input: TaskCreateInput) -> Optional[TaskType]:
        """Create a new task"""
        current_user = info.context.get("current_user")
        if not current_user:
            return None
        
        db = SessionLocal()
        try:
            # Check room permissions if room_id provided
            if input.room_id:
                if not permission_service.can_edit_room(db, current_user.id, input.room_id):
                    return None
            
            # Prepare task data
            task_data = {
                "title": input.title,
                "description": input.description,
                "due_date": input.due_date,
                "category_id": input.category_id,
                "room_id": input.room_id,
                "user_id": current_user.id,
            }
            
            # Handle recurrence
            if input.recurrence:
                task_data["recurrence"] = Recurrence(input.recurrence)
            
            # Handle RRULE
            is_recurring = bool(input.rrule_string and input.rrule_start_date)
            if is_recurring:
                task_data["rrule_string"] = input.rrule_string
                task_data["rrule_start_date"] = input.rrule_start_date
                task_data["rrule_end_date"] = input.rrule_end_date
                task_data["is_recurring_template"] = True
                if not task_data.get("due_date"):
                    task_data["due_date"] = input.rrule_start_date
            
            task = Task(**task_data)
            db.add(task)
            db.commit()
            db.refresh(task)
            
            # Generate recurring instances if needed
            if is_recurring:
                try:
                    until_date = input.rrule_end_date or (datetime.utcnow() + timedelta(days=30))
                    recurring_tasks_service.create_recurring_instances(
                        db=db,
                        template_task=task,
                        until_date=until_date,
                        max_instances=50,
                    )
                except Exception:
                    pass  # Don't fail task creation if instance generation fails
            
            return TaskType.from_model(task)
        finally:
            db.close()
    
    @strawberry.mutation
    def update_task(
        self,
        info: Info,
        task_id: int,
        input: TaskUpdateInput,
    ) -> Optional[TaskType]:
        """Update a task"""
        current_user = info.context.get("current_user")
        if not current_user:
            return None
        
        db = SessionLocal()
        try:
            # Check permissions
            if not permission_service.can_access_task(
                db, current_user.id, task_id, Permission.EDITOR
            ):
                return None
            
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                return None
            
            # Update fields
            if input.title is not None:
                task.title = input.title
            if input.description is not None:
                task.description = input.description
            if input.due_date is not None:
                task.due_date = input.due_date
            if input.completed is not None:
                task.completed = input.completed
            if input.category_id is not None:
                task.category_id = input.category_id
            if input.room_id is not None:
                # Check room permissions
                if not permission_service.can_edit_room(db, current_user.id, input.room_id):
                    return None
                task.room_id = input.room_id
            
            db.commit()
            db.refresh(task)
            
            return TaskType.from_model(task)
        finally:
            db.close()
    
    @strawberry.mutation
    def delete_task(self, info: Info, task_id: int) -> bool:
        """Delete a task"""
        current_user = info.context.get("current_user")
        if not current_user:
            return False
        
        db = SessionLocal()
        try:
            # Check permissions
            if not permission_service.can_access_task(
                db, current_user.id, task_id, Permission.EDITOR
            ):
                return False
            
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                return False
            
            db.delete(task)
            db.commit()
            return True
        finally:
            db.close()
    
    @strawberry.mutation
    def create_category(
        self,
        info: Info,
        input: CategoryCreateInput,
    ) -> Optional[CategoryType]:
        """Create a new category"""
        current_user = info.context.get("current_user")
        if not current_user:
            return None
        
        db = SessionLocal()
        try:
            category = Category(
                name=input.name,
                icon=input.icon,
                user_id=current_user.id,
            )
            db.add(category)
            db.commit()
            db.refresh(category)
            
            return CategoryType(
                id=category.id,
                name=category.name,
                icon=category.icon,
                user_id=category.user_id,
            )
        finally:
            db.close()
    
    @strawberry.mutation
    def create_todo(self, info: Info, input: TodoCreateInput) -> Optional[TodoType]:
        """Create a new todo"""
        current_user = info.context.get("current_user")
        if not current_user:
            return None
        
        db = SessionLocal()
        try:
            # Check task permissions
            task = db.query(Task).filter(
                Task.id == input.task_id,
                Task.user_id == current_user.id,
            ).first()
            
            if not task:
                return None
            
            todo = Todo(title=input.title, task_id=input.task_id)
            db.add(todo)
            db.commit()
            db.refresh(todo)
            
            return TodoType(
                id=todo.id,
                title=todo.title,
                completed=todo.completed,
                task_id=todo.task_id,
            )
        finally:
            db.close()
