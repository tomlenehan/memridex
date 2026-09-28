"""Persist when a story has enough detail to save.

Revision ID: c48d39a1e5af
Revises: a81d92f7c603
"""

from alembic import op
import sqlalchemy as sa

revision = "c48d39a1e5af"
down_revision = "a81d92f7c603"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "conversation",
        sa.Column("ready_to_save", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("conversation", "ready_to_save")
