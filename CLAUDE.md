# Rxpanel — Guía para Claude (monorepo)

Panel de administración de sitios web. Gestiona usuarios y sitios, y edita el
contenido de cada sitio (texto, colores, logos, archivos) a través de un
**proxy autenticado** hacia el sitio destino (RecTrack o cualquier sitio con
el mismo contrato de API).

Este es el archivo **unificado**. Cada parte tiene además su propia guía:

| Parte | Guía | Stack |
|---|---|---|
| [backend/](backend/) | [backend/CLAUDE.md](backend/CLAUDE.md) | FastAPI + PostgreSQL (async) |
| [frontend/](frontend/) | [frontend/CLAUDE.md](frontend/CLAUDE.md) | Next.js 15 + React 19 + Tailwind v4 |

Contexto completo legible por IA: [context.toon](context.toon).

## Estructura del repo

```
.
├── backend/            # API FastAPI + PostgreSQL — ver backend/CLAUDE.md
├── frontend/           # Panel Next.js — ver frontend/CLAUDE.md
├── docker-compose.yml  # db + backend + frontend
├── .env                # credenciales Postgres + secretos (gitignored)
└── context.toon        # contexto del proyecto para IAs (formato TOON)
```

## Arranque rápido

```bash
cp .env.example .env          # editar con valores reales
docker compose up -d          # db (5432) + backend (8000) + frontend (3001)
bash backend/seed.sh          # migraciones + datos de prueba
```

- Frontend: `http://localhost:3001`
- API + Swagger: `http://localhost:8000/docs`
- El backend monta `host.docker.internal` para alcanzar sitios servidos en el
  host durante desarrollo (ej. RecTrack en `http://host.docker.internal:3000`).

## Cómo encajan las dos partes

1. El **frontend** autentica contra `/api/v1/auth/*` y guarda el JWT.
2. CRUD de usuarios y sitios va directo a la API (`/users`, `/sites`).
3. Editar el contenido de un sitio NO toca la BD del panel: el frontend llama a
   `/api/v1/proxy/{site_id}/...` y el **backend reenvía** la petición al sitio
   destino usando su `api_token` (encriptado con Fernet en la tabla `sites`).
4. Cada `PUT` vía proxy queda registrado en `change_logs` (historial).

## Convenciones transversales

- **Idioma:** comentarios y documentación en español; identificadores de código
  en inglés.
- **Contrato compartido:** los tipos de [frontend/src/types/api.ts](frontend/src/types/api.ts)
  son el espejo de los schemas Pydantic del backend. Si cambias un schema,
  actualiza el tipo correspondiente.
- **Prefijo de API:** todo cuelga de `/api/v1` (`API_PREFIX`).
- **Errores:** el backend devuelve `{ detail: ... }`; el frontend lo extrae en
  [frontend/src/lib/api.ts](frontend/src/lib/api.ts).
- **Sin colores hardcodeados** en el frontend — siempre tokens CSS `var(--c-*)`.

## Gotchas a recordar

- `bcrypt` está anclado a `<4.0.0` — no relajar el pin (ver backend/CLAUDE.md).
- Las migraciones Alembic usan SQL puro (`op.execute`), no `op.create_table()`.
- El `api_token` de un sitio nunca se devuelve en respuestas ni se loguea.
- Soft delete en todo: `is_active = False`, nunca borrado físico vía API.
- Las marcas de tiempo en BD son *naive* (sin timezone).
