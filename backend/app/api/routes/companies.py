# app/api/routes/companies.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin, require_company_admin
from app.models.site import Site
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyRead, CompanyUpdate
from app.schemas.invite_token import InviteTokenRead
from app.schemas.site import SiteRead
from app.services import company_service, invite_service

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/me", response_model=CompanyRead)
async def get_my_company(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin),
):
    """Devuelve la empresa del usuario autenticado (company_admin o rxcode admin)."""
    if not current_user.company_id:
        raise HTTPException(status_code=404, detail="No perteneces a ninguna empresa")
    return await company_service.get_by_id(db, current_user.company_id)


@router.get("/", response_model=list[CompanyRead], dependencies=[Depends(require_admin)])
async def list_companies(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await company_service.list_companies(db, skip, limit)


@router.get("/{company_id}", response_model=CompanyRead, dependencies=[Depends(require_admin)])
async def get_company(company_id: int, db: AsyncSession = Depends(get_db)):
    return await company_service.get_by_id(db, company_id)


@router.post("/", response_model=CompanyRead, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_admin)])
async def create_company(data: CompanyCreate, db: AsyncSession = Depends(get_db)):
    return await company_service.create(db, data)


@router.patch("/{company_id}", response_model=CompanyRead, dependencies=[Depends(require_admin)])
async def update_company(company_id: int, data: CompanyUpdate, db: AsyncSession = Depends(get_db)):
    company = await company_service.get_by_id(db, company_id)
    return await company_service.update(db, company, data)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_admin)])
async def delete_company(company_id: int, db: AsyncSession = Depends(get_db)):
    company = await company_service.get_by_id(db, company_id)
    await company_service.soft_delete(db, company)


@router.patch("/{company_id}/restore", response_model=CompanyRead,
              dependencies=[Depends(require_admin)])
async def restore_company(company_id: int, db: AsyncSession = Depends(get_db)):
    return await company_service.restore(db, company_id)


# ── Invitaciones ──────────────────────────────────────────────────────────────

@router.post("/{company_id}/invites", response_model=InviteTokenRead,
             status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_invite(company_id: int, db: AsyncSession = Depends(get_db)):
    """Genera un link de invitación para que el dueño de la empresa se registre."""
    return await invite_service.create_invite(db, company_id)


@router.get("/{company_id}/invites", response_model=list[InviteTokenRead],
            dependencies=[Depends(require_admin)])
async def list_invites(company_id: int, db: AsyncSession = Depends(get_db)):
    return await invite_service.list_invites(db, company_id)


# ── Sitios de empresa ─────────────────────────────────────────────────────────

class SitesAssignment(BaseModel):
    site_ids: list[int]


@router.get("/{company_id}/sites", response_model=list[SiteRead],
            dependencies=[Depends(require_admin)])
async def list_company_sites(company_id: int, db: AsyncSession = Depends(get_db)):
    """Devuelve los sitios asignados a una empresa."""
    await company_service.get_by_id(db, company_id)
    result = await db.execute(
        select(Site).where(Site.company_id == company_id, Site.is_active == True)  # noqa: E712
    )
    return result.scalars().all()


@router.put("/{company_id}/sites", response_model=list[SiteRead],
            dependencies=[Depends(require_admin)])
async def assign_company_sites(
    company_id: int,
    data: SitesAssignment,
    db: AsyncSession = Depends(get_db),
):
    """Reemplaza la lista de sitios asignados a la empresa."""
    await company_service.get_by_id(db, company_id)

    # Desasignar sitios actuales de esta empresa
    prev = await db.execute(select(Site).where(Site.company_id == company_id))
    for site in prev.scalars().all():
        site.company_id = None

    # Asignar los nuevos
    assigned: list[Site] = []
    for site_id in data.site_ids:
        site = await db.get(Site, site_id)
        if site and site.is_active:
            site.company_id = company_id
            assigned.append(site)

    await db.commit()
    for s in assigned:
        await db.refresh(s)
    return assigned
