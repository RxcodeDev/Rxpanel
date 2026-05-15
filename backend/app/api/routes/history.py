# app/api/routes/history.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.change_log_schema import ChangeLogRead
from app.services import site_service
from app.services.change_log_service import get_history

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/{site_id}", response_model=list[ChangeLogRead])
async def site_history(
    site_id: int,
    skip: int = 0,
    limit: int = 50,
    section: str | None = None,
    change_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verifica que el usuario tenga acceso al sitio (owner o admin)
    await site_service.get_by_id(db, site_id, current_user)

    return await get_history(
        db,
        site_id=site_id,
        skip=skip,
        limit=limit,
        section=section,
        change_type=change_type,
    )
