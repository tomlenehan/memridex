"""Persistent memory XP and daily streak history.

Revision ID: a81d92f7c603
Revises: 6f9e2c7a1b34
"""
from alembic import op
import sqlalchemy as sa

revision = "a81d92f7c603"
down_revision = "6f9e2c7a1b34"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("memoryxp",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
        sa.Column("conversation_key", sa.Integer(), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("earned_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "conversation_key"))
    op.create_index("ix_memoryxp_user_id", "memoryxp", ["user_id"])
    op.create_table("memoryday",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
        sa.Column("activity_date", sa.Date(), nullable=False),
        sa.UniqueConstraint("user_id", "activity_date"))
    op.create_index("ix_memoryday_user_id", "memoryday", ["user_id"])
    # Existing stories count too; duplicate summaries never multiply rewards.
    op.execute("""INSERT INTO memoryxp (user_id, conversation_key, points, earned_at)
        SELECT c.user_id, s.conversation_id, 25, MIN(s.created_at)
        FROM storysummary s JOIN conversation c ON c.id = s.conversation_id
        WHERE c.user_turn_count > 0 OR EXISTS (
            SELECT 1 FROM chatmessage m WHERE m.conversation_id = c.id AND m.sender_type = 'USER')
        GROUP BY c.user_id, s.conversation_id""")
    op.execute("""INSERT INTO memoryday (user_id, activity_date)
        SELECT DISTINCT user_id, earned_at::date FROM memoryxp""")


def downgrade() -> None:
    op.drop_table("memoryday")
    op.drop_table("memoryxp")
