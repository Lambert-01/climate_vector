from __future__ import annotations

import uuid
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Alert

router = APIRouter(tags=["alerts"])

_IN_MEMORY_ALERTS: list[dict] = []

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
async def create_alert(payload: AlertIn, db: AsyncSession = Depends(get_db)) -> dict:
    alert = Alert(
        alert_id=str(uuid.uuid4()),
        alert_date=date.today(),
        status="pending_review",
        **payload.model_dump(),
    )
    try:
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
    except Exception:
        fallback = _alert_payload_dict(alert)
        _IN_MEMORY_ALERTS.insert(0, fallback)
        return {**fallback, "source": "memory_fallback"}
    return _alert_dict(alert)


@router.patch("/alerts/{alert_id}/status")
async def update_alert_status(
    alert_id: str,
    payload: AlertStatusUpdate,
    db: AsyncSession = Depends(get_db),
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
        alert.status = payload.status
        await db.commit()
        await db.refresh(alert)
    except HTTPException:
        raise
    except Exception:
        fallback = next((a for a in _IN_MEMORY_ALERTS if a["alert_id"] == alert_id), None)
        if not fallback:
            raise HTTPException(404, "Alert not found")
        fallback["status"] = payload.status
        return {**fallback, "source": "memory_fallback"}
    return _alert_dict(alert)


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
