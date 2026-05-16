# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional
from app.models.user import UserRole


# Registro público — sin campo role, siempre será viewer
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str


# Creación por admin — puede elegir el rol
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: Optional[UserRole] = UserRole.viewer  # default viewer, admin puede cambiarlo


class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}  # Pydantic v2


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None