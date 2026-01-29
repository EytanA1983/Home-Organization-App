from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base

# Many-to-many relationship: Tasks can have multiple tags
task_tag_association = Table(
    'task_tag_association',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False, index=True)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM, index=True)
    due_date = Column(DateTime(timezone=True), nullable=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    google_calendar_event_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner = relationship("User", back_populates="tasks", foreign_keys=[owner_id])
    room = relationship("Room", back_populates="tasks")
    
    # Many-to-many relationships
    packages = relationship(
        "Package",
        secondary="task_package_association",
        back_populates="tasks"
    )
    tags = relationship(
        "Tag",
        secondary="task_tag_association",
        back_populates="tasks"
    )
    
    # History relationship
    history = relationship("TaskHistory", back_populates="task", cascade="all, delete-orphan", order_by="TaskHistory.created_at.desc()")
