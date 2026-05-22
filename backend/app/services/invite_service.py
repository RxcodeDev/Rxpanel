# app/services/invite_service.py
import secrets
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.invite_token import InviteToken
from app.models.company import Company


TOKEN_TTL_DAYS = 7


async def create_invite(db: AsyncSession, company_id: int) -> InviteToken:
    """Genera un token de invitación para que el dueño de la empresa se registre."""
    # Verifica que la empresa exista
    company = await db.get(Company, company_id)
    if not company or not company.is_active:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    token_value = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(days=TOKEN_TTL_DAYS)

    invite = InviteToken(
        token=token_value,
        company_id=company_id,
        is_used=False,
        expires_at=expires,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite


async def get_invite(db: AsyncSession, token: str) -> InviteToken:
    """Obtiene un token de invitación válido (no usado y no expirado)."""
    result = await db.execute(
        select(InviteToken).where(InviteToken.token == token)
    )
    invite = result.scalars().first()

    if not invite:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    if invite.is_used:
        raise HTTPException(status_code=400, detail="Esta invitación ya fue utilizada")
    if datetime.utcnow() > invite.expires_at:
        raise HTTPException(status_code=400, detail="Esta invitación ha expirado")

    return invite


async def consume_invite(db: AsyncSession, invite: InviteToken) -> None:
    """Marca el token como usado."""
    invite.is_used = True
    await db.commit()


async def list_invites(db: AsyncSession, company_id: int) -> list[InviteToken]:
    """Lista todos los tokens de invitación de una empresa."""
    result = await db.execute(
        select(InviteToken).where(InviteToken.company_id == company_id)
    )
    return result.scalars().all()
