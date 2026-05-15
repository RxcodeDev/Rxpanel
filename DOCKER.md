# Docker — Comandos de uso

## Primera vez — setup completo

```bash
# 1. Crear el .env del backend
cp backend/.env.example backend/.env
# Edita backend/.env con tus valores reales

# 2. Construir e iniciar
docker compose up -d db backend

# 3. Poblar la BD (migraciones + datos de prueba)
bash backend/seed.sh
```

Swagger disponible en `http://localhost:8000/docs`.

---

## Requisitos previos

```bash
cp backend/.env.example backend/.env   # editar con tus valores reales
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

## Hot-reload — ver cambios de código en tiempo real

El backend tiene **recarga automática**: guarda el archivo y uvicorn lo detecta solo.

```
Modificas backend/app/... → guardas → el servidor se reinicia automáticamente
```

Esto funciona gracias a dos cosas en `docker-compose.yml`:
- `volumes: ./backend:/app` → tu código local está montado dentro del contenedor
- `command: uvicorn ... --reload` → uvicorn vigila cambios de archivos

**No necesitas hacer nada extra para ver los cambios.**

> Solo necesitas reconstruir la imagen (`--build`) si agregas o quitas
> paquetes en `requirements.txt`.

## Reconstruir imagen (solo si cambias dependencias)

```bash
# Agregar un paquete a requirements.txt y aplicarlo
docker compose up db backend --build
```

## Detener

```bash
docker compose stop              # detiene sin eliminar
docker compose down              # detiene y elimina contenedores
docker compose down -v           # también elimina el volumen de postgres
```

---

## Logs

```bash
docker compose logs backend          # logs del backend
docker compose logs backend -f       # logs en tiempo real
docker compose logs db -f            # logs de postgres
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
| PostgreSQL | localhost:5432               |
