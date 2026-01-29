from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from fastapi_users.db import SQLAlchemyBaseUserTable
from app.db.base import Base


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    
    # FastAPI-Users fields
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Google Calendar OAuth
    google_calendar_token = Column(Text, nullable=True)
    google_calendar_refresh_token = Column(Text, nullable=True)
    google_oauth_account_id = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    packages = relationship("Package", back_populates="owner", cascade="all, delete-orphan")
    rooms = relationship("Room", back_populates="owner", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan", foreign_keys="Task.owner_id")
    todo_lists = relationship("TodoList", back_populates="owner", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    task_history_changes = relationship("TaskHistory", foreign_keys="TaskHistory.changed_by_id")
    push_subscriptions = relationship("PushSubscription", back_populates="user", cascade="all, delete-orphan")
    oauth_accounts = relationship("OAuthAccount", back_populates="user", cascade="all, delete-orphan")
