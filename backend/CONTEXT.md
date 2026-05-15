# Backend — AI Context

## Project overview

REST API for a web panel manager. Allows users to register sites (URLs),
monitor their status, and track changes. Built with FastAPI and PostgreSQL,
fully async, containerized with Docker.

---

## Tech stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Framework    | FastAPI 0.136+                          |
| Runtime      | Python 3.12                             |
| ORM          | SQLAlchemy 2.0 (async)                  |
| DB driver    | asyncpg                                 |
| Database     | PostgreSQL 16                           |
| Migrations   | Alembic                                 |
| Auth         | JWT via python-jose — access + refresh  |
| Passwords    | bcrypt via passlib                      |
| Encryption   | Fernet (cryptography) — for api_tokens  |
| HTTP client  | httpx (proxy routes)                    |
| Validation   | Pydantic v2 + pydantic-settings         |
| Server       | Uvicorn with --reload in dev            |
| Container    | Docker + docker compose                 |

---

## Directory structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router mount
│   ├── api/
│   │   ├── router.py        # aggregates all sub-routers
│   │   └── routes/
│   │       ├── auth.py      # register, login, refresh, logout, recover, reset
│   │       ├── users.py     # CRUD users (admin-only except /me)
│   │       ├── sites.py     # CRUD sites
│   │       ├── proxy.py     # proxy requests to registered sites
│   │       ├── files.py     # file upload
│   │       ├── history.py   # change_logs read
│   │       └── health.py    # GET /health/
│   ├── core/
│   │   ├── config.py        # Settings via pydantic-settings — reads .env
│   │   ├── dependencies.py  # get_current_user, require_admin FastAPI deps
│   │   ├── security.py      # hash_password, verify_password, JWT create/decode
│   │   └── encryption.py    # Fernet encrypt/decrypt for api_token field
│   ├── db/
│   │   └── session.py       # async engine, SessionLocal, Base, get_db()
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── site.py
│   │   ├── change_log.py
│   │   ├── refresh_token.py
│   │   └── password_reset_token.py
│   ├── schemas/             # Pydantic schemas (request/response)
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── site.py
│   │   ├── token.py
│   │   └── change_log_schema.py
│   └── services/            # Business logic — all DB operations live here
│       ├── auth_service.py
│       ├── user_service.py
│       ├── site_service.py
│       ├── change_log_service.py
│       ├── password_reset_service.py
│       ├── token_service.py
│       └── proxy_client.py
├── alembic/                 # Migration scripts
├── alembic.ini
├── requirements.txt
├── Dockerfile
└── .env                     # never committed
```

---

## Data models

### User
| Field             | Type      | Notes                          |
|-------------------|-----------|--------------------------------|
| id                | UUID PK   |                                |
| email             | str       | unique, indexed                |
| username          | str       | unique, indexed                |
| hashed_password   | str       |                                |
| role              | enum      | `admin` \| `viewer`            |
| is_active         | bool      | soft-disable                   |
| created_at        | datetime  |                                |
| updated_at        | datetime  |                                |

### Site
| Field       | Type     | Notes                                         |
|-------------|----------|-----------------------------------------------|
| id          | int PK   | auto-increment                                |
| name        | str      |                                               |
| url         | str      | unique, indexed                               |
| description | str?     |                                               |
| status      | enum     | `active` \| `inactive` \| `maintenance` \| `error` |
| is_ssl      | bool     |                                               |
| api_token   | str?     | stored Fernet-encrypted, never returned in responses |
| is_active   | bool     | soft-delete flag                              |
| owner_id    | UUID FK  | → users.id                                   |
| created_at  | datetime |                                               |
| updated_at  | datetime |                                               |

### ChangeLog
| Field            | Type     | Notes                    |
|------------------|----------|--------------------------|
| id               | UUID PK  |                          |
| site_id          | int FK   | → sites.id               |
| user_id          | UUID FK  | → users.id               |
| section          | str      | area of change           |
| change_type      | str      | `create` \| `update` \| `delete` |
| payload_snapshot | JSONB    | full state at change time |
| created_at       | datetime |                          |

### RefreshToken
| Field      | Type     | Notes              |
|------------|----------|--------------------|
| id         | UUID PK  |                    |
| token      | str      | unique             |
| user_id    | UUID FK  | → users.id         |
| is_revoked | bool     |                    |
| expires_at | datetime | 7-day TTL          |
| created_at | datetime |                    |

### PasswordResetToken
| Field      | Type     | Notes              |
|------------|----------|--------------------|
| id         | UUID PK  |                    |
| token      | str      | unique             |
| user_id    | UUID FK  | → users.id         |
| is_used    | bool     |                    |
| expires_at | datetime |                    |
| created_at | datetime |                    |

---

## API routes

All routes are prefixed with `/api/v1` (configurable via `API_PREFIX` env var).

### Auth — `/auth`
| Method | Path        | Auth | Description                      |
|--------|-------------|------|----------------------------------|
| POST   | /register   | —    | Creates user with role `viewer`  |
| POST   | /login      | —    | Returns access + refresh tokens  |
| POST   | /refresh    | —    | Renews access token              |
| POST   | /logout     | —    | Revokes refresh token            |
| POST   | /recover    | —    | Generates password reset token   |
| POST   | /reset      | —    | Applies new password             |

### Users — `/users`
| Method | Path       | Auth        | Description              |
|--------|------------|-------------|--------------------------|
| GET    | /me        | any user    | Returns own profile      |
| GET    | /          | admin only  | List all users           |
| POST   | /          | admin only  | Create user              |
| PATCH  | /{user_id} | admin only  | Partial update           |
| DELETE | /{user_id} | admin only  | Soft delete              |

### Sites — `/sites`
| Method | Path        | Auth       | Description                           |
|--------|-------------|------------|---------------------------------------|
| GET    | /           | any user   | Admin sees all; viewer sees own only  |
| GET    | /{site_id}  | any user   | Owner or admin                        |
| POST   | /           | any user   | Creates site owned by current user    |
| PATCH  | /{site_id}  | any user   | Owner or admin                        |
| DELETE | /{site_id}  | any user   | Soft delete — owner or admin          |

---

## Auth flow

```
POST /auth/login
  → returns { access_token, refresh_token, token_type }

Protected requests:
  Authorization: Bearer <access_token>

Token expiry (configurable in .env):
  access_token  → ACCESS_TOKEN_EXPIRE_MINUTES (default 480 min)
  refresh_token → 7 days (hardcoded)

POST /auth/refresh  { refresh_token }
  → returns { access_token, token_type }
```

---

## Key conventions

- **All DB operations are async** — use `await` and `AsyncSession` everywhere.
- **Services own the DB logic** — routes only call service functions, never query directly.
- **`api_token` is always Fernet-encrypted at write and never returned** in any response schema.
- **Soft deletes** — setting `is_active = False` on users and sites; nothing is hard-deleted via the API.
- **Role enforcement** via `require_admin` dependency injected at the router level, not inside services.
- **First registered user is `viewer`** — promote to `admin` manually via SQL or via `PATCH /users/{id}` with an existing admin token.
- **`FRONTEND_URL`** env var controls the CORS `allow_origins` list.

---

## Known dependency constraints

### bcrypt must be < 4.0.0

`passlib` 1.7.4 is incompatible with `bcrypt >= 4.0.0`. The bcrypt 4.x release removed the `__about__.__version__` attribute that passlib reads internally, causing `hash_password()` to fail at request time (not at startup — the app boots fine but every registration/login call crashes with 500).

`requirements.txt` pins `bcrypt>=3.2.0,<4.0.0` to prevent pip from installing an incompatible version.

**Do not remove or relax this pin** until passlib is updated or replaced.

### Alembic migrations use raw SQL — not `op.create_table()`

SQLAlchemy 2.0 + asyncpg triggers a `CREATE TYPE` event even when `create_type=False` is passed to `Enum(...)`. To avoid `DuplicateObjectError` on re-runs, all migrations use `op.execute()` with raw SQL and `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL END $$` guards instead of `op.create_table()`.

**Do not refactor migrations to use `op.create_table()`** with SQLAlchemy Enum columns.

---

## Environment variables

```
DATABASE_URL          postgresql+asyncpg://rxpanel_dba:<pass>@db:5432/rxpanel
SECRET_KEY            hex secret for JWT signing
ALGORITHM             HS256
ACCESS_TOKEN_EXPIRE_MINUTES  480
FERNET_KEY            base64 url-safe key for api_token encryption
FRONTEND_URL          CORS origin (e.g. http://localhost:3001)
APP_NAME              Panel API
APP_VERSION           0.1.0
DEBUG                 false
API_PREFIX            /api/v1
```

---

## Running locally

```bash
# Start with Docker (recommended)
docker compose up db backend

# Run migrations (first time or after new migration files)
docker compose exec backend alembic upgrade head

# Seed test data
bash backend/seed.sh

# Swagger UI
open http://localhost:8000/docs
```
