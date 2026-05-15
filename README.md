# Rxpanel

Web panel manager — backend FastAPI + frontend, dockerizado.

## Estructura

```
.
├── backend/          # FastAPI + PostgreSQL
├── frontend/         # Next.js / React
├── docker-compose.yml
└── .env              # credenciales de postgres para docker compose
```

## Inicio rápido (desde cero)

```bash
# 1. Copiar variables de entorno
cp backend/.env.example backend/.env
# Edita backend/.env con tus valores reales

# 2. Construir e iniciar
docker compose up -d db backend

# 3. Migraciones + seed (datos de prueba)
bash backend/seed.sh
```

Swagger: `http://localhost:8000/docs`

## Documentación

| Documento | Descripción |
|---|---|
| [DOCKER.md](DOCKER.md) | Comandos Docker, logs, migraciones |
| [backend/SEED.md](backend/SEED.md) | Poblar la BD paso a paso |
| [backend/POSTMAN.md](backend/POSTMAN.md) | Uso con Postman |
| [backend/DATABASE_CLIENT.md](backend/DATABASE_CLIENT.md) | Conexión con clientes SQL |
| [backend/CONTEXT.md](backend/CONTEXT.md) | Contexto técnico completo (para IAs y devs nuevos) |

## Dependencias clave

- `bcrypt` está anclado a `<4.0.0` — ver [backend/CONTEXT.md](backend/CONTEXT.md#known-dependency-constraints)
- Las migraciones usan SQL puro (`op.execute`) — no `op.create_table` con Enum de SQLAlchemy
