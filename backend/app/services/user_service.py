# app/services/user_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password, verify_password


# GET BY EMAIL
async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


# GET BY USERNAME
async def get_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalars().first()


# GET BY ID
async def get_by_id(db: AsyncSession, user_id: str) -> User | None:
    return await db.get(User, user_id)


# LIST USERS
async def list_users(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[User]:
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


# CREATE USER
async def create(db: AsyncSession, data: UserCreate) -> User:
    if await get_by_email(db, data.email.lower()):
        raise HTTPException(status_code=409, detail="Email ya registrado")

    if await get_by_username(db, data.username):
        raise HTTPException(status_code=409, detail="Username ya en uso")

    user = User(
        email=data.email.lower(),
        username=data.username,
        hashed_password=hash_password(data.password),
        role=UserRole.viewer,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# AUTHENTICATE
async def authenticate(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_by_email(db, email.lower())
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# UPDATE USER
async def update(db: AsyncSession, user: User, data: UserUpdate) -> User:
    update_data = data.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user


# SOFT DELETE — marca is_active=False, no elimina el registro
async def soft_delete(db: AsyncSession, user: User) -> None:
    user.is_active = False
    await db.commit()
