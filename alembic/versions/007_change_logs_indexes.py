"""add indexes to change_logs

Revision ID: 007_change_logs_indexes
Revises: 006_sites_api_token
Create Date: 2026-05-04
"""

from alembic import op

revision = "007_change_logs_indexes"
down_revision = "006_sites_api_token"


def upgrade():
    op.create_index("ix_change_logs_site_id", "change_logs", ["site_id"])
    op.create_index("ix_change_logs_created_at", "change_logs", ["created_at"])


def downgrade():
    op.drop_index("ix_change_logs_created_at", table_name="change_logs")
    op.drop_index("ix_change_logs_site_id", table_name="change_logs")
