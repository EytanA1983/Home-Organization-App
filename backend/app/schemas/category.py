"""Category schemas for API validation and serialization"""
from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class CategoryBase(BaseModel):
    """Base schema for Category"""
    name: str = Field(..., min_length=1, max_length=50, description="Category name")
    icon: Optional[str] = Field(None, max_length=50, description="Icon name/emoji")


class CategoryCreate(CategoryBase):
    """Schema for creating a new category"""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating an existing category (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    icon: Optional[str] = Field(None, max_length=50)
    position: Optional[int] = Field(None, description="Display order for drag & drop")


class CategoryRead(CategoryBase):
    """Schema for reading category data"""
    id: int
    user_id: int
    position: int = 0

    model_config = ConfigDict(from_attributes=True)
