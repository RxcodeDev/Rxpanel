import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def test():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT 1"))
        print(result.scalar())

asyncio.run(test())