from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class TaskAction(str, enum.Enum):
    CREATED = "created"
    UPDATED = "updated"
    COMPLETED = "completed"
    UNCOMPLETED = "uncompleted"
    DELETED = "deleted"
    PRIORITY_CHANGED = "priority_changed"
    DUE_DATE_CHANGED = "due_date_changed"
    ROOM_CHANGED = "room_changed"


class TaskHistory(Base):
    __tablename__ = "task_history"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    action = Column(Enum(TaskAction), nullable=False)
    
    # Store previous and new values as JSON for flexibility
    previous_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    
    # User who made the change
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    task = relationship("Task", back_populates="history")
    changed_by = relationship("User", foreign_keys=[changed_by_id])
