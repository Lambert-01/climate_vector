from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Alert
from app.services.csv_store import read_csv

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
        if rows:
            return {"items": [_alert_dict(a) for a in rows], "source": "db"}
    except Exception:
        pass
    return {"items": _current_data_alerts(), "source": "current_data"}


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
    return _current_data_alerts()


def _current_data_alerts() -> list[dict]:
    site_rows = read_csv("data/sites/sites.csv")
    district_rows = read_csv("outputs/tables/mosquito_district_raw_frequency.csv")
    rainfall_by_district = {
        row.get("district", "").strip().lower(): row
        for row in read_csv("data/processed/public_data_district_features.csv")
    }
    district_counts = {
        row.get("value", "").strip().lower(): int(float(row.get("count") or 0))
        for row in district_rows
        if row.get("value")
    }
    site_counts: dict[str, int] = {}
    for row in site_rows:
        district = row.get("district", "").strip().lower()
        site_counts[district] = site_counts.get(district, 0) + 1

    candidates = []
    for district, count in district_counts.items():
        climate = rainfall_by_district.get(district, {})
        rainfall = float(climate.get("rainfall_mean_daily_mm") or 0)
        score = count * 0.65 + rainfall * 35 + site_counts.get(district, 0) * 8
        candidates.append((score, district, count, rainfall, site_counts.get(district, 0)))
    candidates.sort(reverse=True)

    rows = []
    for index, (_, district, count, rainfall, sites) in enumerate(candidates[:5], start=1):
        risk_level = "high" if index <= 2 else "medium"
        rows.append(
            {
                "alert_id": f"current-data-{index:03d}",
                "alert_date": str(date.today()),
                "district": district.title(),
                "risk_level": risk_level,
                "risk_reason": f"{count} PI ecology records, {sites} mapped sites, {rainfall:.2f} mm/day rainfall proxy",
                "uncertainty_level": "managed",
                "status": "pending_review" if index <= 3 else "acknowledged",
                "recommended_action": "Prioritize site GPS validation and targeted larval/resistance follow-up",
            }
        )
    return rows
