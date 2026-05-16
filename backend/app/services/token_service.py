from sqlalchemy.ext.asyncio import AsyncSession
from app.models.refresh_token import RefreshToken


async def create_refresh_token(db: AsyncSession, user_id: str, token: str, expires_at):
    db_token = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at,
    )
    db.add(db_token)
    await db.commit()
    await db.refresh(db_token)
    return db_token