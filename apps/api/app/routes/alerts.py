from __future__ import annotations

import uuid
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import Principal, require_roles
from app.models import Alert, ResponseAction
from app.services.audit import add_audit_event

router = APIRouter(tags=["alerts"])

_IN_MEMORY_ALERTS: list[dict] = []

VALID_TRANSITIONS = {
    "pending_review": {"active", "rejected", "escalated"},
    "active": {"field_verification_requested", "acknowledged", "escalated", "resolved"},
    "field_verification_requested": {"verified", "escalated", "resolved"},
    "acknowledged": {"resolved", "escalated"},
    "verified": {"resolved", "closed", "escalated"},
    "resolved": {"closed"},
    "escalated": {"resolved", "closed"},
    "rejected": {"closed"},
    "closed": set(),
}

VALID_STATUSES = Literal[
    "pending_review", "active", "field_verification_requested",
    "acknowledged", "verified", "resolved", "closed", "escalated", "rejected",
]


class AlertIn(BaseModel):
    district: str
    risk_level: str
    risk_reason: str
    rule_or_model_version: str = "rule-v1"
    uncertainty_level: str = "high"
    recommended_action: str | None = None
    alert_expiry_date: date | None = None


class AlertStatusUpdate(BaseModel):
    status: str


ACTION_TRANSITIONS = {
    "assigned": {"acknowledged", "cancelled"},
    "acknowledged": {"in_progress", "cancelled"},
    "in_progress": {"completed", "cancelled"},
    "completed": set(), "cancelled": set(),
}


class ResponseActionIn(BaseModel):
    alert_id: str
    action_type: str = Field(min_length=2, max_length=200)
    responsible_organization: str = Field(min_length=2, max_length=200)
    responsible_user: str | None = None
    action_due_date: date | None = None
    follow_up_result: str | None = Field(default=None, max_length=2000)


class ResponseActionUpdate(BaseModel):
    action_status: str
    follow_up_result: str | None = Field(default=None, max_length=2000)


@router.get("/alerts")
async def list_alerts(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        rows = (await db.execute(select(Alert).order_by(Alert.alert_date.desc()))).scalars().all()
    except Exception as exc:
        return {
            "items": _IN_MEMORY_ALERTS,
            "source": "memory_fallback",
            "database_status": "unreachable",
            "database_error": exc.__class__.__name__,
        }
    return {"items": [_alert_dict(a) for a in rows], "source": "db", "database_status": "connected"}


@router.post("/alerts", status_code=201)
async def create_alert(
    payload: AlertIn,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles("admin", "technical_reviewer")),
) -> dict:
    alert = Alert(
        alert_id=str(uuid.uuid4()),
        alert_date=date.today(),
        status="pending_review",
        issued_by=principal.user_id if principal.auth_method == "jwt" else None,
        **payload.model_dump(),
    )
    try:
        db.add(alert)
        add_audit_event(
            db,
            action="create",
            table_name="alerts",
            record_id=alert.alert_id,
            user_id=principal.user_id if principal.auth_method == "jwt" else None,
            new_value=payload.model_dump(),
        )
        await db.commit()
        await db.refresh(alert)
    except Exception:
        await db.rollback()
        fallback = _alert_payload_dict(alert)
        _IN_MEMORY_ALERTS.insert(0, fallback)
        return {**fallback, "source": "memory_fallback"}
    return _alert_dict(alert)


@router.patch("/alerts/{alert_id}/status")
async def update_alert_status(
    alert_id: str,
    payload: AlertStatusUpdate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles("admin", "technical_reviewer")),
) -> dict:
    valid = [
        "pending_review", "active", "field_verification_requested",
        "acknowledged", "verified", "resolved", "closed", "escalated", "rejected",
    ]
    if payload.status not in valid:
        raise HTTPException(422, f"Invalid status. Must be one of: {', '.join(valid)}")
    try:
        alert = await db.get(Alert, alert_id)
        if not alert:
            raise HTTPException(404, "Alert not found")
        _validate_transition(alert.status, payload.status)
        old_status = alert.status
        alert.status = payload.status
        if payload.status == "active" and principal.auth_method == "jwt":
            alert.approved_by = principal.user_id
        add_audit_event(
            db,
            action="status_change",
            table_name="alerts",
            record_id=alert_id,
            user_id=principal.user_id if principal.auth_method == "jwt" else None,
            old_value={"status": old_status},
            new_value={"status": payload.status},
        )
        await db.commit()
        await db.refresh(alert)
    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        fallback = next((a for a in _IN_MEMORY_ALERTS if a["alert_id"] == alert_id), None)
        if not fallback:
            raise HTTPException(404, "Alert not found")
        _validate_transition(fallback.get("status"), payload.status)
        fallback["status"] = payload.status
        return {**fallback, "source": "memory_fallback"}
    return _alert_dict(alert)


@router.get("/response-actions")
async def list_response_actions(alert_id: str | None = None, db: AsyncSession = Depends(get_db)) -> dict:
    query = select(ResponseAction).order_by(ResponseAction.action_due_date.desc())
    if alert_id:
        query = query.where(ResponseAction.alert_id == alert_id)
    rows = (await db.execute(query)).scalars().all()
    return {"items": [_action_dict(row) for row in rows], "source": "database"}


@router.post("/response-actions", status_code=201)
async def create_response_action(
    payload: ResponseActionIn,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles("admin", "technical_reviewer", "field_officer")),
) -> dict:
    if not await db.get(Alert, payload.alert_id):
        raise HTTPException(404, "Alert not found.")
    action = ResponseAction(action_id=str(uuid.uuid4()), action_status="assigned", **payload.model_dump())
    db.add(action)
    add_audit_event(db, action="create", table_name="response_actions", record_id=action.action_id, user_id=principal.user_id if principal.auth_method == "jwt" else None, new_value=payload.model_dump())
    await db.commit()
    await db.refresh(action)
    return _action_dict(action)


@router.patch("/response-actions/{action_id}")
async def update_response_action(
    action_id: str,
    payload: ResponseActionUpdate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles("admin", "technical_reviewer", "field_officer")),
) -> dict:
    action = await db.get(ResponseAction, action_id)
    if not action:
        raise HTTPException(404, "Response action not found.")
    current = action.action_status or "assigned"
    if payload.action_status != current and payload.action_status not in ACTION_TRANSITIONS.get(current, set()):
        raise HTTPException(409, f"Invalid action transition from {current} to {payload.action_status}.")
    if payload.action_status == "completed" and not (payload.follow_up_result or action.follow_up_result):
        raise HTTPException(422, "Completion requires follow-up evidence.")
    old = {"action_status": current, "follow_up_result": action.follow_up_result}
    action.action_status = payload.action_status
    if payload.follow_up_result is not None:
        action.follow_up_result = payload.follow_up_result
    if payload.action_status == "completed":
        action.action_date = date.today()
    add_audit_event(db, action="status_change", table_name="response_actions", record_id=action_id, user_id=principal.user_id if principal.auth_method == "jwt" else None, old_value=old, new_value=payload.model_dump())
    await db.commit()
    await db.refresh(action)
    return _action_dict(action)


def _validate_transition(current: str | None, requested: str) -> None:
    current_status = current or "pending_review"
    if requested == current_status:
        return
    allowed = VALID_TRANSITIONS.get(current_status, set())
    if requested not in allowed:
        allowed_text = ", ".join(sorted(allowed)) or "no further transitions"
        raise HTTPException(
            409,
            f"Invalid transition from {current_status} to {requested}. Allowed: {allowed_text}",
        )


def _alert_payload_dict(a: Alert) -> dict:
    return {
        "alert_id": a.alert_id,
        "alert_date": str(a.alert_date),
        "district": a.district,
        "risk_level": a.risk_level,
        "risk_reason": a.risk_reason,
        "uncertainty_level": a.uncertainty_level,
        "rule_or_model_version": a.rule_or_model_version,
        "status": a.status,
        "recommended_action": a.recommended_action,
        "alert_expiry_date": str(a.alert_expiry_date) if a.alert_expiry_date else None,
        "issued_by": a.issued_by,
        "approved_by": a.approved_by,
    }


def _alert_dict(a: Alert) -> dict:
    return _alert_payload_dict(a)


def _action_dict(row: ResponseAction) -> dict:
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}
