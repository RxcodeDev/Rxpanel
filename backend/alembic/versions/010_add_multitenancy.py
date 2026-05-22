"""add company roles, invite_tokens, company_id to users and sites

Revision ID: 010_add_multitenancy
Revises: 009_add_companies
Create Date: 2026-05-21
"""

from alembic import op
import sqlalchemy as sa

revision = "010_add_multitenancy"
down_revision = "009_add_companies"


def upgrade():
    # Nuevos valores al enum existente
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'company_admin'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'company_viewer'")

    # company_id en users (nullable — admin/viewer no pertenecen a empresa)
    op.execute("""
        ALTER TABLE users
        ADD COLUMN company_id INTEGER REFERENCES companies(id)
    """)

    # company_id en sites (nullable — sitios de rxcode no tienen empresa)
    op.execute("""
        ALTER TABLE sites
        ADD COLUMN company_id INTEGER REFERENCES companies(id)
    """)

    # Tabla de tokens de invitación
    op.execute("""
        CREATE TABLE invite_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            token VARCHAR(64) UNIQUE NOT NULL,
            company_id INTEGER NOT NULL REFERENCES companies(id),
            is_used BOOLEAN NOT NULL DEFAULT FALSE,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)


def downgrade():
    op.execute("DROP TABLE invite_tokens")
    op.execute("ALTER TABLE sites DROP COLUMN company_id")
    op.execute("ALTER TABLE users DROP COLUMN company_id")
    # No se pueden eliminar valores de un enum en Postgres sin recrearlo
