"""User-related models: User, Role, UserRole"""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.room import RoomShare
    from app.db.models.oauth import OAuthAccount


class Role(Base):
    """Roles for users (owner, member, viewer, etc.)"""
    __tablename__ = "roles"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)  # owner, member, viewer
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Relationships
    user_roles: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="role")


class User(Base):
    """Main user model"""
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # שם מלא

    # Google OAuth token (optional)
    google_refresh_token: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Relationships
    roles: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="user")
    shared_rooms: Mapped[List["RoomShare"]] = relationship(
        "RoomShare", 
        back_populates="user", 
        foreign_keys="RoomShare.user_id"
    )
    oauth_accounts: Mapped[List["OAuthAccount"]] = relationship("OAuthAccount", back_populates="user")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"


class UserRole(Base):
    """Association table for user roles"""
    __tablename__ = "user_roles"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    role_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("roles.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="roles")
    role: Mapped["Role"] = relationship("Role", back_populates="user_roles")
