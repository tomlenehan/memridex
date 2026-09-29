"""Cache generated constellation overview proposals and limit refreshes.

Revision ID: 7c2b49de51a8
Revises: 2d1e7b9c4a60
"""
from alembic import op
import sqlalchemy as sa

revision = "7c2b49de51a8"
down_revision = "2d1e7b9c4a60"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("constellation", sa.Column("proposal_source_hash", sa.String(), nullable=True))
    op.add_column("constellation", sa.Column("proposal_text", sa.String(), nullable=True))
    op.add_column("constellation", sa.Column("proposal_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("constellation", "proposal_at")
    op.drop_column("constellation", "proposal_text")
    op.drop_column("constellation", "proposal_source_hash")
