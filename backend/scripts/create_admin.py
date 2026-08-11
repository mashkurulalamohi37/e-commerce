"""Create or promote an administrator.

Replaces the old in-app "Claim admin access" button, which was shown to every
signed-in customer and handed the role to whoever pressed it first.

    python scripts/create_admin.py admin@yourdomain.com
    python scripts/create_admin.py admin@yourdomain.com --name "Store Owner"

The password is prompted for, never passed as an argument (arguments show up in
shell history and process listings).
"""

import argparse
import asyncio
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from app.core import security  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import AsyncSessionLocal, engine  # noqa: E402
from app.models.user import User  # noqa: E402

MIN_PASSWORD_LENGTH = 8


async def run(email: str, full_name: str | None) -> int:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(User).where(User.email == email))).scalars().first()

        if existing:
            if existing.role == "admin":
                print(f"{email} is already an administrator.")
                return 0
            existing.role = "admin"
            db.add(existing)
            await db.commit()
            print(f"Promoted {email} to administrator.")
            return 0

        password = getpass.getpass("New admin password: ")
        if len(password) < MIN_PASSWORD_LENGTH:
            print(f"Password must be at least {MIN_PASSWORD_LENGTH} characters.", file=sys.stderr)
            return 1
        if password != getpass.getpass("Confirm password: "):
            print("Passwords do not match.", file=sys.stderr)
            return 1

        db.add(
            User(
                email=email,
                hashed_password=security.get_password_hash(password),
                full_name=full_name,
                role="admin",
            )
        )
        await db.commit()
        print(f"Created administrator {email}.")
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Create or promote a Nills Mart administrator.")
    parser.add_argument("email", help="Email address of the account")
    parser.add_argument("--name", dest="full_name", default=None, help="Full name for a new account")
    args = parser.parse_args()

    try:
        return asyncio.run(run(args.email.strip().lower(), args.full_name))
    except KeyboardInterrupt:
        print("\nCancelled.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
