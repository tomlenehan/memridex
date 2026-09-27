"""Add branching story node fields to conversations.

Revision ID: f29a8de6c414
Revises: 9b6f357367d2
Create Date: 2026-09-26
"""

from alembic import op
import sqlalchemy as sa


revision = "f29a8de6c414"
down_revision = "9b6f357367d2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "conversation",
        "user_story_prompt_id",
        existing_type=sa.Integer(),
        nullable=True,
    )
    op.add_column(
        "conversation", sa.Column("parent_conversation_id", sa.Integer(), nullable=True)
    )
    op.add_column(
        "conversation", sa.Column("node_title", sa.String(), nullable=True)
    )
    op.add_column(
        "conversation", sa.Column("node_prompt", sa.String(), nullable=True)
    )
    op.add_column(
        "conversation", sa.Column("branch_context", sa.String(), nullable=True)
    )
    op.add_column(
        "conversation",
        sa.Column("node_depth", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "conversation",
        sa.Column("user_turn_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_foreign_key(
        "conversation_parent_conversation_id_fkey",
        "conversation",
        "conversation",
        ["parent_conversation_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_conversation_parent_conversation_id",
        "conversation",
        ["parent_conversation_id"],
    )
    op.execute(
        """
        UPDATE conversation AS c
        SET node_prompt = p.prompt,
            node_title = LEFT(p.prompt, 72),
            user_turn_count = (
                SELECT COUNT(*)
                FROM chatmessage AS m
                WHERE m.conversation_id = c.id AND m.sender_type = 'USER'
            )
        FROM userstoryprompt AS p
        WHERE c.user_story_prompt_id = p.id
        """
    )
    op.execute(
        "UPDATE conversation SET node_title = 'A remembered moment' WHERE node_title IS NULL"
    )
    op.execute(
        """
        UPDATE conversation
        SET status = 'READY_FOR_SUMMARY'
        WHERE user_turn_count >= 4 AND status = 'ACTIVE'
        """
    )
    op.alter_column(
        "conversation",
        "node_title",
        existing_type=sa.String(),
        nullable=False,
        server_default="A remembered moment",
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM conversation WHERE user_story_prompt_id IS NULL) THEN
                RAISE EXCEPTION 'Cannot downgrade story nodes while promptless conversations exist';
            END IF;
        END $$;
        """
    )
    op.alter_column(
        "conversation",
        "user_story_prompt_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.drop_index("ix_conversation_parent_conversation_id", table_name="conversation")
    op.drop_constraint(
        "conversation_parent_conversation_id_fkey", "conversation", type_="foreignkey"
    )
    op.drop_column("conversation", "user_turn_count")
    op.drop_column("conversation", "node_depth")
    op.drop_column("conversation", "branch_context")
    op.drop_column("conversation", "node_prompt")
    op.drop_column("conversation", "node_title")
    op.drop_column("conversation", "parent_conversation_id")
