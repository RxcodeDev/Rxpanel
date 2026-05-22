"""add is_deleted flag to users

Revision ID: 012_add_is_deleted_users
Revises: 011_add_company_editor
Create Date: 2026-05-21
"""

from alembic import op
import sqlalchemy as sa

revision = "012_add_is_deleted_users"
down_revision = "011_add_company_editor"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("users", "is_deleted")
