"""Per-user vision board (statement, intentions, optional image & quote)."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class VisionBoard(Base):
    """One row per user — MVP fields for “My Vision Board”."""

    __tablename__ = "vision_boards"
    __table_args__ = (UniqueConstraint("user_id", name="uq_vision_boards_user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vision_statement: Mapped[str] = mapped_column(Text, nullable=False, default="")
    intention_1: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    intention_2: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    intention_3: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    image_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    quote: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
