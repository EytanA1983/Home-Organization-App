"""Task model with recurrence support"""
from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING, Optional, List
import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.category import Category
    from app.db.models.room import Room
    from app.db.models.user import User
    from app.db.models.todo import Todo


class Recurrence(enum.Enum):
    """Task recurrence types"""
    none = "none"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


class Task(Base):
    """Main task model with scheduling and recurrence"""
    __tablename__ = "tasks"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)  # display order (for drag & drop)

    # Relations
    category_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("categories.id"), 
        nullable=True, 
        index=True
    )
    room_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("rooms.id"), 
        nullable=True, 
        index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id"), 
        nullable=False, 
        index=True
    )

    # Scheduling
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    recurrence: Mapped[Recurrence] = mapped_column(
        Enum(Recurrence), 
        default=Recurrence.none
    )
    
    # Advanced recurrence (RRULE)
    rrule_string: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True
    )  # RRULE string (RFC 5545)
    rrule_start_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime, 
        nullable=True
    )
    rrule_end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime, 
        nullable=True
    )
    parent_task_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("tasks.id"), 
        nullable=True
    )
    is_recurring_template: Mapped[bool] = mapped_column(Boolean, default=False)

    # History
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )

    # Relationships
    category: Mapped[Optional["Category"]] = relationship(
        "Category", 
        back_populates="tasks"
    )
    room: Mapped[Optional["Room"]] = relationship("Room", back_populates="tasks")
    user: Mapped["User"] = relationship("User", backref="tasks")
    todos: Mapped[List["Todo"]] = relationship(
        "Todo", 
        back_populates="task", 
        cascade="all, delete"
    )
    
    # Recurring task relationships
    parent_task: Mapped[Optional["Task"]] = relationship(
        "Task", 
        remote_side=[id], 
        backref="recurring_instances"
    )
    
    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', completed={self.completed})>"
