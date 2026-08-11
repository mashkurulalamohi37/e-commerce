import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.core import security
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.models.user import User

async def main():
    email = "admin@nillsmart.com"
    password = "admin12345"
    full_name = "Store Admin"

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(User).where(User.email == email))).scalars().first()
        if existing:
            existing.role = "admin"
            db.add(existing)
            await db.commit()
            print(f"Admin account updated: {email}")
        else:
            u = User(
                email=email,
                hashed_password=security.get_password_hash(password),
                full_name=full_name,
                role="admin",
            )
            db.add(u)
            await db.commit()
            print(f"Created admin account: {email} / {password}")

if __name__ == "__main__":
    asyncio.run(main())
