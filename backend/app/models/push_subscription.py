from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class PushPlatform(str, enum.Enum):
    WEB = "web"
    ANDROID = "android"
    IOS = "ios"


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform = Column(Enum(PushPlatform), nullable=False, default=PushPlatform.WEB)
    
    # Web Push fields
    endpoint = Column(String, nullable=True)  # Web Push endpoint URL
    p256dh = Column(Text, nullable=True)  # Web Push public key
    auth = Column(Text, nullable=True)  # Web Push auth secret
    
    # FCM fields
    fcm_token = Column(Text, nullable=True)  # FCM registration token
    
    # Metadata
    user_agent = Column(String, nullable=True)
    device_info = Column(JSON, nullable=True)  # Additional device info
    is_active = Column(Boolean, default=True, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="push_subscriptions")
