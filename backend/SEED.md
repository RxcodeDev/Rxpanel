# Seed — Poblar la BD para pruebas

Requisito: backend corriendo (`docker compose up -d db backend`).

> **El script es idempotente**: si el admin ya existe devuelve HTTP 409 y el script continúa sin error. Se puede volver a ejecutar en cualquier momento.

---

## PASO 0 — Correr migraciones (primera vez)

Las tablas no existen hasta que Alembic las crea:

```bash
docker compose exec backend alembic upgrade head
```

> El `seed.sh` ya hace este paso automáticamente.

---

## PASO 1 — Registrar el admin

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rxpanel.com","username":"admin","password":"Admin1234!"}'
```

## PASO 2 — Promover a admin en la BD

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@rxpanel.com';
```

## PASO 3 — Login (guarda el token)

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rxpanel.com","password":"Admin1234!"}' | python3 -m json.tool
```

Copia el `access_token` y exportalo para usar en todos los comandos siguientes:

```bash
export TOKEN="PEGA_AQUI_EL_ACCESS_TOKEN"
```

---

## PASO 4 — Crear usuarios de prueba

```bash
# Viewer 1
curl -s -X POST http://localhost:8000/api/v1/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@rxpanel.com","username":"maria","password":"Viewer1234!"}'

# Viewer 2
curl -s -X POST http://localhost:8000/api/v1/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@rxpanel.com","username":"carlos","password":"Viewer1234!"}'

# Viewer 3
curl -s -X POST http://localhost:8000/api/v1/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"sofia@rxpanel.com","username":"sofia","password":"Viewer1234!"}'

# Segundo admin
curl -s -X POST http://localhost:8000/api/v1/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin2@rxpanel.com","username":"admin2","password":"Admin1234!"}'
```

Promueve al segundo admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin2@rxpanel.com';
```

---

## PASO 5 — Crear sites

```bash
# 1. Producción — activo, SSL
curl -s -X POST http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"App Producción","url":"https://app.miempresa.com","description":"Entorno productivo principal","status":"active","is_ssl":true,"api_token":"prod-token-abc123"}'

# 2. Staging — mantenimiento, SSL
curl -s -X POST http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"App Staging","url":"https://staging.miempresa.com","description":"Entorno de pruebas pre-producción","status":"maintenance","is_ssl":true,"api_token":"staging-token-xyz789"}'

# 3. Blog — activo, SSL
curl -s -X POST http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Blog Corporativo","url":"https://blog.miempresa.com","description":"Blog público de la empresa","status":"active","is_ssl":true}'

# 4. API externa — activo, SSL
curl -s -X POST http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"API Pagos","url":"https://pagos.miempresa.com","description":"Pasarela de pagos","status":"active","is_ssl":true,"api_token":"pagos-secret-456"}'

# 5. Panel interno — inactivo, sin SSL
curl -s -X POST http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Panel Interno","url":"http://internal.miempresa.local","description":"Herramientas internas de IT","status":"inactive","is_ssl":false}'

# 6. Landing — activo, SSL
curl -s -X POST http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Landing Page","url":"https://miempresa.com","description":"Página de inicio pública","status":"active","is_ssl":true}'

# 7. Dashboard analytics — error, SSL
curl -s -X POST http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Analytics Dashboard","url":"https://analytics.miempresa.com","description":"Dashboard de métricas","status":"error","is_ssl":true}'

# 8. Dev local — inactivo, sin SSL
curl -s -X POST http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Dev Local","url":"http://localhost:3000","description":"Entorno de desarrollo","status":"inactive","is_ssl":false}'

# 9. CDN — activo, SSL
curl -s -X POST http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"CDN Assets","url":"https://cdn.miempresa.com","description":"Servidor de archivos estáticos","status":"active","is_ssl":true,"api_token":"cdn-key-789abc"}'

# 10. CRM — mantenimiento, SSL
curl -s -X POST http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"CRM Clientes","url":"https://crm.miempresa.com","description":"Gestión de clientes","status":"maintenance","is_ssl":true}'
```

---

## PASO 6 — Generar cambios (change_logs)

Actualiza algunos sites para generar historial:

```bash
# Poner analytics en activo (estaba en error)
curl -s -X PATCH http://localhost:8000/api/v1/sites/7 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"active","description":"Resuelto el problema de conexión"}'

# Subir SSL al panel interno
curl -s -X PATCH http://localhost:8000/api/v1/sites/5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_ssl":true,"status":"active"}'

# Staging vuelve a activo
curl -s -X PATCH http://localhost:8000/api/v1/sites/2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}'
```

---

## PASO 7 — Verificar

```bash
# Total de usuarios
curl -s http://localhost:8000/api/v1/users/ \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Total de sites
curl -s http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Mi perfil
curl -s http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

O directamente en la BD:

```sql
SELECT email, username, role FROM users ORDER BY created_at;

SELECT name, status, is_ssl FROM sites ORDER BY id;

SELECT section, change_type, created_at FROM change_logs ORDER BY created_at DESC;
```

---

## Resumen de datos creados

| Tabla | Registros |
|-------|-----------|
| users | 5 (1 admin, 1 admin2, 3 viewers) |
| sites | 10 (4 active, 2 inactive, 2 maintenance, 1 error → luego corregido) |
| change_logs | 3 (por los PATCH del paso 6) |
