"""Todo (sub-task) model"""
from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.task import Task


class Todo(Base):
    """Sub-tasks within a task"""
    __tablename__ = "todos"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    task_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("tasks.id"), 
        nullable=False, 
        index=True
    )
    position: Mapped[int] = mapped_column(Integer, default=0)  # display order (for drag & drop)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="todos")
    
    def __repr__(self) -> str:
        return f"<Todo(id={self.id}, title='{self.title}', completed={self.completed})>"
