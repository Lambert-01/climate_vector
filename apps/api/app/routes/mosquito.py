from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import FieldVisit, MosquitoObservation, Site

router = APIRouter(tags=["mosquito"])


@router.get("/mosquito/records")
async def mosquito_records(
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> dict:
    total = (await db.execute(select(func.count()).select_from(MosquitoObservation))).scalar_one()
    rows = (
        await db.execute(
            select(MosquitoObservation, FieldVisit, Site)
            .outerjoin(FieldVisit, MosquitoObservation.visit_id == FieldVisit.visit_id)
            .outerjoin(Site, FieldVisit.site_id == Site.site_id)
            .offset(offset)
            .limit(limit)
        )
    ).all()
    return {"total": total, "items": [_obs_dict(obs, visit, site) for obs, visit, site in rows], "source": "db"}


@router.get("/mosquito/by-district")
async def mosquito_by_district(db: AsyncSession = Depends(get_db)) -> dict:
    rows = (
        await db.execute(
            select(Site.district, func.count(MosquitoObservation.observation_id))
            .select_from(MosquitoObservation)
            .outerjoin(FieldVisit, MosquitoObservation.visit_id == FieldVisit.visit_id)
            .outerjoin(Site, FieldVisit.site_id == Site.site_id)
            .group_by(Site.district)
            .order_by(func.count(MosquitoObservation.observation_id).desc())
        )
    ).all()
    return {"items": [{"value": district or "Unknown", "count": count} for district, count in rows], "source": "db"}


@router.get("/mosquito/by-species")
async def mosquito_by_species(db: AsyncSession = Depends(get_db)) -> dict:
    rows = (
        await db.execute(
            select(MosquitoObservation.species_raw, func.count(MosquitoObservation.observation_id))
            .group_by(MosquitoObservation.species_raw)
            .order_by(func.count(MosquitoObservation.observation_id).desc())
        )
    ).all()
    return {"items": [{"value": species or "Unknown", "count": count} for species, count in rows], "source": "db"}


@router.get("/mosquito/by-breeding-site")
async def mosquito_by_breeding_site(db: AsyncSession = Depends(get_db)) -> dict:
    rows = (
        await db.execute(
            select(FieldVisit.habitat_type, func.count(MosquitoObservation.observation_id))
            .select_from(MosquitoObservation)
            .outerjoin(FieldVisit, MosquitoObservation.visit_id == FieldVisit.visit_id)
            .group_by(FieldVisit.habitat_type)
            .order_by(func.count(MosquitoObservation.observation_id).desc())
        )
    ).all()
    return {"items": [{"value": habitat or "Unknown", "count": count} for habitat, count in rows], "source": "db"}


def _obs_dict(r: MosquitoObservation, visit: FieldVisit | None = None, site: Site | None = None) -> dict:
    return {
        "observation_id": r.observation_id,
        "source_row_id": r.observation_id.replace("raw-mosquito-", ""),
        "visit_id": r.visit_id,
        "site_id": site.site_id if site else None,
        "site_name": site.site_name if site else None,
        "district": site.district if site else None,
        "habitat_type": visit.habitat_type if visit else None,
        "visit_date": str(visit.visit_date) if visit and visit.visit_date else None,
        "quality_flag": visit.quality_flag if visit else None,
        "life_stage": r.life_stage,
        "count": r.count,
        "species_raw": r.species_raw,
        "species_clean": r.species_clean,
        "identification_method": r.identification_method,
    }
