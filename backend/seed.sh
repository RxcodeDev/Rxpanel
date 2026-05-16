#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."

# Cargar variables del .env raíz
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

API="http://localhost:8000/api/v1"
DB_USER="${POSTGRES_USER:-rxpanel_dba}"
DB_NAME="${POSTGRES_DB:-rxpanel}"
COMPOSE="docker compose -f $ROOT_DIR/docker-compose.yml"

echo "==> Corriendo migraciones..."
$COMPOSE exec -T backend alembic upgrade head

echo "==> Registrando admin..."
REGISTER_RESP=$(curl -s -o /dev/stderr -w "%{http_code}" -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rxpanel.com","username":"admin","password":"Admin1234!"}' 2>&1)
HTTP_CODE="${REGISTER_RESP: -3}"
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "409" ]; then
  echo "    OK (HTTP $HTTP_CODE)"
else
  echo "    ERROR HTTP $HTTP_CODE — abortando"
  exit 1
fi

echo "==> Promoviendo a admin en la BD..."
$COMPOSE exec -T db psql -U "$DB_USER" -d "$DB_NAME" \
  -c "UPDATE users SET role = 'admin' WHERE email = 'admin@rxpanel.com';"

echo "==> Login..."
LOGIN_RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rxpanel.com","password":"Admin1234!"}')
TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['access_token'])" 2>/dev/null || true)
if [ -z "$TOKEN" ]; then
  echo "    ERROR al obtener token: $LOGIN_RESP"
  exit 1
fi
echo "    Token obtenido."

echo "==> Creando usuarios..."
for payload in \
  '{"email":"maria@rxpanel.com","username":"maria","password":"Viewer1234!"}' \
  '{"email":"carlos@rxpanel.com","username":"carlos","password":"Viewer1234!"}' \
  '{"email":"sofia@rxpanel.com","username":"sofia","password":"Viewer1234!"}' \
  '{"email":"admin2@rxpanel.com","username":"admin2","password":"Admin1234!"}' ; do
  curl -s -X POST "$API/users/" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null
done

$COMPOSE exec -T db psql -U "$DB_USER" -d "$DB_NAME" \
  -c "UPDATE users SET role = 'admin' WHERE email = 'admin2@rxpanel.com';"

echo "==> Creando sites..."
for payload in \
  '{"name":"App Producción","url":"https://app.miempresa.com","description":"Entorno productivo principal","status":"active","is_ssl":true,"api_token":"prod-token-abc123"}' \
  '{"name":"App Staging","url":"https://staging.miempresa.com","description":"Pre-producción","status":"maintenance","is_ssl":true,"api_token":"staging-token-xyz789"}' \
  '{"name":"Blog Corporativo","url":"https://blog.miempresa.com","description":"Blog público","status":"active","is_ssl":true}' \
  '{"name":"API Pagos","url":"https://pagos.miempresa.com","description":"Pasarela de pagos","status":"active","is_ssl":true,"api_token":"pagos-secret-456"}' \
  '{"name":"Panel Interno","url":"http://internal.miempresa.local","description":"Herramientas de IT","status":"inactive","is_ssl":false}' \
  '{"name":"Landing Page","url":"https://miempresa.com","description":"Página de inicio","status":"active","is_ssl":true}' \
  '{"name":"Analytics Dashboard","url":"https://analytics.miempresa.com","description":"Dashboard de métricas","status":"error","is_ssl":true}' \
  '{"name":"Dev Local","url":"http://localhost:4000","description":"Entorno de desarrollo","status":"inactive","is_ssl":false}' \
  '{"name":"CDN Assets","url":"https://cdn.miempresa.com","description":"Archivos estáticos","status":"active","is_ssl":true,"api_token":"cdn-key-789abc"}' \
  '{"name":"CRM Clientes","url":"https://crm.miempresa.com","description":"Gestión de clientes","status":"maintenance","is_ssl":true}' ; do
  curl -s -X POST "$API/sites/" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null
done

echo "==> Generando historial (change_logs)..."
for id_payload in "7|{\"status\":\"active\"}" "5|{\"is_ssl\":true,\"status\":\"active\"}" "2|{\"status\":\"active\"}"; do
  id="${id_payload%%|*}"
  body="${id_payload##*|}"
  curl -s -X PATCH "$API/sites/$id" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body" > /dev/null
done

echo ""
echo "✓ Seed completo."
echo ""
echo "  Usuarios : 5  (admin, admin2, maria, carlos, sofia)"
echo "  Sites    : 10"
echo "  Logs     : 3"
echo ""
echo "  Swagger  : http://localhost:8000/docs"
