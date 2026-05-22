# app/schemas/invite_token.py
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class InviteTokenRead(BaseModel):
    id: UUID
    token: str
    company_id: int
    is_used: bool
    expires_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteRegister(BaseModel):
    """Payload del formulario público de registro via invitacion."""
    token: str
    username: str
    password: str
