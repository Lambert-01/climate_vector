from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter

from app.services.csv_store import read_csv


ROOT = Path(__file__).resolve().parents[4]

router = APIRouter(tags=["public-data"])


@router.get("/public-data/sources")
def public_data_sources() -> dict:
    return {"items": read_csv("outputs/tables/public_data_sources_inventory.csv")}


@router.get("/public-data/worldclim")
def worldclim_manifest() -> dict:
    return {"items": read_csv("outputs/tables/worldclim_archives_manifest.csv")}


@router.get("/public-data/gbif")
def gbif_occurrences(limit: int = 200) -> dict:
    rows = read_csv("data/processed/gbif_mosquito_occurrences_rwanda.csv")
    safe_limit = max(1, min(limit, 1000))
    return {"count": len(rows), "items": rows[:safe_limit]}


@router.get("/public-data/district-features")
def district_public_features() -> dict:
    rows = read_csv("data/processed/public_data_district_features.csv")
    return {
        "items": rows,
        "model_note": "Public covariates for climate/environment screening; not validated mosquito outcome predictions.",
    }


@router.get("/public-data/era5")
def era5_available_summary() -> dict:
    return {
        "summary": read_csv("data/processed/era5_land_available_summary.csv"),
        "validation": read_csv("data/processed/era5_land_file_validation.csv"),
        "monthly": read_csv("outputs/tables/era5_land_monthly_summary.csv"),
        "daily_preview": read_csv("data/processed/era5_land_rwanda_daily_summary.csv")[:120],
        "model_note": "ERA5-Land gridded climate summaries support climate suitability screening; not validated mosquito outcome prediction.",
    }


@router.get("/public-data/era5/daily")
def era5_daily(limit: int = 500) -> dict:
    rows = read_csv("data/processed/era5_land_rwanda_daily_summary.csv")
    safe_limit = max(1, min(limit, 5000))
    return {"count": len(rows), "items": rows[:safe_limit]}


@router.get("/public-data/era5/monthly")
def era5_monthly() -> dict:
    return {"items": read_csv("outputs/tables/era5_land_monthly_summary.csv")}


@router.get("/public-data/summary")
def public_data_summary() -> dict:
    path = ROOT / "outputs" / "reports" / "public_data_exploitation_summary.md"
    return {"markdown": path.read_text(encoding="utf-8") if path.exists() else ""}


@router.get("/public-data/download-manifest")
def open_data_download_manifest() -> dict:
    return {"items": read_csv("outputs/tables/open_data_download_manifest.csv")}


@router.get("/public-data/planned-sources")
def open_data_planned_sources() -> dict:
    return {"items": read_csv("outputs/tables/open_data_planned_sources.csv")}
