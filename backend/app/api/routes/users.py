# app/api/routes/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_admin, require_company_admin
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRead, UserUpdate, CompanyUserCreate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/", response_model=list[UserRead])
async def list_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin),
):
    """
    rxcode admin → todos los usuarios.
    company_admin → solo los usuarios de su empresa.
    """
    if current_user.role == UserRole.admin:
        return await user_service.list_users(db, skip, limit)
    return await user_service.list_company_users(db, current_user.company_id, skip, limit)


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin),
):
    user = await user_service.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    # company_admin solo puede ver usuarios de su empresa
    if current_user.role != UserRole.admin and user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Sin permisos para ver este usuario")
    return user


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Solo rxcode admin puede crear usuarios con rol y company_id arbitrario."""
    return await user_service.create(db, data)


@router.post("/company", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_company_user(
    data: CompanyUserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin),
):
    """
    company_admin crea un company_viewer dentro de su empresa.
    rxcode admin también puede usar esta ruta pasando company_id en query.
    """
    if current_user.role == UserRole.admin:
        raise HTTPException(
            status_code=400,
            detail="Los admins de rxcode deben usar POST /users/ con company_id explícito",
        )
    return await user_service.create_company_user(db, data, current_user.company_id)


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: str,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin),
):
    user = await user_service.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if current_user.role != UserRole.admin and user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Sin permisos para editar este usuario")
    # company_admin no puede cambiar role ni company_id; se eliminan del payload
    if current_user.role != UserRole.admin:
        data = data.model_copy(update={}, deep=False)
        data.model_fields_set.discard("role")
        data.model_fields_set.discard("company_id")
    return await user_service.update(db, user, data)


@router.patch("/{user_id}/restore", response_model=UserRead)
async def restore_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin),
):
    user = await user_service.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if current_user.role != UserRole.admin and user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Sin permisos")
    if user.is_active:
        raise HTTPException(status_code=400, detail="El usuario ya está activo")
    return await user_service.restore(db, user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin),
):
    user = await user_service.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if current_user.role != UserRole.admin and user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Sin permisos para eliminar este usuario")
    await user_service.soft_delete(db, user)