"""add api_token and is_active to sites

Revision ID: 006_sites_api_token
Revises: 005_change_logs
Create Date: 2026-05-03
"""

from alembic import op
import sqlalchemy as sa

revision = "006_sites_api_token"
down_revision = "005_change_logs"


def upgrade():
    op.add_column("sites", sa.Column("api_token", sa.Text(), nullable=True))
    op.add_column("sites", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))


def downgrade():
    op.drop_column("sites", "is_active")
    op.drop_column("sites", "api_token")
