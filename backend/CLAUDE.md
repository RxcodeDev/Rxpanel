# Rxpanel Backend — Guía para Claude

API REST en FastAPI para el panel de administración. Gestiona usuarios, sitios,
archivos e historial, y actúa como **proxy autenticado** hacia sitios externos.
Para el contexto del monorepo ver [../CLAUDE.md](../CLAUDE.md).

## Stack

| Capa | Tecnología |
|---|---|
| Framework | FastAPI >=0.115 |
| Runtime | Python 3.12 |
| ORM | SQLAlchemy 2.0 (async) + asyncpg |
| BD | PostgreSQL 16 |
| Migraciones | Alembic |
| Auth | JWT (python-jose) — access + refresh |
| Passwords | bcrypt vía passlib |
| Encriptación | Fernet (cryptography) — para `api_token` |
| HTTP client | httpx (rutas proxy) |
| Validación | Pydantic v2 + pydantic-settings |
| Servidor | Uvicorn |

## Estructura

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, monta /uploads y el router
│   ├── api/
│   │   ├── router.py        # agrega todos los sub-routers
│   │   └── routes/          # solo orchestration, sin lógica de negocio
│   │       ├── auth.py      # register, login, refresh, logout, recover, reset
│   │       ├── users.py     # CRUD usuarios (admin salvo /me)
│   │       ├── sites.py     # CRUD sitios + restore
│   │       ├── proxy.py     # reenvío HTTP a sitios externos
│   │       ├── files.py     # subida de archivos local (image/document/media)
│   │       ├── history.py   # lectura de change_logs
│   │       └── health.py    # GET /health/
│   ├── core/
│   │   ├── config.py        # Settings desde .env (pydantic-settings)
│   │   ├── dependencies.py  # get_current_user, require_admin
│   │   ├── security.py      # hash/verify password, JWT create/decode
│   │   └── encryption.py    # Fernet encrypt(value) / decrypt(value)
│   ├── db/session.py        # async engine, SessionLocal, Base, get_db()
│   ├── models/              # modelos ORM SQLAlchemy (Mapped columns)
│   ├── schemas/             # schemas Pydantic v2 (request/response)
│   └── services/            # lógica de negocio — TODA operación de BD vive aquí
├── alembic/versions/        # 8 migraciones (ver abajo)
├── mock_server.py           # sitio mock para probar el proxy (puerto 8001)
├── seed.sh / SEED.md        # poblar la BD
├── requirements.txt
└── Dockerfile               # python:3.12-slim, multi-stage
```

## Reglas al modificar código

1. **Todo es async** — usar `await` y `AsyncSession` siempre. Nunca mezclar
   `Session` (sync) con `AsyncSession`.
2. **Los servicios son dueños de la BD** — las rutas solo llaman a funciones de
   servicio, nunca consultan la BD directamente.
3. **`api_token` siempre encriptado con Fernet** al escribir, y **nunca** se
   devuelve en ningún schema de respuesta (`SiteRead` no lo incluye).
4. **`hashed_password` nunca** se devuelve (`UserRead` no lo incluye).
5. **Soft delete, no hard delete** — `is_active = False` en users y sites.
6. **Roles:** `admin` ve y edita todo; `viewer` solo sus propios sitios. El rol
   se aplica con la dependencia `require_admin` a nivel de router, no en servicios.
7. **JWT:** access token expira en `ACCESS_TOKEN_EXPIRE_MINUTES` (default 480);
   refresh token en 7 días (hardcoded).
8. **Timestamps naive** — la BD guarda datetimes sin timezone; usar
   `.replace(tzinfo=None)` antes de guardar datetimes *aware* y al comparar con
   `expires_at`.
9. **No romper migraciones** — hay 8 (ver abajo); las nuevas continúan desde 009.

## Archivos clave

- `app/core/security.py` — `hash_password`, `verify_password`,
  `create_access_token`, `create_refresh_token`, `decode_access_token`
- `app/core/encryption.py` — `encrypt(value)`, `decrypt(value)` con Fernet
- `app/core/dependencies.py` — `get_current_user`, `require_admin`
- `app/services/proxy_client.py` — cliente httpx hacia sitios externos con
  manejo de errores
- `app/services/token_service.py` — emisión/revocación de refresh tokens

## Convenciones

- Schemas en `app/schemas/` con Pydantic v2 — usar `model_config`, no
  `class Config`.
- Modelos en `app/models/` con columnas `Mapped[...]`.
- Rutas en `app/api/routes/` — solo orquestación.

## Restricciones de dependencias conocidas

### `bcrypt` debe ser `< 4.0.0`
`passlib` 1.7.4 es incompatible con `bcrypt >= 4.0.0`: bcrypt 4.x eliminó
`__about__.__version__`, que passlib lee internamente. La app arranca bien pero
**cada login/registro falla con 500**. `requirements.txt` ancla
`bcrypt>=3.2.0,<4.0.0`. **No quitar ni relajar este pin.**

### Migraciones con SQL puro, no `op.create_table()`
SQLAlchemy 2.0 + asyncpg dispara `CREATE TYPE` aunque se pase `create_type=False`
a `Enum(...)`. Para evitar `DuplicateObjectError`, todas las migraciones usan
`op.execute()` con SQL puro y guardas `DO $$ BEGIN ... EXCEPTION WHEN
duplicate_object THEN NULL END $$`. **No refactorizar a `op.create_table()`** con
columnas Enum.

## Errores comunes a evitar

- Mezclar sesiones sync/async.
- Exponer `api_token` o `hashed_password` en respuestas.
- Comparar `expires_at` (naive) con un datetime *aware*.
- Poner lógica de negocio en las rutas.

## Migraciones Alembic

8 archivos en `alembic/versions/` (cadena de revisiones):
`create_users` → `create_sites` → `create_refresh_tokens` →
`create_password_reset_tokens` → `create_change_logs` → `006_sites_api_token` →
`007_change_logs_indexes` → `008_sites_icon`. Las nuevas continúan desde 009.

```bash
alembic upgrade head                              # aplicar todas
alembic downgrade -1                              # revertir la última
alembic revision --autogenerate -m "descripcion"  # nueva migración
```

## Variables de entorno

`DATABASE_URL`, `SECRET_KEY`, `ALGORITHM` (HS256),
`ACCESS_TOKEN_EXPIRE_MINUTES`, `FERNET_KEY`, `FRONTEND_URL` (origen CORS),
`APP_NAME`, `APP_VERSION`, `DEBUG`, `API_PREFIX` (`/api/v1`).

## Ejecutar en local

```bash
docker compose up db backend                       # recomendado
docker compose exec backend alembic upgrade head   # migraciones
bash backend/seed.sh                               # datos de prueba

# Sin Docker:
uvicorn app.main:app --reload                      # API en :8000
uvicorn mock_server:app --port 8001                # sitio mock para el proxy
```

Swagger UI: `http://localhost:8000/docs`. Ver también [CONTEXT.md](CONTEXT.md),
[SEED.md](SEED.md), [POSTMAN.md](POSTMAN.md), [DATABASE_CLIENT.md](DATABASE_CLIENT.md).
