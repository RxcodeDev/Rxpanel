# app/services/user_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRegister, UserUpdate, CompanyUserCreate
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
    """Lista todos los usuarios no eliminados (solo rxcode admin)."""
    result = await db.execute(
        select(User).where(User.is_deleted == False).offset(skip).limit(limit)  # noqa: E712
    )
    return result.scalars().all()


async def list_company_users(db: AsyncSession, company_id: int, skip: int = 0, limit: int = 50) -> list[User]:
    """Lista usuarios no eliminados de una empresa específica."""
    result = await db.execute(
        select(User)
        .where(User.company_id == company_id, User.is_deleted == False)  # noqa: E712
        .offset(skip).limit(limit)
    )
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
        role=UserRole.viewer,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# REGISTRO VIA INVITACION — se convierte en company_admin de esa empresa
async def create_via_invite(db: AsyncSession, username: str, password: str, company_id: int) -> User:
    """
    Registra al dueño de la empresa a través de un token de invitación.
    El email se genera automáticamente; el usuario puede actualizarlo después.
    """
    # Generamos un email temporal único basado en el username
    temp_email = f"{username.lower()}@invite.rxpanel.local"
    await _validate_unique(db, temp_email, username)

    user = User(
        email=temp_email,
        username=username,
        hashed_password=hash_password(password),
        role=UserRole.company_admin,
        company_id=company_id,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# CREACIÓN POR RXCODE ADMIN — puede asignar cualquier rol
async def create(db: AsyncSession, data: UserCreate) -> User:
    await _validate_unique(db, data.email, data.username)

    user = User(
        email=data.email.lower(),
        username=data.username,
        hashed_password=hash_password(data.password),
        role=data.role or UserRole.viewer,
        company_id=data.company_id,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# CREACIÓN POR COMPANY_ADMIN — puede crear company_editor o company_viewer en su empresa
async def create_company_user(db: AsyncSession, data: CompanyUserCreate, company_id: int) -> User:
    await _validate_unique(db, data.email, data.username)

    role = data.role if data.role in (UserRole.company_editor, UserRole.company_viewer) else UserRole.company_viewer

    user = User(
        email=data.email.lower(),
        username=data.username,
        hashed_password=hash_password(data.password),
        role=role,
        company_id=company_id,
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
    # Marca como eliminado e inactivo; se filtra de todos los listados
    user.is_deleted = True
    user.is_active = False
    await db.commit()
    
async def restore(db: AsyncSession, user: User) -> User:
    user.is_active = True
    await db.commit()
    await db.refresh(user)
    return user