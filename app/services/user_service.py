# app/services/user_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRegister, UserUpdate
from app.core.security import hash_password, verify_password


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


async def get_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalars().first()


async def get_by_id(db: AsyncSession, user_id: str) -> User | None:
    return await db.get(User, user_id)


async def list_users(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[User]:
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


async def _validate_unique(db: AsyncSession, email: str, username: str) -> None:
    """Valida que email y username no estén en uso."""
    if await get_by_email(db, email.lower()):
        raise HTTPException(status_code=409, detail="Email ya registrado")
    if await get_by_username(db, username):
        raise HTTPException(status_code=409, detail="Username ya en uso")


# REGISTRO PÚBLICO — siempre viewer, no importa nada más
async def create_viewer(db: AsyncSession, data: UserRegister) -> User:
    await _validate_unique(db, data.email, data.username)

    user = User(
        email=data.email.lower(),
        username=data.username,
        hashed_password=hash_password(data.password),
        role=UserRole.viewer,  # hardcodeado, sin excepciones
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# CREACIÓN POR ADMIN — puede asignar rol
async def create(db: AsyncSession, data: UserCreate) -> User:
    await _validate_unique(db, data.email, data.username)

    user = User(
        email=data.email.lower(),
        username=data.username,
        hashed_password=hash_password(data.password),
        role=data.role or UserRole.viewer,  # default viewer si admin no elige
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_by_email(db, email.lower())
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def update(db: AsyncSession, user: User, data: UserUpdate) -> User:
    update_data = data.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user


async def soft_delete(db: AsyncSession, user: User) -> None:
    user.is_active = False
    await db.commit()
    
async def restore(db: AsyncSession, user: User) -> User:
    user.is_active = True
    await db.commit()
    await db.refresh(user)
    return user