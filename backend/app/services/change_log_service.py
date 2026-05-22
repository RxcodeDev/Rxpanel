# app/services/change_log_service.py
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from app.models.change_log import ChangeLog


async def log_change(
    db: AsyncSession,
    site_id: int,
    user_id: uuid.UUID,
    section: str,
    change_type: str,
    payload: dict,
) -> None:
    """
    Registra un cambio en el historial.
    Se invoca tras un 2xx del sitio externo.
    """
    entry = ChangeLog(
        site_id=site_id,
        user_id=user_id,
        section=section,
        change_type=change_type,
        payload_snapshot=payload,
    )
    db.add(entry)
    await db.commit()


async def get_history(
    db: AsyncSession,
    site_id: int,
    skip: int = 0,
    limit: int = 50,
    section: str | None = None,
    change_type: str | None = None,
) -> list[ChangeLog]:
    """
    Retorna historial paginado de un sitio.
    Filtros opcionales: section y change_type.
    Ordenado por created_at DESC.
    """
    query = (
        select(ChangeLog)
        .where(ChangeLog.site_id == site_id)
        .options(selectinload(ChangeLog.user))
    )

    if section:
        query = query.where(ChangeLog.section == section)
    if change_type:
        query = query.where(ChangeLog.change_type == change_type)

    query = query.order_by(desc(ChangeLog.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()
