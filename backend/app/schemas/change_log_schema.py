# app/schemas/change_log_schema.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class ChangeLogUser(BaseModel):
    """Datos mínimos del usuario que hizo el cambio (sin información sensible)."""
    email: str
    username: str

    model_config = {"from_attributes": True}


class ChangeLogRead(BaseModel):
    id: UUID
    site_id: int
    user_id: UUID
    section: str
    change_type: str
    payload_snapshot: dict
    created_at: datetime
    user: ChangeLogUser | None = None

    model_config = {"from_attributes": True}
