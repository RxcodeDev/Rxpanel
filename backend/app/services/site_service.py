# app/services/site_service.py
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.site import Site
from app.models.user import User, UserRole
from app.schemas.site import SiteCreate, SiteUpdate
from app.core.encryption import encrypt


async def get_all(db: AsyncSession, current_user: User, skip: int = 0, limit: int = 50) -> list[Site]:
    if current_user.role == UserRole.admin:
        result = await db.execute(
            select(Site).where(Site.is_active == True).offset(skip).limit(limit)
        )
    else:
        result = await db.execute(
            select(Site)
            .where(Site.owner_id == current_user.id, Site.is_active == True)
            .offset(skip).limit(limit)
        )
    return result.scalars().all()


async def get_by_id(db: AsyncSession, site_id: int, current_user: User) -> Site:
    site = await db.get(Site, site_id)
    if not site or not site.is_active:
        raise HTTPException(status_code=404, detail="Sitio no encontrado")
    if current_user.role != UserRole.admin and site.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sin permisos para ver este sitio")
    return site


async def create(db: AsyncSession, data: SiteCreate, owner_id: uuid.UUID) -> Site:
    result = await db.execute(select(Site).where(Site.url == str(data.url)))
    if result.scalar():
        raise HTTPException(status_code=409, detail="URL ya registrada")

    encrypted_token = encrypt(data.api_token) if data.api_token else None

    site = Site(
        name=data.name,
        url=str(data.url),
        description=data.description,
        status=data.status,
        is_ssl=data.is_ssl,
        icon=data.icon,
        icon_color=data.icon_color,
        api_token=encrypted_token,
        owner_id=owner_id,
        is_active=True,
    )
    db.add(site)
    await db.commit()
    await db.refresh(site)
    return site


async def update(db: AsyncSession, site: Site, data: SiteUpdate, current_user: User) -> Site:
    if current_user.role != UserRole.admin and site.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sin permisos para editar este sitio")

    update_data = data.model_dump(exclude_unset=True)

    if "api_token" in update_data:
        raw = update_data.pop("api_token")
        update_data["api_token"] = encrypt(raw) if raw else None

    if "url" in update_data and update_data["url"] is not None:
        update_data["url"] = str(update_data["url"])

    for field, value in update_data.items():
        setattr(site, field, value)

    await db.commit()
    await db.refresh(site)
    return site


async def soft_delete(db: AsyncSession, site: Site, current_user: User) -> None:
    if current_user.role != UserRole.admin and site.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sin permisos para eliminar este sitio")
    site.is_active = False
    await db.commit()


async def restore(db: AsyncSession, site_id: int, current_user: User) -> Site:
    """Reactiva un sitio eliminado (is_active=False → True)."""
    site = await db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Sitio no encontrado")
    if current_user.role != UserRole.admin and site.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sin permisos para restaurar este sitio")
    site.is_active = True
    await db.commit()
    await db.refresh(site)
    return site
