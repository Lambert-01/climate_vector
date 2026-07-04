from __future__ import annotations

from fastapi import APIRouter

from app.services.suitability import compute_all_districts, compute_district_suitability

router = APIRouter(tags=["modelling"])


@router.get("/modelling/suitability")
def all_district_suitability() -> dict:
    return {"items": compute_all_districts()}


@router.get("/modelling/suitability/{district}")
def district_suitability(district: str) -> dict:
    return compute_district_suitability(district)
