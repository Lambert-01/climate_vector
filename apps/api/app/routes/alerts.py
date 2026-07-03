from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Alert

router = APIRouter(tags=["alerts"])


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
        return {"items": [_alert_dict(a) for a in rows]}
    except Exception:
        return {"items": _mock_alerts()}


@router.post("/alerts", status_code=201)
async def create_alert(payload: AlertIn, db: AsyncSession = Depends(get_db)) -> dict:
    alert = Alert(
        alert_id=str(uuid.uuid4()),
        alert_date=date.today(),
        status="pending_review",
        **payload.model_dump(),
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return _alert_dict(alert)


@router.patch("/alerts/{alert_id}/status")
async def update_alert_status(
    alert_id: str,
    payload: AlertStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found")
    alert.status = payload.status
    await db.commit()
    return _alert_dict(alert)


def _alert_dict(a: Alert) -> dict:
    return {
        "alert_id": a.alert_id,
        "alert_date": str(a.alert_date),
        "district": a.district,
        "risk_level": a.risk_level,
        "risk_reason": a.risk_reason,
        "uncertainty_level": a.uncertainty_level,
        "status": a.status,
        "recommended_action": a.recommended_action,
    }


def _mock_alerts() -> list[dict]:
    return [
        {
            "alert_id": "mock-001",
            "alert_date": str(date.today()),
            "district": "Bugesera",
            "risk_level": "medium",
            "risk_reason": "Elevated rainfall + historical breeding site activity",
            "uncertainty_level": "high",
            "status": "pending_review",
            "recommended_action": "Increase larval surveillance frequency",
        },
        {
            "alert_id": "mock-002",
            "alert_date": str(date.today()),
            "district": "Gasabo",
            "risk_level": "low",
            "risk_reason": "Seasonal temperature within normal range",
            "uncertainty_level": "high",
            "status": "acknowledged",
            "recommended_action": "Routine monitoring",
        },
    ]
