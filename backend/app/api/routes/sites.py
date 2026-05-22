# app/api/routes/sites.py
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.site import SiteCreate, SiteRead, SiteUpdate
from app.services import site_service

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("/", response_model=list[SiteRead])
async def list_sites(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await site_service.get_all(db, current_user, skip, limit)


@router.get("/{site_id}", response_model=SiteRead)
async def get_site(
    site_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await site_service.get_by_id(db, site_id, current_user)


@router.post("/", response_model=SiteRead, status_code=status.HTTP_201_CREATED)
async def create_site(
    data: SiteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await site_service.create(db, data, current_user.id, current_user.company_id)


@router.patch("/{site_id}", response_model=SiteRead)
async def update_site(
    site_id: int,
    data: SiteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = await site_service.get_by_id(db, site_id, current_user)
    return await site_service.update(db, site, data, current_user)


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_site(
    site_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = await site_service.get_by_id(db, site_id, current_user)
    await site_service.soft_delete(db, site, current_user)


@router.patch("/{site_id}/restore", response_model=SiteRead)
async def restore_site(
    site_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reactiva un sitio que fue eliminado con soft delete."""
    site = await site_service.restore(db, site_id, current_user)
    return site


class SiteProbeRequest(BaseModel):
    url: str
    password: str | None = None


@router.post("/probe")
async def probe_site(
    data: SiteProbeRequest,
    current_user: User = Depends(get_current_user),
):
    """Verifica compatibilidad o autentica un sitio gestionado.
    Corre en el servidor (dentro del contenedor Docker) para poder resolver
    hostnames internos como host.docker.internal."""
    body = {"password": data.password} if data.password else {}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(data.url, json=body)
            return Response(
                content=res.content,
                status_code=res.status_code,
                media_type="application/json",
            )
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="No se pudo conectar al sitio.")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
