from __future__ import annotations

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import Principal, require_roles
from app.models import AuditLog, ClimateDaily, DatasetRegistry

router = APIRouter(prefix="/operations", tags=["operations"])


@router.get("/status")
async def operational_status(db: AsyncSession = Depends(get_db)) -> dict:
    now = datetime.now(timezone.utc)
    try:
        await db.execute(text("SELECT 1"))
        latest_climate = (await db.execute(select(func.max(ClimateDaily.date)))).scalar_one_or_none()
        datasets = (await db.execute(select(func.count()).select_from(DatasetRegistry))).scalar_one()
        audits = (await db.execute(select(func.count()).select_from(AuditLog))).scalar_one()
        climate_age = (date.today() - latest_climate).days if latest_climate else None
        return {
            "status": "operational", "checked_at": now, "database": "connected",
            "dataset_registry_count": datasets, "audit_event_count": audits,
            "latest_climate_date": latest_climate, "climate_age_days": climate_age,
            "climate_freshness": "current" if climate_age is not None and climate_age <= 2 else "stale_or_historical",
        }
    except Exception as exc:
        return {"status": "degraded", "checked_at": now, "database": "unreachable", "error_type": exc.__class__.__name__}


@router.get("/datasets")
async def datasets(db: AsyncSession = Depends(get_db)) -> dict:
    rows = (await db.execute(select(DatasetRegistry).order_by(DatasetRegistry.dataset_name))).scalars().all()
    return {"items": [{column.name: getattr(row, column.name) for column in row.__table__.columns} for row in rows]}


@router.get("/audit")
async def audit_log(
    limit: int = 200,
    db: AsyncSession = Depends(get_db),
    _principal: Principal = Depends(require_roles("admin", "data_manager", "technical_reviewer")),
) -> dict:
    safe_limit = min(max(limit, 1), 1000)
    rows = (await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(safe_limit))).scalars().all()
    return {"items": [{column.name: getattr(row, column.name) for column in row.__table__.columns} for row in rows]}
