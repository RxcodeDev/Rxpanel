"""add company_editor role to userrole enum

Revision ID: 011_add_company_editor
Revises: 010_add_multitenancy
Create Date: 2026-05-21
"""

from alembic import op

revision = "011_add_company_editor"
down_revision = "010_add_multitenancy"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL no permite DROP VALUE, solo ADD VALUE
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'company_editor'")


def downgrade() -> None:
    # No es posible eliminar valores de un enum en PostgreSQL sin recrearlo
    pass
