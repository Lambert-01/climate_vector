from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import ResistanceTestReplicate

router = APIRouter(tags=["resistance"])


@router.get("/resistance/records")
async def resistance_records(
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> dict:
    total = (await db.execute(select(func.count()).select_from(ResistanceTestReplicate))).scalar_one()
    rows = (
        await db.execute(select(ResistanceTestReplicate).offset(offset).limit(limit))
    ).scalars().all()
    return {"total": total, "items": [_res_dict(r) for r in rows], "source": "db"}


@router.get("/resistance/by-insecticide")
async def resistance_by_insecticide(db: AsyncSession = Depends(get_db)) -> dict:
    rows = (
        await db.execute(
            select(ResistanceTestReplicate.insecticide_tested, func.count(ResistanceTestReplicate.replicate_id))
            .group_by(ResistanceTestReplicate.insecticide_tested)
            .order_by(func.count(ResistanceTestReplicate.replicate_id).desc())
        )
    ).all()
    return {"items": [{"value": insecticide or "Unknown", "count": count} for insecticide, count in rows], "source": "db"}


@router.get("/resistance/death-summary")
async def resistance_death_summary(db: AsyncSession = Depends(get_db)) -> dict:
    rows = (
        await db.execute(
            select(
                ResistanceTestReplicate.insecticide_tested,
                func.count(ResistanceTestReplicate.replicate_id),
                func.avg(ResistanceTestReplicate.number_dead_24h),
                func.min(ResistanceTestReplicate.number_dead_24h),
                func.max(ResistanceTestReplicate.number_dead_24h),
            )
            .group_by(ResistanceTestReplicate.insecticide_tested)
            .order_by(func.count(ResistanceTestReplicate.replicate_id).desc())
        )
    ).all()
    return {
        "items": [
            {
                "insecticide_tested_raw": insecticide or "Unknown",
                "records": count,
                "mean": round(float(mean or 0), 2),
                "min": minimum,
                "max": maximum,
            }
            for insecticide, count, mean, minimum, maximum in rows
        ],
        "source": "db",
    }


@router.get("/resistance/by-district")
async def resistance_by_district(db: AsyncSession = Depends(get_db)) -> dict:
    rows = (
        await db.execute(
            select(ResistanceTestReplicate.district, func.count(ResistanceTestReplicate.replicate_id))
            .group_by(ResistanceTestReplicate.district)
            .order_by(func.count(ResistanceTestReplicate.replicate_id).desc())
        )
    ).all()
    return {"items": [{"value": district or "Unknown", "count": count} for district, count in rows], "source": "db"}


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
