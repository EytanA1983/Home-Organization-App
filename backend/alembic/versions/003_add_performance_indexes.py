"""Add performance indexes for common queries

Revision ID: 003_add_performance_indexes
Revises: 002_add_position_fields
Create Date: 2026-01-27 12:00:00.000000

This migration adds indexes on frequently queried columns to improve performance:
- user_id columns for filtering by user
- room_id, category_id for filtering tasks
- created_at for sorting and date range queries
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '003_add_performance_indexes'
down_revision = '002_add_position_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # === Tasks table indexes ===
    # Filter tasks by user (most common query)
    op.create_index("ix_tasks_user_id", "tasks", ["user_id"])
    
    # Filter tasks by room
    op.create_index("ix_tasks_room_id", "tasks", ["room_id"])
    
    # Filter tasks by category
    op.create_index("ix_tasks_category_id", "tasks", ["category_id"])
    
    # Sort/filter by creation date
    op.create_index("ix_tasks_created_at", "tasks", ["created_at"])
    
    # Composite index for common query: user's tasks sorted by date
    op.create_index("ix_tasks_user_created", "tasks", ["user_id", "created_at"])
    
    # Composite index for room tasks filtered by user
    op.create_index("ix_tasks_room_user", "tasks", ["room_id", "user_id"])
    
    # === Rooms table indexes ===
    # Filter rooms by owner
    op.create_index("ix_rooms_owner_id", "rooms", ["owner_id"])
    
    # === Categories table indexes ===
    # Filter categories by user
    op.create_index("ix_categories_user_id", "categories", ["user_id"])
    
    # === Todos table indexes ===
    # Filter todos by task
    op.create_index("ix_todos_task_id", "todos", ["task_id"])
    
    # === RoomShare table indexes ===
    # Filter room shares by room
    op.create_index("ix_room_shares_room_id", "room_shares", ["room_id"])
    
    # Filter room shares by user (to get all rooms shared with a user)
    op.create_index("ix_room_shares_user_id", "room_shares", ["user_id"])


def downgrade() -> None:
    # Drop all indexes in reverse order
    op.drop_index("ix_room_shares_user_id", table_name="room_shares")
    op.drop_index("ix_room_shares_room_id", table_name="room_shares")
    op.drop_index("ix_todos_task_id", table_name="todos")
    op.drop_index("ix_categories_user_id", table_name="categories")
    op.drop_index("ix_rooms_owner_id", table_name="rooms")
    op.drop_index("ix_tasks_room_user", table_name="tasks")
    op.drop_index("ix_tasks_user_created", table_name="tasks")
    op.drop_index("ix_tasks_created_at", table_name="tasks")
    op.drop_index("ix_tasks_category_id", table_name="tasks")
    op.drop_index("ix_tasks_room_id", table_name="tasks")
    op.drop_index("ix_tasks_user_id", table_name="tasks")
