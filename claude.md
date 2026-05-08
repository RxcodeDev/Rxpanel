# Panel API — Comandos

## Docker (recomendado)

```bash
# 1. Copiar variables de entorno
cp .env.example .env

# 2. Construir y levantar
docker compose up --build

# 3. Solo levantar (sin reconstruir)
docker compose up

# 4. En background
docker compose up -d

# 5. Ver logs
docker compose logs -f api

# 6. Detener
docker compose down

# 7. Detener y eliminar volúmenes
docker compose down -v
```

## Desarrollo local (sin Docker)

```bash
# Crear entorno virtual
python -m venv .venv

# Activar (Windows)
.venv\Scripts\activate

# Activar (Linux/Mac)
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Levantar con hot-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Tests

```bash
pip install pytest httpx
pytest
pytest -v                     # verbose
pytest tests/test_main.py     # archivo específico
```

## Migraciones (Alembic)

```bash
# Inicializar (solo una vez)
alembic init alembic

# Generar migración
alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1
```

## URLs

| Recurso            | URL                                  |
|--------------------|--------------------------------------|
| API root           | http://localhost:8000                |
| Swagger UI         | http://localhost:8000/docs           |
| ReDoc              | http://localhost:8000/redoc          |
| Health check       | http://localhost:8000/api/v1/health  |
| Autenticación      | http://localhost:8000/api/v1/auth    |
| Usuarios           | http://localhost:8000/api/v1/users   |
| Sitios             | http://localhost:8000/api/v1/sites   |
