from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Alert, MosquitoObservation, ResistanceTestReplicate, Site
from app.services.csv_store import read_csv, read_nasa_power_csv

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)) -> dict:
    site_count = (await db.execute(select(func.count()).select_from(Site))).scalar_one()
    obs_count = (await db.execute(select(func.count()).select_from(MosquitoObservation))).scalar_one()
    res_count = (await db.execute(select(func.count()).select_from(ResistanceTestReplicate))).scalar_one()
    alert_count = (await db.execute(
        select(func.count()).select_from(Alert).where(Alert.status == "active")
    )).scalar_one()
    return {
        "sites": site_count,
        "mosquito_observations": obs_count,
        "resistance_tests": res_count,
        "active_alerts": alert_count,
        "source": "db",
    }


@router.get("/dashboard/database-status")
async def database_status(db: AsyncSession = Depends(get_db)) -> dict:
    await db.execute(text("select 1"))
    counts = {
        "sites": (await db.execute(select(func.count()).select_from(Site))).scalar_one(),
        "mosquito_observations": (await db.execute(select(func.count()).select_from(MosquitoObservation))).scalar_one(),
        "resistance_test_replicates": (
            await db.execute(select(func.count()).select_from(ResistanceTestReplicate))
        ).scalar_one(),
        "alerts": (await db.execute(select(func.count()).select_from(Alert))).scalar_one(),
    }
    return {
        "connected": True,
        "source": "db",
        "counts": counts,
        "operational_data_ready": counts["mosquito_observations"] > 0 and counts["resistance_test_replicates"] > 0,
    }


@router.get("/dashboard/readiness")
def dashboard_readiness() -> dict:
    return {"items": read_csv("data/processed/data_readiness_summary.csv")}


@router.get("/dashboard/climate-summary")
def climate_summary() -> dict:
    rows = read_nasa_power_csv("data/external/nasa_power/gasabo_nasa_power_2021_2025.csv")
    return {"district": "gasabo", "items": rows[-90:]}
