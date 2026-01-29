"""User schemas for API validation and serialization"""
from __future__ import annotations
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class Token(BaseModel):
    """Response model for login/refresh endpoints"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Access token expiry in seconds


class RefreshTokenRequest(BaseModel):
    """Request model for token refresh"""
    refresh_token: str = Field(..., description="The refresh token to exchange for a new access token")


class UserBase(BaseModel):
    """Base schema for User"""
    email: EmailStr = Field(..., description="User email address")


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=8, description="User password (min 8 characters)")
    full_name: Optional[str] = Field(None, max_length=100, description="User's full name")


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    full_name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserRead(UserBase):
    """Schema for reading user data"""
    id: int
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserRead):
    """Schema for user data as stored in DB (includes hashed password)"""
    hashed_password: str


class UserProfile(BaseModel):
    """Schema for user profile (public view)"""
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class PasswordChange(BaseModel):
    """Schema for password change request"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")
