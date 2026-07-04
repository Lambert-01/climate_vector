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
    monthly_cds = read_csv("data/processed/era5_land_rwanda_monthly_2020_2026.csv")
    return {
        "summary": read_csv("data/processed/era5_land_available_summary.csv"),
        "validation": read_csv("data/processed/era5_land_file_validation.csv"),
        "monthly": monthly_cds or read_csv("outputs/tables/era5_land_monthly_summary.csv"),
        "daily_preview": read_csv("data/processed/era5_land_rwanda_daily_summary.csv")[:120],
        "model_note": "ERA5-Land gridded climate summaries support climate suitability screening; monthly data is preferred for fast climate-context integration and is not validated mosquito outcome prediction.",
    }


@router.get("/public-data/era5/daily")
def era5_daily(limit: int = 500) -> dict:
    rows = read_csv("data/processed/era5_land_rwanda_daily_summary.csv")
    safe_limit = max(1, min(limit, 5000))
    return {"count": len(rows), "items": rows[:safe_limit]}


@router.get("/public-data/era5/monthly")
def era5_monthly() -> dict:
    rows = read_csv("data/processed/era5_land_rwanda_monthly_2020_2026.csv")
    return {
        "items": rows or read_csv("outputs/tables/era5_land_monthly_summary.csv"),
        "source": "ERA5-Land monthly means from Copernicus CDS",
        "coverage": "Rwanda bounding-box mean",
    }


@router.get("/public-data/validation")
def public_data_validation() -> dict:
    rows = read_csv("data/processed/data_source_validation_summary.csv")
    ready = [
        row
        for row in rows
        if str(row.get("status", "")).startswith(("usable", "validated", "downloaded"))
        or "validated" in str(row.get("status", ""))
    ]
    return {
        "items": rows,
        "summary": {
            "sources": len(rows),
            "ready_or_usable": len(ready),
            "needs_extraction": len([row for row in rows if "extraction" in str(row.get("status", ""))]),
            "primary_pi_sources": len([row for row in rows if str(row.get("source_id", "")).startswith("pi_")]),
        },
        "model_note": "This registry validates local availability and modelling role. It does not convert contextual public layers into validated mosquito outcomes.",
    }


@router.get("/public-data/formulation-sources")
def public_data_formulation_sources() -> dict:
    return {
        "items": read_csv("data/processed/formulation_data_sources.csv"),
        "governance": "Formula outputs are operational screening proxies until field/lab validation confirms GPS, dates, effort, denominators, protocols, and controls.",
    }


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
