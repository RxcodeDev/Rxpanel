"""create users table

Revision ID: 49bd08f3c608
Revises:
Create Date: 2026-04-30 18:30:46.520084

"""

from alembic import op

revision = "001_users"
down_revision = None


def upgrade():
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE userrole AS ENUM ('admin', 'viewer');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
            email       VARCHAR(255) NOT NULL,
            username    VARCHAR(255) NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            role        userrole     NOT NULL DEFAULT 'viewer',
            is_active   BOOLEAN      NOT NULL DEFAULT true,
            created_at  TIMESTAMP    DEFAULT now(),
            updated_at  TIMESTAMP    DEFAULT now()
        )
    """)

    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email    ON users (email)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS users")
    op.execute("DROP TYPE  IF EXISTS userrole")
