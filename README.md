# Panel API

Backend con FastAPI dockerizado.

## Estructura

```
.
├── app/
│   ├── main.py          # Punto de entrada
│   ├── api/
│   │   ├── router.py    # Router principal
│   │   └── routes/
│   │       └── health.py
│   └── core/
│       └── config.py    # Configuración (pydantic-settings)
├── tests/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

## Inicio rápido

```bash
# Copiar variables de entorno
cp .env.example .env

# Levantar con Docker Compose
docker compose up --build
```

La API estará disponible en `http://localhost:8000`.  
Documentación interactiva: `http://localhost:8000/docs`

## Desarrollo local (sin Docker)

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Tests

```bash
pip install pytest httpx
pytest
```
