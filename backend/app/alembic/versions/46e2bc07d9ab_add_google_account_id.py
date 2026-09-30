"""Add stable Google account identity to users.

Revision ID: 46e2bc07d9ab
Revises: 7c2b49de51a8
"""

from alembic import op
import sqlalchemy as sa

revision = "46e2bc07d9ab"
down_revision = "7c2b49de51a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user", sa.Column("google_sub", sa.String(), nullable=True))
    op.create_index("ix_user_google_sub", "user", ["google_sub"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_user_google_sub", table_name="user")
    op.drop_column("user", "google_sub")
