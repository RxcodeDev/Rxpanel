import asyncio
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password
from sqlalchemy import select


async def create_admin():
    async with SessionLocal() as db:
        existing = await db.execute(select(User).where(User.email == "audit@rxcode.com.mx"))
        if existing.scalar():
            print("El usuario ya existe, nada que hacer.")
            return
        admin = User(
            email="audit@rxcode.com.mx",
            username="audit.rxcode.com.mx",
            hashed_password=hash_password("Srvty04.1234"),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print("Admin creado: audit@rxcode.com.mx")


asyncio.run(create_admin())
