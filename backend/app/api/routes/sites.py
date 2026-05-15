# app/api/routes/sites.py
from fastapi import APIRouter, Depends, status
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
    return await site_service.create(db, data, current_user.id)


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
