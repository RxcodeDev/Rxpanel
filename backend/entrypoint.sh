#!/bin/sh
set -e

echo "→ Aplicando migraciones..."
alembic upgrade head

echo "→ Creando usuario admin si no existe..."
python -m app.scripts.seed_admin

echo "→ Iniciando servidor..."
exec "$@"
