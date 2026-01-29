"""Audit log model for tracking changes"""
from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING, Optional
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.user import User


class AuditAction(enum.Enum):
    """Types of auditable actions"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class AuditLog(Base):
    """
    History table - tracks all changes to models.
    Shows: who, when, what changed (old value → new value)
    """
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Who performed the action
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("users.id"), 
        nullable=True
    )  # NULL if not logged in
    user_email: Mapped[Optional[str]] = mapped_column(
        String, 
        nullable=True
    )  # save email in case user is deleted
    
    # What changed
    table_name: Mapped[str] = mapped_column(
        String, 
        nullable=False, 
        index=True
    )  # table name (tasks, rooms, etc.)
    record_id: Mapped[int] = mapped_column(
        Integer, 
        nullable=False, 
        index=True
    )  # ID of changed record
    
    # Action type
    action: Mapped[AuditAction] = mapped_column(
        Enum(AuditAction), 
        nullable=False, 
        index=True
    )
    
    # What changed - JSON with old/new values
    old_values: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True
    )  # JSON string of old values
    new_values: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True
    )  # JSON string of new values
    changed_fields: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True
    )  # list of changed fields (JSON array)
    
    # When
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        nullable=False, 
        index=True
    )
    
    # Additional info
    ip_address: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # User's IP address
    user_agent: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # User agent
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", backref="audit_logs")
    
    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, table={self.table_name}, action={self.action.value})>"
