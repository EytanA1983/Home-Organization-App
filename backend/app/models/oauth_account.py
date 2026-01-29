from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseOAuthAccountTable
from app.db.base import Base


class OAuthAccount(SQLAlchemyBaseOAuthAccountTable[int], Base):
    __tablename__ = "oauth_accounts"

    id = Column(Integer, primary_key=True, index=True)
    oauth_name = Column(String(length=100), nullable=False)
    access_token = Column(Text, nullable=False)
    expires_at = Column(Integer, nullable=True)
    refresh_token = Column(Text, nullable=True)
    account_id = Column(String(length=320), nullable=False)
    account_email = Column(String(length=320), nullable=True)
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="cascade"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="oauth_accounts")
