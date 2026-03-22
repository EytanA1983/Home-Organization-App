from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PackageBase(BaseModel):
    name: str
    description: Optional[str] = None


class PackageCreate(PackageBase):
    pass


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None


class PackageResponse(PackageBase):
    id: int
    owner_id: int
    is_completed: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
