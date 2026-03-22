"""Add vision_boards table (My Vision Board MVP).

Revision ID: 012_add_vision_board
Revises: 011_daily_focus_completed_at
Create Date: 2026-03-21
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.sql import func


revision = "012_add_vision_board"
down_revision = "011_daily_focus_completed_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "vision_boards" in inspector.get_table_names():
        return
    op.create_table(
        "vision_boards",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("vision_statement", sa.Text(), nullable=False, server_default=""),
        sa.Column("intention_1", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("intention_2", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("intention_3", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("image_url", sa.String(length=2048), nullable=True),
        sa.Column("quote", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", name="uq_vision_boards_user_id"),
    )
    op.create_index("ix_vision_boards_id", "vision_boards", ["id"])
    op.create_index("ix_vision_boards_user_id", "vision_boards", ["user_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "vision_boards" not in inspector.get_table_names():
        return
    op.drop_index("ix_vision_boards_user_id", table_name="vision_boards")
    op.drop_index("ix_vision_boards_id", table_name="vision_boards")
    op.drop_table("vision_boards")
