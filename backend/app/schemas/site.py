# app/schemas/site.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, HttpUrl
from app.models.site import SiteStatus


class SiteBase(BaseModel):
    name: str
    url: HttpUrl
    description: str | None = None
    status: SiteStatus = SiteStatus.active
    is_ssl: bool = False
    icon: str | None = None
    icon_color: str | None = None


class SiteCreate(SiteBase):
    api_token: str | None = None          # se encripta antes de guardar


class SiteUpdate(BaseModel):
    name: str | None = None
    url: HttpUrl | None = None
    description: str | None = None
    status: SiteStatus | None = None
    is_ssl: bool | None = None
    api_token: str | None = None          # si viene, se re-encripta
    icon: str | None = None
    icon_color: str | None = None


class SiteRead(SiteBase):
    id: int
    owner_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # api_token NO se expone en la respuesta

    model_config = {"from_attributes": True}
