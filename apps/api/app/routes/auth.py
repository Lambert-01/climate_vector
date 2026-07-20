from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import Principal, create_access_token, get_current_principal, hash_password, require_roles, verify_password
from app.models import User
from app.services.audit import add_audit_event

router = APIRouter(prefix="/auth", tags=["authentication"])


class LoginIn(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=200)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        email = value.strip().lower()
        if email.count("@") != 1 or "." not in email.split("@", 1)[1]:
            raise ValueError("Enter a valid email address.")
        return email


class UserIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=12, max_length=200)
    role: str
    organization_id: str | None = None

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        return LoginIn.valid_email(value)


def user_dict(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "active_status": user.active_status,
        "organization_id": user.organization_id,
    }


@router.post("/login")
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)) -> dict:
    user = (await db.execute(select(User).where(User.email == payload.email.lower()))).scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password.")
    if user.active_status != "active":
        raise HTTPException(403, "This account is inactive.")
    return {"access_token": create_access_token(user.user_id, user.role), "token_type": "bearer", "user": user_dict(user)}


@router.get("/me")
async def me(principal: Principal = Depends(get_current_principal)) -> dict:
    return principal.__dict__


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _principal: Principal = Depends(require_roles("admin")),
) -> dict:
    users = (await db.execute(select(User).order_by(User.full_name))).scalars().all()
    return {"items": [user_dict(user) for user in users]}


@router.post("/users", status_code=201)
async def create_user(
    payload: UserIn,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles("admin")),
) -> dict:
    from app.core.security import ROLES
    if payload.role not in ROLES:
        raise HTTPException(422, f"Invalid role. Allowed: {', '.join(sorted(ROLES))}")
    email = payload.email.lower()
    if (await db.execute(select(User).where(User.email == email))).scalar_one_or_none():
        raise HTTPException(409, "A user with this email already exists.")
    user = User(
        user_id=str(uuid.uuid4()), full_name=payload.full_name.strip(), email=email,
        hashed_password=hash_password(payload.password), organization_id=payload.organization_id,
        role=payload.role, active_status="active",
    )
    db.add(user)
    add_audit_event(db, action="create", table_name="users", record_id=user.user_id, user_id=principal.user_id, new_value=user_dict(user))
    await db.commit()
    return user_dict(user)
