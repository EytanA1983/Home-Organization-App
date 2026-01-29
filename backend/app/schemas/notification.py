from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum


class NotificationType(str, Enum):
    """Notification types"""
    TASK_REMINDER = "task_reminder"
    TASK_DUE = "task_due"
    TASK_COMPLETED = "task_completed"
    SYSTEM = "system"


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool
    related_task_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationSubscriptionRead(BaseModel):
    id: int
    user_id: int
    endpoint: str
    p256dh: str
    auth: str
    created_at: datetime

    class Config:
        from_attributes = True
