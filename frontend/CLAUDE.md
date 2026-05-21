# Rxpanel Frontend — Guía para Claude

Panel de administración de sitios en Next.js. Consume el backend FastAPI de
Rxpanel y comparte lenguaje visual con **Rxflow** (tokens CSS B/N/gris,
Tailwind v4, componentes UI equivalentes). Para el contexto del monorepo ver
[../CLAUDE.md](../CLAUDE.md).

## Stack

| Capa | Tech | Puerto |
|---|---|---|
| Framework | Next.js 15 (App Router) | 3000 (Docker → host 3001) |
| UI | React 19 + TypeScript 5 + Tailwind v4 | |
| Backend | FastAPI — `API_PREFIX = /api/v1` | 8000 |

- `NEXT_PUBLIC_API_URL` (en `.env.local`) apunta al backend; por defecto
  `http://localhost:8000` → [src/lib/api.ts](src/lib/api.ts) le añade `/api/v1`.
- `next.config.ts`: `output: "standalone"` y `eslint.ignoreDuringBuilds: true`
  (el build no falla por lint; correr `npm run lint` aparte).

## Estructura

```
src/
  middleware.ts                 # protege rutas; sin cookie rxpanel_token → /login
  app/
    layout.tsx                  # AuthProvider + ToastProvider + tema sin flash
    (auth)/login/page.tsx       # login + recuperar/resetear contraseña
    (dashboard)/
      layout.tsx                # Sidebar + guard de sesión
      sitios/page.tsx           # lista + CRUD de sitios
      sitios/[id]/page.tsx      # detalle: tabs Contenido/Colores/Logos/Historial
      usuarios/page.tsx         # gestión de usuarios (solo admin; 403 → restringido)
  lib/
    api.ts                      # apiGet/Post/Patch/Put/Delete/Upload; errores `detail`
    auth.ts                     # token/refresh en localStorage + cookie para middleware
    sections.ts                 # metadata de las 10 secciones RecTrack (label/icono/orden)
    format.ts                   # humanize, detección de imágenes, fechas
    siteIcons.tsx               # catálogo de iconos de sitio
  store/
    AuthContext.tsx             # sesión: login (/auth/login → /users/me), logout, refresh
    SiteContext.tsx             # estado del sitio en edición
  types/api.ts                  # contratos espejo del backend (User, Site, ChangeLog, …)
  components/
    ui/                         # Button, Input, Textarea, Card, Modal, ConfirmModal,
                                #   SearchSelect, Toggle, Spinner, Toast, Icon
    layouts/                    # Sidebar (desktop + drawer móvil), ThemeToggle
    features/
      sites/                    # SiteFormModal, StatusBadge, ContentTab,
                                #   ColorsTab, LogosTab, HistoryTab
      users/UserFormModal.tsx
      editor/SchemaEditor.tsx   # editor genérico recursivo (objetos/arrays/primitivos)
      editor/ImageField.tsx     # campo imagen con preview + subida vía proxy
```

## Editor genérico por esquema

`SchemaEditor` renderiza **cualquier JSON** que devuelva el proxy
(`GET /proxy/{siteId}/content/{section}`):

- objeto → grupo de campos con label humanizado
- array → lista con añadir / eliminar / reordenar
- string → input · textarea (texto largo) · `ImageField` (si la clave/valor
  parece imagen)
- number → input numérico · boolean → toggle

Cada sección tiene además un modo **JSON crudo** (botón `</>`). Guardar hace
`PUT /proxy/{siteId}/content/{section}`; el backend registra el cambio en el
historial. La metadata de presentación/orden está en `lib/sections.ts`, pero el
editor funciona aunque el sitio devuelva otra forma de JSON.

## Endpoints consumidos

```
POST /auth/login · /auth/logout · /auth/recover · /auth/reset
GET  /users/me · /users/        POST/PATCH/DELETE /users[/:id]
GET  /sites/ · /sites/:id       POST/PATCH/DELETE /sites[/:id]
GET/PUT  /proxy/:id/content/:section · /proxy/:id/colors · /proxy/:id/logos
GET  /history/:id               POST /proxy/:id/upload (multipart)
```

## Reglas al modificar código

1. **Cero colores hardcodeados** — siempre `var(--c-*)`.
2. `'use client'` **solo** cuando hay hooks, estado o APIs del navegador.
3. **Mobile-first**; las tablas se vuelven cards en móvil.
4. **Nunca `<select>` nativo** → usar `SearchSelect`.
5. **Empty states** centrados en su contenedor (`h-full flex … justify-center`).
6. **Botones** normalizados en `ui/Button`: variantes primario / ghost / danger.
7. Los tipos de `types/api.ts` son el **espejo** de los schemas Pydantic del
   backend — si cambia un schema, actualizar el tipo aquí.
8. **Errores de API:** el backend devuelve `{ detail }`; usar `ApiError` de
   `lib/api.ts`, no parsear respuestas a mano.

## Sesión y rutas

- `middleware.ts` protege todo salvo `/login`: sin cookie `rxpanel_token`
  redirige a `/login`; con sesión en `/login` redirige a `/sitios`.
- `lib/auth.ts` guarda el token en localStorage **y** en cookie (la cookie es la
  que lee el middleware en el servidor).
- `api.ts` ante un `401` limpia la sesión y redirige a `/login`.

## Arranque

```bash
docker compose up -d                          # stack completo → :3001
cd frontend && npm install && npm run dev     # local sin Docker → :3000
```
