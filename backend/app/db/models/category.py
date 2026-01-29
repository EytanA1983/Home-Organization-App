"""Category model for organizing tasks"""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.user import User
    from app.db.models.task import Task


class Category(Base):
    """Task categories (clothes, books, sentimental items, etc.)"""
    __tablename__ = "categories"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)  # ex: "בגדים"
    icon: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # icon name/file
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id"), 
        nullable=False, 
        index=True
    )
    position: Mapped[int] = mapped_column(Integer, default=0)  # display order (for drag & drop)

    # Relationships
    user: Mapped["User"] = relationship("User", backref="categories")
    tasks: Mapped[List["Task"]] = relationship(
        "Task", 
        back_populates="category", 
        cascade="all, delete"
    )
    
    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name='{self.name}')>"
