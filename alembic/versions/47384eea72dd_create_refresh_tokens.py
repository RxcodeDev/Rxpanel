"""create refresh tokens

Revision ID: 47384eea72dd
Revises: 002_sites
Create Date: 2026-04-30 18:33:30.123111

"""

from alembic import op
import sqlalchemy as sa

revision = "002_refresh_tokens"
down_revision = "001_users"


def upgrade():
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.UUID(), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column('token', sa.String(500), nullable=False, unique=True),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )


def downgrade():
    op.drop_table('refresh_tokens')