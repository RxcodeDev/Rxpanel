"""create password reset tokens

Revision ID: 3d4cad2a8fc5
Revises: 003_refresh_tokens
Create Date: 2026-04-30 18:35:33.916126

"""

from alembic import op
import sqlalchemy as sa

revision = "004_password_reset_tokens"
down_revision = "003_sites"


def upgrade():
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.UUID(), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column('token', sa.String(255), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )


def downgrade():
    op.drop_table('password_reset_tokens')