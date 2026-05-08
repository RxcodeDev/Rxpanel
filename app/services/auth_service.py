from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.services import user_service


# AUTHENTICATE — login completo, devuelve tokens
async def authenticate_user(db: AsyncSession, email: str, password: str) -> dict | None:
    user = await user_service.authenticate(db, email, password)
    if not user:
        return None

    access_token = create_access_token(str(user.id))
    refresh_token, expires_at = create_refresh_token(str(user.id))

    db_token = RefreshToken(
        token=refresh_token,
        user_id=user.id,
        expires_at=expires_at.replace(tzinfo=None),
        is_revoked=False,
    )
    db.add(db_token)
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# REFRESH — renueva access_token sin rotar refresh_token
async def refresh_access_token(db: AsyncSession, refresh_token: str) -> str | None:
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_token)
    )
    token_db = result.scalar()

    if not token_db or token_db.is_revoked:
        return None

    # Comparación correcta: ambos naive UTC
    expires_naive = token_db.expires_at
    now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
    if expires_naive < now_naive:
        return None

    return create_access_token(str(token_db.user_id))


# LOGOUT — revoca el refresh_token
async def logout_user(db: AsyncSession, refresh_token: str) -> None:
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_token)
    )
    token_db = result.scalar()

    if token_db:
        token_db.is_revoked = True
        await db.commit()
