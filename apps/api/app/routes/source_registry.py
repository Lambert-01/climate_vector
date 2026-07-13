from __future__ import annotations

import os
import csv as csv_mod
from pathlib import Path

from fastapi import APIRouter

from app.services.csv_store import read_csv

ROOT = Path(__file__).resolve().parents[4]

router = APIRouter(tags=["source-registry"])

EXPECTED_COLUMNS = {
    "ecology_processed": {"district_raw", "site_raw", "anopheles_species_raw", "breeding_site_type_raw"},
    "resistance_processed": {"district", "insecticide_tested", "concentration_label", "number_dead_24h"},
    "sentinel_context": {"site_id", "sentinel_name", "latitude", "longitude"},
    "climate_features": {"district", "rainfall_mean_daily_mm", "tmean_c_mean"},
    "gbif_occurrences": {"species", "decimalLatitude", "decimalLongitude"},
    "era5_monthly": {"year", "month"},
    "great_lakes_climate": {"location", "rainfall_latest_30d_mm"},
    "great_lakes_vectors": {"species", "records"},
}


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
        issues: list[dict] = []
        columns: list[str] = []
        if exists and path.suffix == ".csv":
            try:
                rows = _read_rows(path)
                columns = list(rows[0].keys()) if rows else []
                record_count = len(rows)
                issues.extend(_required_column_issues(check_id, columns))
                issues.extend(_content_quality_issues(check_id, rows))
            except Exception as exc:
                record_count = -1
                issues.append({
                    "severity": "high",
                    "issue": "read_error",
                    "detail": exc.__class__.__name__,
                    "recommendation": "Inspect file encoding and CSV structure.",
                })
        elif exists:
            record_count = 1
        elif not exists:
            issues.append({
                "severity": "high",
                "issue": "missing_file",
                "detail": rel_path,
                "recommendation": "Regenerate/download this source before relying on this module.",
            })
        if exists and record_count == 0:
            issues.append({
                "severity": "high",
                "issue": "empty_table",
                "detail": "File exists but has no data rows.",
                "recommendation": "Regenerate the processed table and inspect upstream source data.",
            })
        status = "pass" if exists and record_count > 0 and not _has_high_issue(issues) else "warn" if exists and record_count != -1 else "missing" if not exists else "error"
        results.append({
            "check_id": check_id,
            "description": description,
            "file": rel_path,
            "exists": exists,
            "record_count": record_count,
            "columns_checked": columns,
            "issues": issues,
            "issue_count": len(issues),
            "status": status,
        })
    passed = sum(1 for r in results if r["status"] == "pass")
    missing = sum(1 for r in results if r["status"] == "missing")
    warnings = sum(1 for r in results if r["status"] == "warn")
    errors = sum(1 for r in results if r["status"] == "error")
    return {
        "checks": results,
        "summary": {
            "total": len(results),
            "passed": passed,
            "warnings": warnings,
            "missing": missing,
            "errors": errors,
        },
        "governance": "Validation engine checks file existence, record counts, selected required columns, coordinate bounds, duplicate IDs, and selected climate plausibility ranges. It does not certify scientific accuracy or official disease validation.",
    }


def _read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as f:
        return list(csv_mod.DictReader(f))


def _required_column_issues(check_id: str, columns: list[str]) -> list[dict]:
    expected = EXPECTED_COLUMNS.get(check_id)
    if not expected:
        return []
    present = set(columns)
    missing = sorted(expected - present)
    if not missing:
        return []
    return [{
        "severity": "high",
        "issue": "missing_required_columns",
        "detail": ", ".join(missing),
        "recommendation": "Update the processing pipeline or source mapping so this table exposes required fields.",
    }]


def _content_quality_issues(check_id: str, rows: list[dict[str, str]]) -> list[dict]:
    if not rows:
        return []
    issues: list[dict] = []
    if check_id == "sentinel_context":
        issues.extend(_duplicate_issues(rows, "site_id"))
        issues.extend(_coordinate_issues(rows, "latitude", "longitude", (-4.9, 1.2), (27.0, 32.5)))
    if check_id == "gbif_occurrences":
        issues.extend(_coordinate_issues(rows, "decimalLatitude", "decimalLongitude", (-12.5, 5.5), (24.0, 36.0)))
        missing_species = sum(1 for row in rows if not str(row.get("species", "")).strip())
        if missing_species:
            issues.append({
                "severity": "medium",
                "issue": "missing_species_values",
                "detail": f"{missing_species} records have no species value.",
                "recommendation": "Keep these as context only or filter before species-level summaries.",
            })
    if check_id in {"climate_features", "great_lakes_climate"}:
        for field, low, high in [
            ("rainfall_mean_daily_mm", 0, 80),
            ("rainfall_latest_30d_mm", 0, 1000),
            ("tmean_c_mean", 5, 40),
        ]:
            bad = _range_failures(rows, field, low, high)
            if bad:
                issues.append({
                    "severity": "medium",
                    "issue": "implausible_climate_values",
                    "detail": f"{bad} rows outside plausible range for {field}.",
                    "recommendation": "Inspect units, aggregation, and source conversion.",
                })
    if check_id == "resistance_processed":
        for field in ["insecticide_tested", "number_dead_24h"]:
            missing = sum(1 for row in rows if not str(row.get(field, "")).strip())
            if missing:
                issues.append({
                    "severity": "medium",
                    "issue": "missing_resistance_fields",
                    "detail": f"{missing} rows missing {field}.",
                    "recommendation": "Review PI IR extraction and keep interpretation preliminary.",
                })
    return issues


def _duplicate_issues(rows: list[dict[str, str]], field: str) -> list[dict]:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for row in rows:
        value = str(row.get(field, "")).strip().lower()
        if not value:
            continue
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    if not duplicates:
        return []
    return [{
        "severity": "medium",
        "issue": "duplicate_identifier",
        "detail": f"{len(duplicates)} duplicate {field} values.",
        "recommendation": "Confirm registry IDs before operational use.",
    }]


def _coordinate_issues(rows: list[dict[str, str]], lat_field: str, lon_field: str, lat_bounds: tuple[float, float], lon_bounds: tuple[float, float]) -> list[dict]:
    invalid = 0
    for row in rows:
        lat = _to_float(row.get(lat_field))
        lon = _to_float(row.get(lon_field))
        if lat is None or lon is None or not (lat_bounds[0] <= lat <= lat_bounds[1]) or not (lon_bounds[0] <= lon <= lon_bounds[1]):
            invalid += 1
    if not invalid:
        return []
    return [{
        "severity": "high",
        "issue": "invalid_coordinates",
        "detail": f"{invalid} rows outside expected coordinate bounds or missing coordinates.",
        "recommendation": "Verify coordinate extraction and source CRS before mapping.",
    }]


def _range_failures(rows: list[dict[str, str]], field: str, low: float, high: float) -> int:
    failures = 0
    saw_field = False
    for row in rows:
        if field not in row:
            continue
        saw_field = True
        value = _to_float(row.get(field))
        if value is None or value < low or value > high:
            failures += 1
    return failures if saw_field else 0


def _to_float(value: str | None) -> float | None:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return None


def _has_high_issue(issues: list[dict]) -> bool:
    return any(issue.get("severity") == "high" for issue in issues)
