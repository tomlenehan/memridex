"""Add pgvector story embeddings and user-confirmed relationships.

Revision ID: 6f9e2c7a1b34
Revises: f29a8de6c414
Create Date: 2026-09-27
"""

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


revision = "6f9e2c7a1b34"
down_revision = "f29a8de6c414"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table(
        "storyembedding",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("story_summary_id", sa.Integer(), nullable=False),
        sa.Column("embedding", Vector(1536), nullable=False),
        sa.Column(
            "embedding_model",
            sa.String(),
            nullable=False,
            server_default="text-embedding-3-small",
        ),
        sa.Column("content_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("modified_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(
            ["story_summary_id"], ["storysummary.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint("story_summary_id"),
    )
    op.create_index("ix_storyembedding_user_id", "storyembedding", ["user_id"])
    op.create_index(
        "ix_storyembedding_story_summary_id",
        "storyembedding",
        ["story_summary_id"],
    )
    op.create_table(
        "storyrelationship",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("story_a_id", sa.Integer(), nullable=False),
        sa.Column("story_b_id", sa.Integer(), nullable=False),
        sa.Column("note", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("story_a_id < story_b_id", name="story_relationship_ordered_ids"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(
            ["story_a_id"], ["storysummary.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["story_b_id"], ["storysummary.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint("user_id", "story_a_id", "story_b_id"),
    )
    op.create_index("ix_storyrelationship_user_id", "storyrelationship", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_storyrelationship_user_id", table_name="storyrelationship")
    op.drop_table("storyrelationship")
    op.drop_index(
        "ix_storyembedding_story_summary_id", table_name="storyembedding"
    )
    op.drop_index("ix_storyembedding_user_id", table_name="storyembedding")
    op.drop_table("storyembedding")
