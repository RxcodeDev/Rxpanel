# app/services/company_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate


async def list_companies(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Company]:
    result = await db.execute(
        select(Company).offset(skip).limit(limit)
    )
    return result.scalars().all()


async def get_by_id(db: AsyncSession, company_id: int) -> Company:
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return company


async def create(db: AsyncSession, data: CompanyCreate) -> Company:
    company = Company(
        name=data.name,
        description=data.description,
        is_active=True,
    )
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return company


async def update(db: AsyncSession, company: Company, data: CompanyUpdate) -> Company:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    await db.commit()
    await db.refresh(company)
    return company


async def soft_delete(db: AsyncSession, company: Company) -> None:
    company.is_active = False
    await db.commit()


async def restore(db: AsyncSession, company: Company) -> Company:
    company.is_active = True
    await db.commit()
    await db.refresh(company)
    return company
