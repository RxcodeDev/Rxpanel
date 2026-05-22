"""reemplaza el unique global de sites.url por un unique parcial (solo activos)

El unique global impedía reutilizar la URL de un sitio borrado con soft delete
(is_active=False). Se sustituye por un unique parcial que solo aplica a sitios
activos, mas un indice normal para las busquedas por URL.

Revision ID: 013_sites_url_partial_unique
Revises: 012_add_is_deleted_users
Create Date: 2026-05-21
"""

from alembic import op

revision = "013_sites_url_partial_unique"
down_revision = "012_add_is_deleted_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_sites_url")
    op.execute("CREATE INDEX ix_sites_url ON sites (url)")
    op.execute(
        "CREATE UNIQUE INDEX uq_sites_url_active ON sites (url) WHERE is_active"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_sites_url_active")
    op.execute("DROP INDEX IF EXISTS ix_sites_url")
    op.execute("CREATE UNIQUE INDEX ix_sites_url ON sites (url)")
