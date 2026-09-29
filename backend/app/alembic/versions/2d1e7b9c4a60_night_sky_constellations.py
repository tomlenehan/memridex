"""Private constellations and reviewed public snapshots.

Revision ID: 2d1e7b9c4a60
Revises: c48d39a1e5af
"""
from alembic import op
import sqlalchemy as sa

revision = "2d1e7b9c4a60"
down_revision = "c48d39a1e5af"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "constellation",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("overview", sa.String(), nullable=False, server_default=""),
        sa.Column("source_hash", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("modified_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_constellation_owner_id", "constellation", ["owner_id"])
    op.create_table(
        "constellationmemory",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("constellation_id", sa.Integer(), sa.ForeignKey("constellation.id", ondelete="CASCADE"), nullable=False),
        sa.Column("story_id", sa.Integer(), sa.ForeignKey("storysummary.id", ondelete="CASCADE"), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("x", sa.Float(), nullable=True),
        sa.Column("y", sa.Float(), nullable=True),
        sa.Column("share_story", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("share_image", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.UniqueConstraint("constellation_id", "story_id"),
    )
    op.create_index("ix_constellationmemory_constellation_id", "constellationmemory", ["constellation_id"])
    op.create_index("ix_constellationmemory_story_id", "constellationmemory", ["story_id"])
    op.create_table(
        "constellationlink",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("constellation_id", sa.Integer(), sa.ForeignKey("constellation.id", ondelete="CASCADE"), nullable=False),
        sa.Column("relationship_id", sa.Integer(), sa.ForeignKey("storyrelationship.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("constellation_id", "relationship_id"),
    )
    op.create_index("ix_constellationlink_constellation_id", "constellationlink", ["constellation_id"])
    op.create_index("ix_constellationlink_relationship_id", "constellationlink", ["relationship_id"])
    op.create_table(
        "publishedconstellation",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("constellation_id", sa.Integer(), sa.ForeignKey("constellation.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("overview", sa.String(), nullable=False),
        sa.Column("author_name", sa.String(), nullable=False),
        sa.Column("author_level", sa.Integer(), nullable=False),
        sa.Column("published_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_publishedconstellation_constellation_id", "publishedconstellation", ["constellation_id"])
    op.create_index("ix_publishedconstellation_owner_id", "publishedconstellation", ["owner_id"])
    op.create_index("ix_publishedconstellation_published_at", "publishedconstellation", ["published_at"])
    op.create_table(
        "publishedmemory",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("publication_id", sa.Integer(), sa.ForeignKey("publishedconstellation.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_story_id", sa.Integer(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("story_text", sa.String(), nullable=True),
        sa.Column("image_filename", sa.String(), nullable=True),
        sa.Column("x", sa.Float(), nullable=True),
        sa.Column("y", sa.Float(), nullable=True),
        sa.UniqueConstraint("publication_id", "source_story_id"),
    )
    op.create_index("ix_publishedmemory_publication_id", "publishedmemory", ["publication_id"])
    op.create_table(
        "publishedlink",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("publication_id", sa.Integer(), sa.ForeignKey("publishedconstellation.id", ondelete="CASCADE"), nullable=False),
        sa.Column("story_a_id", sa.Integer(), nullable=False),
        sa.Column("story_b_id", sa.Integer(), nullable=False),
        sa.UniqueConstraint("publication_id", "story_a_id", "story_b_id"),
    )
    op.create_index("ix_publishedlink_publication_id", "publishedlink", ["publication_id"])
    op.create_table(
        "constellationvote",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("publication_id", sa.Integer(), sa.ForeignKey("publishedconstellation.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("publication_id", "user_id"),
    )
    op.create_index("ix_constellationvote_publication_id", "constellationvote", ["publication_id"])
    op.create_index("ix_constellationvote_user_id", "constellationvote", ["user_id"])
    op.create_table(
        "constellationreport",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("publication_id", sa.Integer(), sa.ForeignKey("publishedconstellation.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("publication_id", "user_id"),
    )
    op.create_index("ix_constellationreport_publication_id", "constellationreport", ["publication_id"])
    op.create_index("ix_constellationreport_user_id", "constellationreport", ["user_id"])


def downgrade() -> None:
    for table in (
        "constellationreport", "constellationvote", "publishedlink", "publishedmemory", "publishedconstellation",
        "constellationlink", "constellationmemory", "constellation",
    ):
        op.drop_table(table)
