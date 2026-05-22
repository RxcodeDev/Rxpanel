# app/schemas/company.py
from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class CompanyCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CompanyRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
