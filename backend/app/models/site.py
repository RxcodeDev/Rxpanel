# app/models/site.py
import enum
import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, Enum, ForeignKey, func, Index, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class SiteStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    maintenance = "maintenance"
    error = "error"


class Site(Base):
    __tablename__ = "sites"
    __table_args__ = (
        # Unicidad de URL solo entre sitios activos: un sitio borrado con soft
        # delete (is_active=False) no bloquea la reutilizacion de su URL.
        Index(
            "uq_sites_url_active",
            "url",
            unique=True,
            postgresql_where=text("is_active"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[SiteStatus] = mapped_column(Enum(SiteStatus), default=SiteStatus.active)
    is_ssl: Mapped[bool] = mapped_column(Boolean, default=False)

    # Token de API encriptado con Fernet
    api_token: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Apariencia: icono (clave del set predefinido) y color hex
    icon: Mapped[str | None] = mapped_column(String(64), nullable=True)
    icon_color: Mapped[str | None] = mapped_column(String(16), nullable=True)

    # Soft delete
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    owner: Mapped["User"] = relationship("User", backref="sites")

    # Empresa dueña del sitio. Nulo para sitios internos de rxcode.
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
