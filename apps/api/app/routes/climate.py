from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.services.csv_store import read_nasa_power_csv

router = APIRouter(tags=["climate"])

NASA_POWER_DIR = Path(__file__).resolve().parents[4] / "data" / "external" / "nasa_power"


@router.get("/climate/districts")
def climate_districts() -> dict:
    """List all districts that have NASA POWER climate data."""
    files = sorted(NASA_POWER_DIR.glob("*_nasa_power_*.csv"))
    districts = [f.name.split("_nasa_power")[0] for f in files]
    return {"districts": districts}


@router.get("/climate/district/{district}")
def climate_district(district: str, days: int = 90) -> dict:
    path = NASA_POWER_DIR / f"{district}_nasa_power_2021_2025.csv"
    if not path.exists():
        raise HTTPException(404, f"No climate data for district: {district}")
    rows = read_nasa_power_csv(str(path.relative_to(path.parents[4])))
    return {"district": district, "items": rows[-days:]}


@router.get("/climate/kigali")
def climate_kigali(days: int = 90) -> dict:
    rows = read_nasa_power_csv("data/climate/kigali_test_2021_2025.csv")
    return {"items": rows[-days:]}
