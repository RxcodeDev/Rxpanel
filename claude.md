# Panel API — Guía para Claude

## Contexto del proyecto
Backend REST API construido con FastAPI + PostgreSQL para un panel de administración de sitios web. 
## Reglas importantes al modificar código

1. **Siempre usar async/await** — toda la BD es async con SQLAlchemy asyncpg
2. **No romper migraciones existentes** — hay 7 migraciones (001-007), nuevas van desde 008
3. **El api_token de Site siempre se encripta con Fernet** — nunca guardar en claro
4. **Soft delete, no hard delete** — sites y users usan is_active=False
5. **Roles:** admin ve todo, viewer solo sus recursos
6. **JWT:** access_token expira en 8h, refresh_token en 7 días
7. **Timestamps sin timezone** en BD — usar .replace(tzinfo=None) al guardar datetimes aware

## Archivos clave
- `app/core/security.py` — hash_password, verify_password, create_access_token, create_refresh_token, decode_access_token
- `app/core/encryption.py` — encrypt(value), decrypt(value) con Fernet
- `app/core.dependencies.py` — get_current_user, require_admin
- `app/services/proxy_client.py` — proxy_get, proxy_put, proxy_delete con manejo de errores httpx

## Convenciones de código
- Schemas en `app/schemas/` con Pydantic v2 (model_config en lugar de class Config)
- Servicios en `app/services/` — lógica de negocio separada de rutas
- Rutas en `app/api/routes/` — solo orchestration, sin lógica de negocio
- Modelos en `app/models/` con SQLAlchemy Mapped columns

## Errores comunes a evitar
- No mezclar Session (sync) con AsyncSession — todo es async
- No exponer api_token en schemas de respuesta (SiteRead no lo incluye)
- No exponer hashed_password en schemas de respuesta (UserRead no lo incluye)
- Al comparar fechas con expires_at de BD, usar datetime naive (sin tzinfo)

## Variables de entorno requeridas
DATABASE_URL, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, FERNET_KEY, FRONTEND_URL
