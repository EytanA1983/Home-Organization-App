"""Add position fields for drag & drop

Revision ID: 002_add_position_fields
Revises: 001_add_notification_subscription_table
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_position_fields'
down_revision = '001_add_notification_subscription'
branch_labels = None
depends_on = None


def upgrade():
    # Add position field to tasks
    op.add_column('tasks', sa.Column('position', sa.Integer(), nullable=True, server_default='0'))
    
    # Add position field to categories
    op.add_column('categories', sa.Column('position', sa.Integer(), nullable=True, server_default='0'))
    
    # Add position field to todos
    op.add_column('todos', sa.Column('position', sa.Integer(), nullable=True, server_default='0'))
    
    # Update existing records to have position based on creation order
    # This will be done in a separate data migration if needed


def downgrade():
    # Remove position fields
    op.drop_column('todos', 'position')
    op.drop_column('categories', 'position')
    op.drop_column('tasks', 'position')
