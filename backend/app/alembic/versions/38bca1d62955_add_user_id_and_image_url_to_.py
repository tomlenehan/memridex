"""add user_id and image_url to StorySummary

Revision ID: 38bca1d62955
Revises: 8035c789ca09
Create Date: 2024-06-24 23:52:47.375446

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '38bca1d62955'
down_revision = '8035c789ca09'
branch_labels = None
depends_on = None


def upgrade():
    # ### Step 1: Add the user_id column as nullable ###
    op.add_column('storysummary', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('storysummary', sa.Column('image_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

    op.create_foreign_key('fk_storysummary_user_id', 'storysummary', 'user', ['user_id'], ['id'])


def downgrade():
    op.drop_constraint('fk_storysummary_user_id', 'storysummary', type_='foreignkey')
    op.drop_column('storysummary', 'image_url')
    op.drop_column('storysummary', 'user_id')
