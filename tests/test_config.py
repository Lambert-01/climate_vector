from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.core.config import Settings  # noqa: E402


def test_neon_postgres_url_is_converted_for_asyncpg() -> None:
    settings = Settings(
        database_url=(
            "postgresql://user:password@example.neon.tech/db"
            "?sslmode=require&channel_binding=require"
        )
    )

    assert settings.async_database_url.startswith("postgresql+asyncpg://")
    assert "ssl=require" in settings.async_database_url
    assert "sslmode" not in settings.async_database_url
    assert "channel_binding" not in settings.async_database_url
