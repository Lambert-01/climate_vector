from __future__ import annotations

from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

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
    operator_api_key: str = ""
    api_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"

    jwt_secret: str = "dev-jwt-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    bootstrap_admin_email: str = ""
    bootstrap_admin_password: str = ""
    bootstrap_admin_name: str = "Platform Administrator"
    sentry_dsn: str = ""
    max_upload_mb: int = 5

    project_name: str = "DengueEW-GL"
    project_env: str = "development"

    @property
    def is_production(self) -> bool:
        return self.project_env.strip().lower() in {"production", "staging"}

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.api_cors_origins.split(",")]

    @property
    def async_database_url(self) -> str:
        """Return a SQLAlchemy async URL even when Neon provides a plain PostgreSQL URL."""
        url = self.database_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)

        parts = urlsplit(url)
        query = dict(parse_qsl(parts.query, keep_blank_values=True))

        sslmode = query.pop("sslmode", None)
        query.pop("channel_binding", None)
        if sslmode == "require" and "ssl" not in query:
            query["ssl"] = "require"

        return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


settings = Settings()
