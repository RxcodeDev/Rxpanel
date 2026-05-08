"""create users table

Revision ID: 49bd08f3c608
Revises: 
Create Date: 2026-04-30 18:30:46.520084

"""

from alembic import op
import sqlalchemy as sa

revision = "001_users"
down_revision = None


def upgrade():
    userrole = sa.Enum('admin', 'viewer', name='userrole')
    userrole.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', userrole, nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)


def downgrade():
    op.drop_index('ix_users_username', table_name='users')
    op.drop_index('ix_users_email', table_name='users')

    sa.Enum(name='userrole').drop(op.get_bind(), checkfirst=True)

    op.drop_table('users')