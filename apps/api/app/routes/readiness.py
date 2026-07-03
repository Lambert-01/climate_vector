from __future__ import annotations

from fastapi import APIRouter

from app.services.csv_store import read_csv


router = APIRouter(tags=["readiness"])


@router.get("/readiness")
def readiness() -> dict[str, object]:
    rows = read_csv("data/processed/data_readiness_summary.csv")
    return {"items": rows}

