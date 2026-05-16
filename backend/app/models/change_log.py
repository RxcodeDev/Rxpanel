import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class ChangeLog(Base):
    __tablename__ = "change_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    site_id: Mapped[int] = mapped_column(
        ForeignKey("sites.id"),
        nullable=False
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    section: Mapped[str] = mapped_column(String(100), nullable=False)
    change_type: Mapped[str] = mapped_column(String(50), nullable=False)

    payload_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)

    site: Mapped["Site"] = relationship("Site", backref="change_logs")
    user: Mapped["User"] = relationship("User", backref="change_logs")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())