from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

# Many-to-many relationship: Tasks can belong to multiple packages
task_package_association = Table(
    'task_package_association',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True),
    Column('package_id', Integer, ForeignKey('packages.id', ondelete='CASCADE'), primary_key=True)
)


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_completed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="packages")
    
    # Many-to-many relationship with tasks
    tasks = relationship(
        "Task",
        secondary=task_package_association,
        back_populates="packages"
    )
