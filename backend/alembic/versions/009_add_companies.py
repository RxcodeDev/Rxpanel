"""add companies table

Revision ID: 009_add_companies
Revises: 008_sites_icon
Create Date: 2026-05-21
"""

from alembic import op
import sqlalchemy as sa

revision = "009_add_companies"
down_revision = "008_sites_icon"


def upgrade():
    op.execute("""
        CREATE TABLE companies (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)


def downgrade():
    op.execute("DROP TABLE companies")
