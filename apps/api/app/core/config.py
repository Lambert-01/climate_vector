from __future__ import annotations

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite+aiosqlite:///./dev.db"
    database_sync_url: str = "sqlite:///./dev.db"

    api_secret_key: str = "dev-secret"
    api_cors_origins: str = "http://localhost:5173"

    jwt_secret: str = "dev-jwt-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    project_name: str = "Climate Vector Rwanda"
    project_env: str = "development"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.api_cors_origins.split(",")]


settings = Settings()
