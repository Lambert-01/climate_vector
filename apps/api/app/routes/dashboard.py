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
    try:
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
    except Exception:
        # Fallback to CSV when DB is not yet seeded
        readiness = read_csv("data/processed/data_readiness_summary.csv")
        mosquito_rows = read_csv("data/processed/mosquito_ecology_preliminary.csv")
        sites = {row.get("site_raw", "").strip().lower() for row in mosquito_rows if row.get("site_raw")}
        return {
            "sites": len(sites),
            "mosquito_observations": len(mosquito_rows),
            "resistance_tests": len(read_csv("data/processed/resistance_test_replicates_preliminary.csv")),
            "active_alerts": 0,
            "readiness_items": len(readiness),
            "source": "csv",
        }


@router.get("/dashboard/readiness")
def dashboard_readiness() -> dict:
    return {"items": read_csv("data/processed/data_readiness_summary.csv")}


@router.get("/dashboard/climate-summary")
def climate_summary() -> dict:
    rows = read_nasa_power_csv("data/external/nasa_power/gasabo_nasa_power_2021_2025.csv")
    return {"district": "gasabo", "items": rows[-90:]}
