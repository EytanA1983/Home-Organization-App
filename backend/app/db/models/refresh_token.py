"""Refresh Token model for JWT token renewal and revocation"""
from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.user import User


class RefreshToken(Base):
    """
    Refresh tokens for JWT authentication.
    
    - Each refresh token has a unique jti (JWT ID)
    - Tokens can be revoked individually or all tokens for a user
    - Expired tokens are automatically cleaned up by a scheduled task
    """
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    
    # JWT ID - unique identifier for this token
    jti: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    
    # Token metadata
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Revocation
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Device/session info (optional, for multi-device management)
    device_info: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # User agent or device name
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv4 or IPv6
    
    # Relationships
    user: Mapped["User"] = relationship("User", backref="refresh_tokens")
    
    # Indexes for common queries
    __table_args__ = (
        Index("ix_refresh_tokens_user_revoked", "user_id", "revoked"),
        Index("ix_refresh_tokens_jti_revoked", "jti", "revoked"),
    )
    
    def is_valid(self) -> bool:
        """Check if token is still valid (not revoked and not expired)"""
        return not self.revoked and self.expires_at > datetime.utcnow()
    
    def revoke(self) -> None:
        """Revoke this token"""
        self.revoked = True
        self.revoked_at = datetime.utcnow()
    
    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, revoked={self.revoked})>"
