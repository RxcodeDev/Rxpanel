# app/services/password_reset_service.py
import uuid
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.core.security import hash_password


async def generate_reset_token(db: AsyncSession, email: str) -> str:
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Invalidar tokens anteriores del mismo usuario
    prev = await db.execute(
        select(PasswordResetToken)
        .where(PasswordResetToken.user_id == user.id, PasswordResetToken.is_used == False)
    )
    for token in prev.scalars().all():
        token.is_used = True

    token_value = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=1)

    reset_token = PasswordResetToken(
        token=token_value,
        user_id=user.id,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(reset_token)
    await db.commit()

    return token_value


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == token)
    )
    reset_token = result.scalar()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Token invalido")

    if reset_token.is_used:
        raise HTTPException(status_code=400, detail="Token ya utilizado")

    if reset_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expirado")

    user = await db.get(User, reset_token.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.hashed_password = hash_password(new_password)
    reset_token.is_used = True

    await db.commit()
