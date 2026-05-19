# Rxpanel — Frontend

Panel de administración de sitios. Mismo lenguaje visual que **Rxflow**
(tokens CSS B/N/gris, Tailwind v4, componentes UI equivalentes) y consume el
backend FastAPI de Rxpanel para editar los parámetros compatibles con
**RecTrack** (y cualquier sitio con el mismo contrato).

## Stack

| Capa | Tech | Puerto |
|------|------|--------|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4 | 3000 (Docker → host 3001) |
| Backend | FastAPI — `API_PREFIX = /api/v1` | 8000 |

`NEXT_PUBLIC_API_URL` (en `.env.local`) apunta al backend; por defecto
`http://localhost:8000/api/v1`.

## Arranque

```bash
# Stack completo (db + backend + frontend)
docker compose up -d                 # frontend en http://localhost:3001

# Local sin Docker
cd frontend && npm install && npm run dev   # http://localhost:3000
```

## Estructura

```
src/
  middleware.ts                 ← Protege rutas; sin cookie rxpanel_token → /login
  app/
    layout.tsx                  ← AuthProvider + ToastProvider + tema sin flash
    (auth)/login/page.tsx       ← Login + recuperar/resetear contraseña
    (dashboard)/
      layout.tsx                ← Sidebar + guard de sesión
      sitios/page.tsx           ← Lista + CRUD de sitios
      sitios/[id]/page.tsx      ← Detalle con tabs: Contenido/Colores/Logos/Historial
      usuarios/page.tsx         ← Gestión de usuarios (solo admin; 403 → estado restringido)
  lib/
    api.ts                      ← apiGet/Post/Patch/Put/Delete/Upload contra FastAPI (errores `detail`)
    auth.ts                     ← token/refresh en localStorage + cookie para middleware
    sections.ts                 ← Metadata de las 10 secciones RecTrack (label/icono/orden)
    format.ts                   ← humanize, detección de imágenes, fechas
  store/AuthContext.tsx         ← Sesión: login (/auth/login → /users/me), logout, refresh
  types/api.ts                  ← User, Site, ChangeLog, SiteColors/Logos, JsonValue
  components/
    ui/                         ← Button, Input, Textarea, Card, Modal, ConfirmModal,
                                   SearchSelect, Toggle, Spinner, Toast, Icon
    layouts/                    ← Sidebar (desktop + drawer móvil), ThemeToggle
    features/
      sites/                    ← SiteFormModal, StatusBadge, ContentTab,
                                   ColorsTab, LogosTab, HistoryTab
      users/UserFormModal.tsx
      editor/SchemaEditor.tsx   ← Editor genérico recursivo (objetos/arrays/primitivos)
      editor/ImageField.tsx     ← Campo imagen con preview + subida a /files/upload
```

## Editor genérico por esquema

`SchemaEditor` renderiza **cualquier JSON** que devuelva el proxy
(`GET /proxy/{siteId}/content/{section}`):

- objeto → grupo de campos con label humanizado
- array → lista con añadir / eliminar / reordenar
- string → input · textarea (texto largo) · `ImageField` (si la clave/valor
  parece imagen)
- number → input numérico · boolean → toggle

Cada sección tiene además un modo **JSON crudo** (botón `</>`) para edición
avanzada. Guardar hace `PUT /proxy/{siteId}/content/{section}` y el backend
registra el cambio en el historial.

## Mapa de endpoints consumidos

```
POST /auth/login · /auth/logout · /auth/recover · /auth/reset
GET  /users/me · /users/        POST/PATCH/DELETE /users[/:id]
GET  /sites/ · /sites/:id       POST/PATCH/DELETE /sites[/:id]
GET/PUT  /proxy/:id/content/:section · /proxy/:id/colors · /proxy/:id/logos
GET  /history/:id               POST /files/upload (multipart)
```

## Reglas de estilo (heredadas de Rxflow)

1. Cero colores hardcodeados — siempre `var(--c-*)`.
2. `'use client'` solo cuando hay hooks/estado/Browser APIs.
3. Mobile-first; tablas → cards en móvil.
4. Nunca `<select>` nativo → usar `SearchSelect`.
5. Empty states centrados en su contenedor (`h-full flex … justify-center`).
6. Botones: primario / ghost / danger normalizados en `ui/Button`.
