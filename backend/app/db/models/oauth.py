"""OAuth account model for third-party authentication"""
from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.user import User


class OAuthAccount(Base):
    """OAuth account for third-party login (Google, etc.)"""
    __tablename__ = "oauth_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    oauth_name: Mapped[str] = mapped_column(String(length=100), nullable=False)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    account_id: Mapped[str] = mapped_column(String(length=320), nullable=False)
    account_email: Mapped[Optional[str]] = mapped_column(String(length=320), nullable=True)
    
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="cascade"), 
        nullable=False,
        index=True
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="oauth_accounts")
    
    def __repr__(self) -> str:
        return f"<OAuthAccount(id={self.id}, oauth_name='{self.oauth_name}', user_id={self.user_id})>"
