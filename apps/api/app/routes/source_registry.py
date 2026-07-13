from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter

from app.services.csv_store import read_csv

ROOT = Path(__file__).resolve().parents[4]

router = APIRouter(tags=["source-registry"])


_SOURCE_ENTRIES = [
    {
        "source_id": "pi_ecology",
        "name": "PI Mosquito Ecology",
        "domain": "Vector ecology",
        "raw_file": "data/raw/mosquito_behavior_raw.xls",
        "raw_export": "data/interim/raw_excel_exports/mosquito_behavior_raw_sheet1.csv",
        "processed_table": "data/processed/mosquito_ecology_preliminary.csv",
        "source_type": "pi_provided",
        "record_count_source": "len(processed CSV rows)",
        "date_range": "Partial dates only",
        "supports": "Habitat and site evidence for field-verification prioritization",
        "cannot_prove": "Species-level identification, abundance, sampling effort, temporal trends",
        "quality_limitations": "Full dates, counts, sampling effort, and official GPS are incomplete",
        "status": "usable_descriptive",
        "required_for_validation": "Full dates, GPS, counts, effort, species confirmation",
    },
    {
        "source_id": "pi_resistance",
        "name": "PI Insecticide Susceptibility",
        "domain": "Vector control context",
        "raw_file": "data/raw/IR_data.xls",
        "raw_export": "data/interim/raw_excel_exports/IR_data_sheet1.csv",
        "processed_table": "data/processed/resistance_test_replicates_preliminary.csv",
        "source_type": "pi_provided",
        "record_count_source": "len(processed CSV rows)",
        "date_range": "Partial dates only",
        "supports": "Vector-control context and susceptibility signal summary",
        "cannot_prove": "Validated resistance classification, Abbott-corrected mortality",
        "quality_limitations": "Protocol, denominator, control mortality, dates, GPS, and species need PI confirmation",
        "status": "usable_preliminary",
        "required_for_validation": "Denominator, WHO/CDC protocol, control mortality, species confirmation",
    },
    {
        "source_id": "sentinel_sites",
        "name": "Sentinel Site Registry (33 sites)",
        "domain": "Spatial operations",
        "raw_file": "Map- 33 sentinel.xls",
        "raw_export": "data/interim/raw_excel_exports/Map- 33 sentinel_untitled_map__33_sentinel.csv",
        "processed_table": "data/processed/context/sentinel_sites_33.csv",
        "source_type": "pi_provided",
        "record_count_source": "33 sites",
        "date_range": "Static registry",
        "supports": "Site maps, climate extraction, field verification planning",
        "cannot_prove": "Official GPS validation, administrative harmonization",
        "quality_limitations": "Coordinates are lecturer-provided WKT; PI confirmation recommended",
        "status": "usable_mapping",
        "required_for_validation": "Official GPS, facility names, catchment linkage",
    },
    {
        "source_id": "nasa_power_climate",
        "name": "NASA POWER Daily Climate",
        "domain": "Climate context",
        "raw_file": "N/A (API download)",
        "raw_export": "N/A",
        "processed_table": "data/external/nasa_power/*.csv (30 districts + 7 GL points)",
        "source_type": "public",
        "record_count_source": "~1,825 rows per district × 37 locations",
        "date_range": "2021-01-01 to 2025-12-31",
        "supports": "Rainfall, temperature, humidity context for suitability screening",
        "cannot_prove": "Microclimate, extreme event validation, local weather station agreement",
        "quality_limitations": "0.1° resolution, bias-corrected reanalysis, not station-level observation",
        "status": "validated",
        "required_for_validation": "Local weather station comparison (optional)",
    },
    {
        "source_id": "era5_land",
        "name": "ERA5-Land Monthly Means",
        "domain": "Climate context",
        "raw_file": "N/A (CDS API download)",
        "raw_export": "N/A",
        "processed_table": "data/processed/era5_land_rwanda_monthly_2020_2026.csv",
        "source_type": "public",
        "record_count_source": "Monthly summaries",
        "date_range": "2020-01 to 2025-12",
        "supports": "Baseline rainfall, temperature, dewpoint, runoff context",
        "cannot_prove": "Daily extreme events, local microclimate",
        "quality_limitations": "9km resolution, monthly aggregation",
        "status": "validated",
        "required_for_validation": "None for context use",
    },
    {
        "source_id": "gbif_vectors",
        "name": "GBIF Vector Occurrence",
        "domain": "Vector occurrence context",
        "raw_file": "N/A (GBIF API download)",
        "raw_export": "N/A",
        "processed_table": "data/processed/gbif_mosquito_occurrences_rwanda.csv",
        "source_type": "public",
        "record_count_source": "329 Aedes + 51 Culex + 6000+ Anopheles",
        "date_range": "Historical (varies by record)",
        "supports": "Regional vector species context and co-occurrence framing",
        "cannot_prove": "Local abundance, current presence, transmission activity",
        "quality_limitations": "Presence-only, taxonomic uncertainty, spatial bias",
        "status": "usable_context",
        "required_for_validation": "Local trap surveillance",
    },
    {
        "source_id": "open_meteo",
        "name": "Open-Meteo Live Forecast",
        "domain": "Live weather context",
        "raw_file": "N/A (API call at runtime)",
        "raw_export": "N/A",
        "processed_table": "N/A (computed at request time)",
        "source_type": "public_api",
        "record_count_source": "Per-location forecast",
        "date_range": "Current + 7-16 day forecast",
        "supports": "Real-time climate suitability screening and field window identification",
        "cannot_prove": "Historical trends, confirmed disease association",
        "quality_limitations": "Forecast uncertainty increases beyond 3 days; offline fallback available",
        "status": "validated",
        "required_for_validation": "None for screening use",
    },
    {
        "source_id": "worldclim",
        "name": "WorldClim Baseline Climate",
        "domain": "Climate baseline",
        "raw_file": "N/A (worldclim.org download)",
        "raw_export": "N/A",
        "processed_table": "data/external/worldclim/",
        "source_type": "public",
        "record_count_source": "Raster archives",
        "date_range": "1970-2000 baseline",
        "supports": "Long-term climate baseline and elevation context",
        "cannot_prove": "Current conditions, recent trends",
        "quality_limitations": "1km resolution, historical baseline only",
        "status": "downloaded",
        "required_for_validation": "None for context use",
    },
    {
        "source_id": "elevation",
        "name": "SRTM Elevation",
        "domain": "Environmental context",
        "raw_file": "N/A (USGS download)",
        "raw_export": "N/A",
        "processed_table": "data/external/elevation/",
        "source_type": "public",
        "record_count_source": "Raster archives",
        "date_range": "Static",
        "supports": "Terrain context for habitat suitability",
        "cannot_prove": "Micro-topography, drainage patterns",
        "quality_limitations": "30m resolution",
        "status": "downloaded",
        "required_for_validation": "None for context use",
    },
    {
        "source_id": "landcover",
        "name": "ESA WorldCover",
        "domain": "Land cover context",
        "raw_file": "N/A (ESA download)",
        "raw_export": "N/A",
        "processed_table": "data/external/landcover/",
        "source_type": "public",
        "record_count_source": "Raster archives",
        "date_range": "2021",
        "supports": "Urban, agricultural, wetland context for vector habitat",
        "cannot_prove": "Micro-habitat, water storage, container breeding",
        "quality_limitations": "10m resolution, single epoch",
        "status": "downloaded",
        "required_for_validation": "None for context use",
    },
    {
        "source_id": "boundaries",
        "name": "Rwanda Administrative Boundaries",
        "domain": "Spatial reference",
        "raw_file": "N/A (GADM/admin source)",
        "raw_export": "N/A",
        "processed_table": "data/external/boundaries/",
        "source_type": "public",
        "record_count_source": "GeoJSON/Shapefile",
        "date_range": "Static",
        "supports": "District/province map boundaries",
        "cannot_prove": "Health facility catchments",
        "quality_limitations": "Administrative boundaries may not match health districts",
        "status": "validated",
        "required_for_validation": "None",
    },
    {
        "source_id": "arboviral_outcomes",
        "name": "Official Arboviral Case Data",
        "domain": "Disease surveillance",
        "raw_file": "Not available",
        "raw_export": "Not available",
        "processed_table": "Not available",
        "source_type": "formal_access_required",
        "record_count_source": "0",
        "date_range": "N/A",
        "supports": "Validation, threshold calibration, prediction confirmation",
        "cannot_prove": "N/A",
        "quality_limitations": "Requires RBC/MoH data-sharing agreement",
        "status": "formal_access_required",
        "required_for_validation": "RBC/MoH data governance approval",
    },
    {
        "source_id": "aedes_culex_surveillance",
        "name": "Local Aedes/Culex Field Surveillance",
        "domain": "Vector surveillance",
        "raw_file": "Not yet collected",
        "raw_export": "Not yet collected",
        "processed_table": "Not yet collected",
        "source_type": "pilot_required",
        "record_count_source": "0",
        "date_range": "N/A",
        "supports": "Vector presence/absence, abundance, species confirmation",
        "cannot_prove": "N/A",
        "quality_limitations": "Requires pilot deployment of traps and surveys",
        "status": "pilot_required",
        "required_for_validation": "Prospective field collection during funded pilot",
    },
]


@router.get("/source-registry")
def source_registry() -> dict:
    validation = read_csv("data/processed/data_source_validation_summary.csv")
    validation_map = {
        str(row.get("source_id", "")).lower(): row
        for row in validation
        if row.get("source_id")
    }
    enriched = []
    for entry in _SOURCE_ENTRIES:
        external = validation_map.get(entry["source_id"], {})
        enriched.append({
            **entry,
            "records_or_files": external.get("records_or_files", entry["record_count_source"]),
            "last_validated": external.get("last_validated", ""),
        })
    status_counts = {}
    for e in enriched:
        s = e["status"]
        status_counts[s] = status_counts.get(s, 0) + 1
    return {
        "items": enriched,
        "summary": {
            "total_sources": len(enriched),
            "status_counts": status_counts,
        },
        "governance": "Source registry tracks data provenance, limitations, and validation requirements. It distinguishes between PI-provided, public, and formally-required sources.",
    }


@router.get("/source-registry/{source_id}")
def source_registry_detail(source_id: str) -> dict:
    entry = next((e for e in _SOURCE_ENTRIES if e["source_id"] == source_id), None)
    if not entry:
        return {"error": f"Source '{source_id}' not found.", "available": [e["source_id"] for e in _SOURCE_ENTRIES]}
    return entry


@router.get("/validation-engine")
def validation_engine() -> dict:
    results = []
    checks = [
        ("pi_ecology_raw", "data/raw/mosquito_behavior_raw.xls", "PI mosquito ecology raw file"),
        ("pi_resistance_raw", "data/raw/IR_data.xls", "PI resistance raw file"),
        ("sentinel_raw", "Map- 33 sentinel.xls", "Sentinel sites raw file"),
        ("ecology_processed", "data/processed/mosquito_ecology_preliminary.csv", "Processed ecology table"),
        ("resistance_processed", "data/processed/resistance_test_replicates_preliminary.csv", "Processed resistance table"),
        ("sentinel_context", "data/processed/context/sentinel_sites_33.csv", "Sentinel site context"),
        ("climate_features", "data/processed/public_data_district_features.csv", "District climate features"),
        ("gbif_occurrences", "data/processed/gbif_mosquito_occurrences_rwanda.csv", "GBIF vector occurrences"),
        ("era5_monthly", "data/processed/era5_land_rwanda_monthly_2020_2026.csv", "ERA5 monthly summary"),
        ("validation_summary", "data/processed/data_source_validation_summary.csv", "Validation summary"),
        ("readiness_summary", "data/processed/data_readiness_summary.csv", "Readiness summary"),
        ("arboviral_profiles", "data/processed/context/arboviral_disease_profiles.csv", "Arboviral disease profiles"),
        ("arboviral_readiness", "data/processed/context/arboviral_readiness_layers.csv", "Readiness layers"),
        ("great_lakes_climate", "data/processed/context/great_lakes_climate_summary.csv", "Great Lakes climate"),
        ("great_lakes_vectors", "data/processed/context/great_lakes_vector_occurrence_summary.csv", "Great Lakes vectors"),
        ("nasa_power_gasabo", "data/external/nasa_power/gasabo_nasa_power_2021_2025.csv", "NASA POWER Gasabo"),
    ]
    for check_id, rel_path, description in checks:
        path = ROOT / rel_path
        exists = path.exists()
        record_count = 0
        if exists and path.suffix == ".csv":
            try:
                import csv as csv_mod
                with path.open(newline="", encoding="utf-8-sig") as f:
                    reader = csv_mod.DictReader(f)
                    record_count = sum(1 for _ in reader)
            except Exception:
                record_count = -1
        elif exists:
            record_count = 1
        results.append({
            "check_id": check_id,
            "description": description,
            "file": rel_path,
            "exists": exists,
            "record_count": record_count,
            "status": "pass" if exists and record_count != -1 else "missing" if not exists else "error",
        })
    passed = sum(1 for r in results if r["status"] == "pass")
    missing = sum(1 for r in results if r["status"] == "missing")
    return {
        "checks": results,
        "summary": {
            "total": len(results),
            "passed": passed,
            "missing": missing,
            "errors": len(results) - passed - missing,
        },
        "governance": "Validation engine checks file existence and record counts. It does not validate content quality, scientific accuracy, or completeness.",
    }
