"""Fix Image model back-relationship to prompts

Revision ID: 6a4d9e8633b6
Revises: b8387de70a69
Create Date: 2024-06-09 04:07:16.472858

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '6a4d9e8633b6'
down_revision = 'b8387de70a69'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###
