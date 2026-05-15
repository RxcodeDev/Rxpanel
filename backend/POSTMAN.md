# Postman — Guía de uso

## Configuración inicial

### 1. Variable de entorno en Postman

Crea un **Environment** llamado `Rxpanel Local` con estas variables:

| Variable      | Initial value             |
|---------------|---------------------------|
| `base_url`    | `http://localhost:8000/api/v1` |
| `token`       | *(vacío, se llena automático)* |
| `refresh_token` | *(vacío, se llena automático)* |

### 2. Script de auto-guardado del token

En el endpoint **Login**, pestaña **Tests**, pega esto para que el token
se guarde automáticamente después de cada login:

```javascript
const res = pm.response.json();
pm.environment.set("token", res.access_token);
pm.environment.set("refresh_token", res.refresh_token);
```

### 3. Header de autorización

En los endpoints protegidos, pestaña **Auth**:
- Type: `Bearer Token`
- Token: `{{token}}`

---

## Endpoints

### Health

| Método | URL |
|--------|-----|
| GET | `{{base_url}}/health/` |

---

### Auth

#### Registrar usuario
```
POST {{base_url}}/auth/register
```
```json
{
  "email": "admin@rxpanel.com",
  "username": "admin",
  "password": "Admin1234!"
}
```

#### Login
```
POST {{base_url}}/auth/login
```
```json
{
  "email": "admin@rxpanel.com",
  "password": "Admin1234!"
}
```
> Responde con `access_token` y `refresh_token`. El script de Tests los guarda automáticamente.

#### Refrescar token
```
POST {{base_url}}/auth/refresh
```
```json
{
  "refresh_token": "{{refresh_token}}"
}
```

#### Recuperar contraseña
```
POST {{base_url}}/auth/recover
```
```json
{
  "email": "admin@rxpanel.com"
}
```

#### Resetear contraseña
```
POST {{base_url}}/auth/reset
```
```json
{
  "token": "TOKEN_RECIBIDO",
  "new_password": "NuevoPass123!"
}
```

#### Logout
```
POST {{base_url}}/auth/logout
```
```json
{
  "refresh_token": "{{refresh_token}}"
}
```

---

### Users  *(requiere token)*

#### Mi perfil
```
GET {{base_url}}/users/me
```

#### Listar usuarios *(solo admin)*
```
GET {{base_url}}/users/?skip=0&limit=50
```

#### Crear usuario *(solo admin)*
```
POST {{base_url}}/users/
```
```json
{
  "email": "viewer@rxpanel.com",
  "username": "viewer1",
  "password": "Viewer1234!"
}
```

#### Actualizar usuario *(solo admin)*
```
PATCH {{base_url}}/users/{user_id}
```
```json
{
  "role": "admin",
  "is_active": true
}
```
> Todos los campos son opcionales. Solo envía los que quieras cambiar.

#### Eliminar usuario *(solo admin)*
```
DELETE {{base_url}}/users/{user_id}
```

---

### Sites  *(requiere token)*

#### Listar sites
```
GET {{base_url}}/sites/?skip=0&limit=50
```

#### Obtener site por ID
```
GET {{base_url}}/sites/{site_id}
```

#### Crear site
```
POST {{base_url}}/sites/
```
```json
{
  "name": "Mi Sitio",
  "url": "https://misitio.com",
  "description": "Descripción opcional",
  "status": "active",
  "is_ssl": true,
  "api_token": "TOKEN_OPCIONAL"
}
```
> `status` acepta: `active` `inactive` `maintenance` `error`

#### Actualizar site
```
PATCH {{base_url}}/sites/{site_id}
```
```json
{
  "status": "maintenance",
  "description": "Actualización parcial"
}
```
> Todos los campos son opcionales.

#### Eliminar site
```
DELETE {{base_url}}/sites/{site_id}
```

---

## Flujo recomendado para empezar

```
1. POST /auth/register   → crear primer usuario
2. POST /auth/login      → obtener token  (el script lo guarda solo)
3. GET  /users/me        → verificar que el token funciona
4. POST /sites/          → crear primer site
5. GET  /sites/          → listar sites creados
```
