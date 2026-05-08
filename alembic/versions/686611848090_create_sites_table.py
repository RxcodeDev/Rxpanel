"""create sites table

Revision ID: 686611848090
Revises: 001_users
Create Date: 2026-04-30 18:32:10.376262

"""
from alembic import op
import sqlalchemy as sa

revision = "003_sites"
down_revision = "002_refresh_tokens"


def upgrade():
    sitestatus = sa.Enum(
        'active', 'inactive', 'maintenance', 'error',
        name='sitestatus'
    )
    sitestatus.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'sites',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('url', sa.String(2048), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('status', sitestatus),
        sa.Column('is_ssl', sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
    )

    op.create_index('ix_sites_url', 'sites', ['url'], unique=True)


def downgrade():
    op.drop_index('ix_sites_url', table_name='sites')
    op.drop_table('sites')

    sa.Enum(name='sitestatus').drop(op.get_bind(), checkfirst=True)

def downgrade():
    op.drop_index('ix_sites_url', table_name='sites')
    op.drop_table('sites')