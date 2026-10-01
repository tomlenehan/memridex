"""Add profile image URL to users.

Revision ID: d91e0a43b7c2
Revises: 46e2bc07d9ab
"""

from alembic import op
import sqlalchemy as sa

revision = "d91e0a43b7c2"
down_revision = "46e2bc07d9ab"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user", sa.Column("profile_image_url", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("user", "profile_image_url")
