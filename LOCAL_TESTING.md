# Pruebas en local — Crear un sitio

Guía de qué valores usar en el formulario **"Nuevo sitio"** cuando el entorno corre en local.

> **Por qué no funciona `localhost` en la URL:** el backend corre dentro de Docker,
> por lo que `localhost` apunta al propio contenedor, no a tu máquina.
> Para llegar al host usa `host.docker.internal` — ya está configurado en el `docker-compose.yml`.

---

## Valores del formulario

| Campo | Valor para local | Notas |
|---|---|---|
| **Nombre** | Cualquiera — ej. `Dev Local` | Solo identificador interno |
| **URL base** | `http://host.docker.internal:3000/api/admin` | El proxy añade `/content/{section}`, `/colors`, `/logos` a esta raíz |
| **Descripción** | Opcional | Se puede dejar vacío |
| **Estado** | `Activo` | Para que el proxy funcione sin restricciones |
| **SSL habilitado** | **Desactivado** | Desarrollo local no tiene certificado |
| **API token** | El token que espera tu sitio | Ver comando abajo para generar uno |

### Obtener el API token de RecTrack

RecTrack no usa un token estático — genera uno firmado con HMAC al hacer login. Hay que pedírselo al propio RecTrack antes de crear el sitio en el panel:

```bash
curl -s -X POST http://localhost:3000/api/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"TU_ADMIN_PASSWORD"}' | python3 -m json.tool
```

La respuesta incluye el token:
```json
{ "ok": true, "token": "eyJ..." }
```

Copia ese `token` y pégalo en el campo **API token** del formulario. El panel lo enviará como `Authorization: Bearer <token>` en cada petición proxy a RecTrack.

> `ADMIN_PASSWORD` está en el `.env` o `.env.local` de RecTrack.

---

## Flujo completo de prueba

1. Levanta backend + BD:
   ```bash
   docker compose up -d db backend
   ```

2. Levanta el mock server (en otra terminal):
   ```bash
   docker compose exec backend uvicorn mock_server:app --host 0.0.0.0 --port 8001 --reload
   ```
   O directamente si tienes el entorno local:
   ```bash
   cd backend && uvicorn mock_server:app --port 8001 --reload
   ```

3. Crea el sitio con los valores de la tabla de arriba.

4. Prueba los endpoints proxy desde Swagger (`http://localhost:8000/docs`) o el frontend:
   - `GET /api/v1/proxy/{site_id}/content/hero` → devuelve JSON de prueba
   - `GET /api/v1/proxy/{site_id}/colors` → devuelve paleta de colores de prueba
   - `GET /api/v1/proxy/{site_id}/logos` → devuelve URLs de logo/favicon de prueba

---

## Qué devuelve el mock server

```
GET  /content/{section}  →  { "section": "...", "data": "Contenido de ...", "items": [1, 2, 3] }
PUT  /content/{section}  →  { "section": "...", "updated": true, "data": <body enviado> }
GET  /colors             →  { "primary": "#1F5C99", "secondary": "#2E75B6", ... }
PUT  /colors             →  { "updated": true, "colors": <body enviado> }
GET  /logos              →  { "logo_url": "...", "favicon_url": "..." }
PUT  /logos              →  { "updated": true, "logos": <body enviado> }
```

El mock también imprime los headers recibidos en la terminal, lo que permite verificar que el backend envía el `X-Api-Token` correctamente.

---

## Sitios de prueba del seed

Si corriste `bash backend/seed.sh`, ya tienes 10 sitios creados. El único que apunta a local es:

| ID | Nombre | URL | Token |
|----|--------|-----|-------|
| 8 | Dev Local | `http://localhost:4000` | (sin token) |

Ese sitio **no apunta al mock** (puerto 4000 vs 8001). Para probar el proxy, crea uno nuevo con `http://localhost:8001` como se describe arriba, o edita el sitio existente desde el panel.
