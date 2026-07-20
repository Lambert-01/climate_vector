#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import sys
import uuid
from pathlib import Path

from sqlalchemy import select

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.core.config import settings  # noqa: E402
from app.core.database import AsyncSessionLocal  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models import User  # noqa: E402


async def main() -> None:
    email = settings.bootstrap_admin_email.strip().lower()
    password = settings.bootstrap_admin_password
    if not email or len(password) < 12:
        raise SystemExit("Set BOOTSTRAP_ADMIN_EMAIL and a BOOTSTRAP_ADMIN_PASSWORD of at least 12 characters.")
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if existing:
            existing.hashed_password = hash_password(password)
            existing.role = "admin"
            existing.active_status = "active"
            existing.full_name = settings.bootstrap_admin_name
            message = "Updated"
        else:
            db.add(User(user_id=str(uuid.uuid4()), full_name=settings.bootstrap_admin_name, email=email, hashed_password=hash_password(password), role="admin", active_status="active"))
            message = "Created"
        await db.commit()
    print(f"{message} administrator account for {email}.")


if __name__ == "__main__":
    asyncio.run(main())
