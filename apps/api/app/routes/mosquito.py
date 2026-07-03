from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import MosquitoObservation
from app.services.csv_store import read_csv

router = APIRouter(tags=["mosquito"])


@router.get("/mosquito/records")
async def mosquito_records(
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        total = (await db.execute(select(func.count()).select_from(MosquitoObservation))).scalar_one()
        rows = (
            await db.execute(select(MosquitoObservation).offset(offset).limit(limit))
        ).scalars().all()
        if total > 0:
            return {"total": total, "items": [_obs_dict(r) for r in rows]}
    except Exception:
        pass
    rows = read_csv("data/processed/mosquito_ecology_preliminary.csv")
    return {"total": len(rows), "items": rows[offset : offset + limit]}


@router.get("/mosquito/by-district")
def mosquito_by_district() -> dict:
    return {"items": read_csv("outputs/tables/mosquito_district_raw_frequency.csv")}


@router.get("/mosquito/by-species")
def mosquito_by_species() -> dict:
    return {"items": read_csv("outputs/tables/mosquito_anopheles_species_raw_frequency.csv")}


@router.get("/mosquito/by-breeding-site")
def mosquito_by_breeding_site() -> dict:
    return {"items": read_csv("outputs/tables/mosquito_breeding_site_type_raw_frequency.csv")}


def _obs_dict(r: MosquitoObservation) -> dict:
    return {
        "observation_id": r.observation_id,
        "life_stage": r.life_stage,
        "count": r.count,
        "species_raw": r.species_raw,
        "species_clean": r.species_clean,
        "identification_method": r.identification_method,
    }
