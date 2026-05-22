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


# Creación por admin rxcode — puede elegir el rol y company_id
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: Optional[UserRole] = UserRole.viewer
    company_id: Optional[int] = None


# Creación por company_admin — el role puede ser company_editor o company_viewer
class CompanyUserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: Optional[UserRole] = None  # se valida en la ruta


class UserRead(BaseModel):
    id: UUID
    email: str
    username: str
    role: UserRole
    company_id: Optional[int] = None
    is_active: bool

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    company_id: Optional[int] = None
    is_active: Optional[bool] = None