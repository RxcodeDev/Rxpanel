# Docker — Comandos de uso

## Primera vez (clone → en el aire en 3 pasos)

```bash
# 1. Crear el .env desde la plantilla
cp .env.example .env
# Edita .env y reemplaza los valores CHANGE_ME

# 2. Construir e iniciar base de datos + backend
docker compose up -d db backend

# 3. Migraciones + datos de prueba
bash backend/seed.sh
```

Swagger disponible en `http://localhost:8000/docs`.

---

## Un solo .env para todo

Todas las credenciales viven en `.env` (raíz del proyecto).
Docker Compose construye `DATABASE_URL` automáticamente a partir de las
variables de Postgres, así que las credenciales nunca pueden desincronizarse.

```
.env  ←  POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
          SECRET_KEY / FERNET_KEY
          NEXT_PUBLIC_API_URL / FRONTEND_URL
```

---

## Levantar servicios

```bash
# Solo base de datos + backend
docker compose up db backend

# Todo (incluyendo frontend)
docker compose up

# En segundo plano
docker compose up -d db backend
```

## Hot-reload

El backend recarga automáticamente al guardar cualquier archivo en `backend/app/`.
No se necesita hacer nada extra.

> Solo reconstruye la imagen (`--build`) si agregas o quitas paquetes en `requirements.txt`.

## Reconstruir imagen (solo si cambias dependencias)

```bash
docker compose up db backend --build
```

## Detener

```bash
docker compose stop              # detiene sin eliminar contenedores
docker compose down              # detiene y elimina contenedores
docker compose down -v           # también elimina el volumen de postgres
```

---

## Logs

```bash
docker compose logs backend -f   # backend en tiempo real
docker compose logs db -f        # postgres en tiempo real
```

## Estado de los contenedores

```bash
docker compose ps
```

---

## Migraciones (Alembic)

```bash
# Aplicar migraciones
docker compose exec backend alembic upgrade head

# Nueva migración
docker compose exec backend alembic revision --autogenerate -m "descripcion"

# Revertir última migración
docker compose exec backend alembic downgrade -1
```

## Consola interactiva

```bash
# Shell dentro del contenedor backend
docker compose exec backend bash

# psql en la base de datos
docker compose exec db psql -U rxpanel_dba -d rxpanel
```

---

## URLs

| Servicio   | URL                          |
|------------|------------------------------|
| Backend    | http://localhost:8000        |
| Swagger UI | http://localhost:8000/docs   |
| ReDoc      | http://localhost:8000/redoc  |
| Frontend   | http://localhost:3001        |
| PostgreSQL | localhost:5432               |
