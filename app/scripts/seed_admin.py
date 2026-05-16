# app/scripts/seed_admin.py
import asyncio
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password

async def create_superadmin():
    async with SessionLocal() as db:
        admin = User(
            email="adminrxcode@gmail.com",
            username="superadmin",
            hashed_password=hash_password("password_seguro"),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print("Admin creado correctamente")

asyncio.run(create_superadmin())