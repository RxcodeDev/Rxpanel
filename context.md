# Panel API — Contexto Técnico

## Descripción
Backend REST API para un panel de administración de sitios web. Permite gestionar usuarios, sitios, archivos y actúa como proxy autenticado hacia sitios externos.

## Stack
- **Framework:** FastAPI (Python 3.13)
- **Base de datos:** PostgreSQL + SQLAlchemy (async) + Alembic
- **Autenticación:** JWT (access token 8h + refresh token 7 días)
- **Encriptación:** Fernet (api_token de sitios)
- **HTTP Client:** httpx (proxy hacia sitios externos)
- **Servidor:** Uvicorn

## Estructura del proyecto
```
panel/
├── app/
│   ├── api/
│   │   ├── router.py
│   │   └── routes/
│   │       ├── auth.py        — register, login, refresh, logout, recover, reset
│   │       ├── users.py       — CRUD usuarios
│   │       ├── sites.py       — CRUD sitios
│   │       ├── proxy.py       — Proxy HTTP hacia sitios externos
│   │       ├── files.py       — Subida de archivos (imagen, documento, media)
│   │       ├── history.py     — Historial de cambios
│   │       └── health.py      — Health check
│   ├── core/
│   │   ├── config.py          — Settings desde .env
│   │   ├── security.py        — JWT, bcrypt
│   │   ├── encryption.py      — Fernet encrypt/decrypt
│   │   └── dependencies.py    — get_current_user, require_admin
│   ├── db/
│   │   └── session.py         — Engine, SessionLocal, Base
│   ├── models/
│   │   ├── user.py
│   │   ├── site.py
│   │   ├── refresh_token.py
│   │   ├── password_reset_token.py
│   │   └── change_log.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── site.py
│   │   └── change_log.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── site_service.py
│   │   ├── proxy_client.py
│   │   ├── change_log_service.py
│   │   └── password_reset_service.py
│   └── main.py
├── alembic/
│   └── versions/              — Migraciones 001-007
├── uploads/                   — Archivos subidos (gitignored)
├── mock_server.py             — Servidor mock para pruebas locales (puerto 8001)
├── .env                       — Variables de entorno (gitignored)
├── .env.example               — Plantilla de variables
└── requirements.txt
```

## Variables de entorno (.env)
```
APP_NAME=Panel API
APP_VERSION=0.1.0
DEBUG=false
API_PREFIX=/api/v1
DATABASE_URL=postgresql+asyncpg://usuario:password@localhost:5432/panel_db
SECRET_KEY=tu_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
FERNET_KEY=tu_fernet_key
FRONTEND_URL=http://localhost:3001
```

## Endpoints principales

### Auth
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Crear usuario |
| POST | /api/v1/auth/login | Login, emite JWT |
| POST | /api/v1/auth/refresh | Renovar access_token |
| POST | /api/v1/auth/logout | Revocar refresh_token |
| POST | /api/v1/auth/recover | Generar token de recuperación |
| POST | /api/v1/auth/reset | Resetear password |

### Users (requiere admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/v1/users/me | Usuario actual |
| GET | /api/v1/users/ | Listar usuarios |
| POST | /api/v1/users/ | Crear usuario |
| PATCH | /api/v1/users/{id} | Editar usuario |
| DELETE | /api/v1/users/{id} | Soft delete |

### Sites
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/v1/sites/ | Listar sitios |
| POST | /api/v1/sites/ | Crear sitio |
| GET | /api/v1/sites/{id} | Detalle sitio |
| PATCH | /api/v1/sites/{id} | Editar sitio |
| DELETE | /api/v1/sites/{id} | Soft delete |
| PATCH | /api/v1/sites/{id}/restore | Restaurar sitio |

### Proxy
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/v1/proxy/{site_id}/content/{section} | Obtener sección |
| PUT | /api/v1/proxy/{site_id}/content/{section} | Actualizar sección |
| DELETE | /api/v1/proxy/{site_id}/content/{section} | Eliminar sección |
| GET | /api/v1/proxy/{site_id}/colors | Obtener colores |
| PUT | /api/v1/proxy/{site_id}/colors | Actualizar colores |
| GET | /api/v1/proxy/{site_id}/logos | Obtener logos |
| PUT | /api/v1/proxy/{site_id}/logos | Actualizar logos |

### Files
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/v1/files/upload/image | Subir imagen (png, jpg, svg, webp, gif) max 2MB |
| POST | /api/v1/files/upload/document | Subir documento (pdf, docx) max 10MB |
| POST | /api/v1/files/upload/media | Subir media (mp4, webm) max 50MB |

### History
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/v1/history/{site_id} | Historial de cambios paginado |

## Roles de usuario
- **admin** — acceso total a todos los recursos
- **viewer** — acceso solo a sus propios sitios

## Modelos de BD
- **users** — id UUID, email, username, hashed_password, role, is_active, timestamps
- **sites** — id int, name, url, description, status, is_ssl, api_token (encriptado), is_active, owner_id, timestamps
- **refresh_tokens** — id UUID, token, user_id, is_revoked, expires_at, created_at
- **password_reset_tokens** — id UUID, token, user_id, is_used, expires_at, created_at
- **change_logs** — id UUID, site_id, user_id, section, change_type, payload_snapshot, created_at

## Migraciones Alembic
```bash
alembic upgrade head     # aplicar todas las migraciones
alembic downgrade -1     # revertir última migración
alembic revision --autogenerate -m "descripcion"  # nueva migración
```

## Iniciar en desarrollo
```bash
# Terminal 1 — API principal
uvicorn app.main:app --reload

# Terminal 2 — Mock server para pruebas de proxy
uvicorn mock_server:app --port 8001

# Swagger UI
http://localhost:8000/docs
```
