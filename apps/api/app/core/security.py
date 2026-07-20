from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from secrets import compare_digest
from typing import Callable

from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models import User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
operator_key_header = APIKeyHeader(name="X-Operator-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)

ROLES = {"admin", "technical_reviewer", "field_officer", "lab_analyst", "data_manager", "viewer"}


@dataclass(frozen=True)
class Principal:
    user_id: str
    email: str | None
    full_name: str
    role: str
    auth_method: str


def require_operator(api_key: str | None = Security(operator_key_header)) -> str:
    """Validate the legacy integration key; production never fails open."""
    expected = settings.operator_api_key.strip()
    if not expected:
        if settings.is_production:
            raise HTTPException(503, "Operator authentication is not configured.")
        return "development-operator"
    if not api_key or not compare_digest(api_key, expected):
        raise HTTPException(401, "Valid operator key required for this action.")
    return "pilot-operator"


async def get_current_principal(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
    api_key: str | None = Security(operator_key_header),
    db: AsyncSession = Depends(get_db),
) -> Principal:
    if credentials:
        payload = decode_token(credentials.credentials)
        user_id = str(payload.get("sub") or "")
        if not user_id:
            raise HTTPException(401, "Invalid or expired access token.")
        user = await db.get(User, user_id)
        if not user or user.active_status != "active":
            raise HTTPException(401, "User account is unavailable or inactive.")
        return Principal(user.user_id, user.email, user.full_name, user.role, "jwt")

    expected = settings.operator_api_key.strip()
    if expected and api_key and compare_digest(api_key, expected):
        return Principal("operator-key", None, "Integration operator", "admin", "operator_key")
    if not settings.is_production and not expected:
        return Principal("development-operator", None, "Development operator", "admin", "development")
    raise HTTPException(401, "Sign in or provide a valid operator integration key.")


def require_roles(*allowed_roles: str) -> Callable:
    unknown = set(allowed_roles) - ROLES
    if unknown:
        raise ValueError(f"Unknown roles: {', '.join(sorted(unknown))}")

    async def dependency(principal: Principal = Depends(get_current_principal)) -> Principal:
        if principal.role not in allowed_roles:
            raise HTTPException(403, "Your role is not authorized for this action.")
        return principal

    return dependency


require_write_access = require_roles("admin", "technical_reviewer", "field_officer", "lab_analyst", "data_manager")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": subject, "role": role, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return {}
