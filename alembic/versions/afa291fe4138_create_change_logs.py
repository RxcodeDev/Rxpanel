"""create change logs

Revision ID: afa291fe4138
Revises: 004_password_reset_tokens
Create Date: 2026-04-30 18:36:55.795948

"""
from alembic import op
import sqlalchemy as sa

revision = "005_change_logs"
down_revision = "004_password_reset_tokens"


def upgrade():
    op.create_table(
        'change_logs',
        sa.Column('id', sa.UUID(), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('section', sa.String(100), nullable=False),
        sa.Column('change_type', sa.String(50), nullable=False),
        sa.Column('payload_snapshot', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )


def downgrade():
    op.drop_table('change_logs')