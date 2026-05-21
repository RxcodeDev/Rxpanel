"""add icon and icon_color to sites

Revision ID: 008_sites_icon
Revises: 007_change_logs_indexes
Create Date: 2026-05-20
"""

from alembic import op
import sqlalchemy as sa

revision = "008_sites_icon"
down_revision = "007_change_logs_indexes"


def upgrade():
    op.add_column("sites", sa.Column("icon", sa.String(length=64), nullable=True))
    op.add_column("sites", sa.Column("icon_color", sa.String(length=16), nullable=True))


def downgrade():
    op.drop_column("sites", "icon_color")
    op.drop_column("sites", "icon")
