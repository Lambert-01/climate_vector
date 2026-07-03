from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import ResistanceTestReplicate
from app.services.csv_store import read_csv

router = APIRouter(tags=["resistance"])


@router.get("/resistance/records")
async def resistance_records(
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        total = (await db.execute(select(func.count()).select_from(ResistanceTestReplicate))).scalar_one()
        rows = (
            await db.execute(select(ResistanceTestReplicate).offset(offset).limit(limit))
        ).scalars().all()
        if total > 0:
            return {"total": total, "items": [_res_dict(r) for r in rows]}
    except Exception:
        pass
    rows = read_csv("data/processed/resistance_test_replicates_preliminary.csv")
    return {"total": len(rows), "items": rows[offset : offset + limit]}


@router.get("/resistance/by-insecticide")
def resistance_by_insecticide() -> dict:
    return {"items": read_csv("outputs/tables/resistance_insecticide_tested_raw_frequency.csv")}


@router.get("/resistance/death-summary")
def resistance_death_summary() -> dict:
    return {"items": read_csv("outputs/tables/resistance_death_summary_by_insecticide.csv")}


@router.get("/resistance/by-district")
def resistance_by_district() -> dict:
    return {"items": read_csv("outputs/tables/resistance_district_raw_frequency.csv")}


def _res_dict(r: ResistanceTestReplicate) -> dict:
    return {
        "replicate_id": r.replicate_id,
        "district": r.district,
        "species_raw": r.species_raw,
        "insecticide_tested": r.insecticide_tested,
        "concentration_label": r.concentration_label,
        "number_exposed": r.number_exposed,
        "number_dead_24h": r.number_dead_24h,
        "mortality_rate": r.mortality_rate,
        "resistance_status": r.resistance_status,
        "quality_flag": r.quality_flag,
    }
