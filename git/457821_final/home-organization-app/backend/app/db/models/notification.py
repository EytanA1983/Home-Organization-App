"""Notification subscription model for Web Push"""
from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.user import User


class NotificationSubscription(Base):
    """
    WebPush subscription for a user.
    Each user can have multiple subscriptions (multiple devices).
    """
    __tablename__ = "notification_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    endpoint: Mapped[str] = mapped_column(String, nullable=False)
    p256dh: Mapped[str] = mapped_column(String, nullable=False)  # base64-url-encoded key
    auth: Mapped[str] = mapped_column(String, nullable=False)  # base64-url-encoded auth secret
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", backref="push_subscriptions")
    
    def __repr__(self) -> str:
        return f"<NotificationSubscription(id={self.id}, user_id={self.user_id})>"
