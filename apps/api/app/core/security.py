from __future__ import annotations

from datetime import datetime, timedelta, timezone
from secrets import compare_digest

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
operator_key_header = APIKeyHeader(name="X-Operator-Key", auto_error=False)


def require_operator(api_key: str | None = Security(operator_key_header)) -> str:
    """Protect pilot write operations when OPERATOR_API_KEY is configured."""
    expected = settings.operator_api_key.strip()
    if not expected:
        return "development-operator"
    if not api_key or not compare_digest(api_key, expected):
        raise HTTPException(401, "Valid operator key required for this action.")
    return "pilot-operator"


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
