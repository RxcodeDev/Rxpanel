# app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

from app.db.session import get_db
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.user import UserRegister, UserRead  # <-- UserRegister, no UserCreate
from app.services import auth_service, user_service, password_reset_service

router = APIRouter(prefix="/auth", tags=["auth"])


class RecoverRequest(BaseModel):
    email: EmailStr


class ResetRequest(BaseModel):
    token: str
    new_password: str


# POST /auth/register — siempre crea como viewer, no acepta campo role
@router.post("/register", response_model=UserRead, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    return await user_service.create_viewer(db, data)


# POST /auth/login
@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    tokens = await auth_service.authenticate_user(db, data.email, data.password)
    if not tokens:
        raise HTTPException(status_code=401, detail="Credenciales invalidas")
    return tokens


# POST /auth/refresh
@router.post("/refresh")
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token = await auth_service.refresh_access_token(db, data.refresh_token)
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token invalido o expirado")
    return {"access_token": token, "token_type": "bearer"}


# POST /auth/logout
@router.post("/logout", status_code=204)
async def logout(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.logout_user(db, data.refresh_token)


# POST /auth/recover
@router.post("/recover", status_code=200)
async def recover(data: RecoverRequest, db: AsyncSession = Depends(get_db)):
    token = await password_reset_service.generate_reset_token(db, data.email)
    return {
        "message": "Token de recuperacion generado",
        "reset_token": token
    }


# POST /auth/reset
@router.post("/reset", status_code=200)
async def reset(data: ResetRequest, db: AsyncSession = Depends(get_db)):
    await password_reset_service.reset_password(db, data.token, data.new_password)
    return {"message": "Password actualizado correctamente"}