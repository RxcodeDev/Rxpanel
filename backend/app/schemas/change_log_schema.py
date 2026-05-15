# app/schemas/change_log.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class ChangeLogRead(BaseModel):
    id: UUID
    site_id: int
    user_id: UUID
    section: str
    change_type: str
    payload_snapshot: dict
    created_at: datetime

    model_config = {"from_attributes": True}
