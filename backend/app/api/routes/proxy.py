# app/api/routes/proxy.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import site_service
from app.services.proxy_client import proxy_get, proxy_put, proxy_delete
from app.services.change_log_service import log_change

router = APIRouter(prefix="/proxy", tags=["proxy"])


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
    data = await proxy_get(url, site.api_token)
    return {
        "primary":   data.get("primary"),
        "secondary": data.get("secondary"),
        "accent":    data.get("accent"),
        "bg":        data.get("bg"),
        "text":      data.get("text"),
    }


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
