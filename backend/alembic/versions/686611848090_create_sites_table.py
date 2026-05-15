"""create sites table

Revision ID: 686611848090
Revises: 002_refresh_tokens
Create Date: 2026-04-30 18:32:10.376262

"""

from alembic import op

revision = "003_sites"
down_revision = "002_refresh_tokens"


def upgrade():
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE sitestatus AS ENUM ('active', 'inactive', 'maintenance', 'error');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS sites (
            id          SERIAL       PRIMARY KEY,
            name        VARCHAR(255) NOT NULL,
            url         VARCHAR(2048) NOT NULL,
            description TEXT,
            status      sitestatus   DEFAULT 'active',
            is_ssl      BOOLEAN      NOT NULL DEFAULT false,
            owner_id    UUID         NOT NULL REFERENCES users(id),
            created_at  TIMESTAMP    DEFAULT now(),
            updated_at  TIMESTAMP    DEFAULT now()
        )
    """)

    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_sites_url ON sites (url)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS sites")
    op.execute("DROP TYPE  IF EXISTS sitestatus")
