from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    color = Column(String, default="#9d7f5f")  # Default earth tone color
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Many-to-many relationship with tasks
    tasks = relationship(
        "Task",
        secondary="task_tag_association",
        back_populates="tags"
    )
