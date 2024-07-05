"""fixing enums

Revision ID: ab1903954c17
Revises: 3b9af8530cdc
Create Date: 2024-06-15 05:01:32.391412

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

# revision identifiers, used by Alembic.
revision = 'ab1903954c17'
down_revision = '3b9af8530cdc'
branch_labels = None
depends_on = None

# Define new ENUM types
new_conversation_status = ENUM(
    'INACTIVE', 'ACTIVE', 'READY_FOR_SUMMARY', 'COMPLETE', name='conversationstatus',
    create_type=False
)

new_chat_message_sender = ENUM(
    'USER', 'AI', 'FINAL', name='chatmessagesender', create_type=False
)

def upgrade():
    # Drop existing enum types if necessary
    op.execute('DROP TYPE IF EXISTS conversationstatus CASCADE')
    op.execute('DROP TYPE IF EXISTS chatmessagesender CASCADE')

    # Create the new ENUM types
    new_conversation_status.create(op.get_bind(), checkfirst=True)
    new_chat_message_sender.create(op.get_bind(), checkfirst=True)

    # Ensure the status column exists in the conversation table
    op.add_column('conversation', sa.Column('status', new_conversation_status, nullable=False, server_default='INACTIVE'))
    op.add_column('chatmessage', sa.Column('sender_type', new_chat_message_sender, nullable=False, server_default='USER'))

    # Alter the columns to use the new ENUM types
    op.alter_column(
        'conversation', 'status',
        type_=new_conversation_status,
        existing_type=sa.Enum('INACTIVE', 'ACTIVE', 'COMPLETE', name='conversationstatus'),  # Previous enum values
        existing_nullable=False,
    )

    op.alter_column(
        'chatmessage', 'sender_type',
        type_=new_chat_message_sender,
        existing_type=sa.Enum('USER', 'AI', name='chatmessagesender'),  # Previous enum values
        existing_nullable=False,
    )

def downgrade():
    # Revert the columns to use their previous types
    op.alter_column(
        'conversation', 'status',
        type_=sa.Enum('INACTIVE', 'ACTIVE', 'COMPLETE', name='conversationstatus'),  # Previous enum values
        existing_type=new_conversation_status,
        existing_nullable=False,
    )

    op.alter_column(
        'chatmessage', 'sender_type',
        type_=sa.Enum('USER', 'AI', name='chatmessagesender'),  # Previous enum values
        existing_type=new_chat_message_sender,
        existing_nullable=False,
    )

    # Drop the ENUM types
    new_conversation_status.drop(op.get_bind(), checkfirst=True)
    new_chat_message_sender.drop(op.get_bind(), checkfirst=True)
