from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Site
from app.services.csv_store import read_csv

router = APIRouter(tags=["sites"])


class SiteIn(BaseModel):
    site_id: str
    site_name: str
    district: str | None = None
    province: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    coordinate_source: str | None = None
    coordinate_quality: str | None = None


@router.get("/sites")
async def list_sites(db: AsyncSession = Depends(get_db)) -> dict:
    rows = (await db.execute(select(Site).order_by(Site.district, Site.site_name))).scalars().all()
    return {"items": [_site_dict(s) for s in rows], "source": "db"}


@router.get("/sites/coordinate-candidates")
def site_coordinate_candidates() -> dict:
    rows = read_csv("data/processed/site_coordinate_candidates.csv")
    return {
        "items": rows,
        "model_note": "Provisional district-centroid coordinates for map discussion only; not official site GPS.",
    }


@router.get("/sites/sentinel-registry")
def sentinel_registry() -> dict:
    rows = read_csv("data/processed/context/sentinel_sites_33.csv")
    return {
        "items": rows,
        "source": "Map- 33 sentinel.xls",
        "model_note": "Lecturer-provided WKT coordinates for Rwanda proof-of-concept sentinel mapping.",
    }


@router.get("/sites/{site_id}")
async def get_site(site_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    site = await db.get(Site, site_id)
    if not site:
        raise HTTPException(404, "Site not found")
    return _site_dict(site)


@router.post("/sites", status_code=201)
async def create_site(payload: SiteIn, db: AsyncSession = Depends(get_db)) -> dict:
    site = Site(**payload.model_dump())
    db.add(site)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409, f"Site with ID '{payload.site_id}' already exists.")
    await db.refresh(site)
    return _site_dict(site)


def _site_dict(s: Site) -> dict:
    return {
        "site_id": s.site_id,
        "site_name": s.site_name,
        "district": s.district,
        "province": s.province,
        "latitude": s.latitude,
        "longitude": s.longitude,
        "coordinate_source": s.coordinate_source,
        "coordinate_quality": s.coordinate_quality,
    }
