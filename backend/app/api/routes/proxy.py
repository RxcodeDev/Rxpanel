# app/api/routes/proxy.py
import re
from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import site_service
from app.services.proxy_client import (
    proxy_get,
    proxy_put,
    proxy_delete,
    proxy_post_file,
    proxy_get_bytes,
)
from app.services.change_log_service import log_change

router = APIRouter(prefix="/proxy", tags=["proxy"])


def site_origin(site_url: str) -> str:
    """Elimina el segmento /api/<ruta> del URL para obtener la raíz de archivos estáticos."""
    return re.sub(r"/api/[^/]+/?$", "", site_url.rstrip("/"))


# ── GET ───────────────────────────────────────────────────────────────────

@router.get("/{site_id}/content/{section}")
async def get_content(
    site_id: int, section: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = await site_service.get_by_id(db, site_id, current_user)
    url = f"{site.url.rstrip('/')}/content/{section}"
    return await proxy_get(url, site.api_token)


@router.get("/{site_id}/colors")
async def get_colors(
    site_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = await site_service.get_by_id(db, site_id, current_user)
    url = f"{site.url.rstrip('/')}/colors"
    # Passthrough genérico: el sitio define qué tokens de color expone.
    return await proxy_get(url, site.api_token)


@router.get("/{site_id}/colors/defaults")
async def get_colors_defaults(
    site_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Paleta base del sitio (para revertir al tema original)."""
    site = await site_service.get_by_id(db, site_id, current_user)
    url = f"{site.url.rstrip('/')}/colors/defaults"
    return await proxy_get(url, site.api_token)


@router.get("/{site_id}/logos")
async def get_logos(
    site_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = await site_service.get_by_id(db, site_id, current_user)
    url = f"{site.url.rstrip('/')}/logos"
    data = await proxy_get(url, site.api_token)
    return {
        "logo_url":    data.get("logo_url"),
        "favicon_url": data.get("favicon_url"),
    }


# ── PUT ───────────────────────────────────────────────────────────────────

@router.put("/{site_id}/content/{section}")
async def put_content(
    site_id: int, section: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = await site_service.get_by_id(db, site_id, current_user)
    url = f"{site.url.rstrip('/')}/content/{section}"
    result = await proxy_put(url, site.api_token, body)
    await log_change(db, site_id, current_user.id, section, "update_content", body)
    return result


@router.put("/{site_id}/colors")
async def put_colors(
    site_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = await site_service.get_by_id(db, site_id, current_user)
    url = f"{site.url.rstrip('/')}/colors"
    result = await proxy_put(url, site.api_token, body)
    await log_change(db, site_id, current_user.id, "colors", "update_colors", body)
    return result


@router.put("/{site_id}/logos")
async def put_logos(
    site_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = await site_service.get_by_id(db, site_id, current_user)
    url = f"{site.url.rstrip('/')}/logos"
    result = await proxy_put(url, site.api_token, body)
    await log_change(db, site_id, current_user.id, "logos", "update_logos", body)
    return result


# ── DELETE ────────────────────────────────────────────────────────────────

@router.delete("/{site_id}/content/{section}", status_code=204)
async def delete_content(
    site_id: int, section: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = await site_service.get_by_id(db, site_id, current_user)
    url = f"{site.url.rstrip('/')}/content/{section}"
    await proxy_delete(url, site.api_token)
    await log_change(db, site_id, current_user.id, section, "delete_content", {"section": section})


# ── ASSETS (upload + preview) ─────────────────────────────────────────────

@router.post("/{site_id}/upload")
async def upload_asset(
    site_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reenvía el archivo al sitio gestionado para que lo sirva él mismo."""
    site = await site_service.get_by_id(db, site_id, current_user)
    url = f"{site.url.rstrip('/')}/upload"
    content = await file.read()
    result = await proxy_post_file(
        url, site.api_token, file.filename or "upload", content, file.content_type
    )
    await log_change(
        db, site_id, current_user.id, "assets", "upload", {"path": result.get("path")}
    )
    return result


@router.get("/{site_id}/leads")
async def get_leads(
    site_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene los leads del formulario de contacto del sitio."""
    site = await site_service.get_by_id(db, site_id, current_user)
    url = f"{site.url.rstrip('/')}/leads"
    return await proxy_get(url, site.api_token)


@router.get("/{site_id}/asset")
async def get_asset(
    site_id: int,
    path: str = Query(..., description="Ruta del asset en el sitio, ej. /uploads/x.png"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Sirve un asset del sitio a través del panel (para previsualización).
    Usa la raíz del sitio (sin /api/admin) para resolver rutas estáticas."""
    site = await site_service.get_by_id(db, site_id, current_user)
    base = site_origin(site.url)
    url = f"{base}/{path.lstrip('/')}"
    content, ctype = await proxy_get_bytes(url, site.api_token)
    return Response(
        content=content,
        media_type=ctype,
        headers={"Cache-Control": "no-store"},
    )
