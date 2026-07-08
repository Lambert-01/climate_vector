from __future__ import annotations

import csv
import json
import zipfile
from collections.abc import Iterable
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "data" / "processed"
OUTPUT_TABLES = ROOT / "outputs" / "tables"

VALIDATION_CSV = PROCESSED / "data_source_validation_summary.csv"
FORMULA_CSV = PROCESSED / "formulation_data_sources.csv"


def read_csv_rows(path: Path, limit: int | None = None) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        rows = []
        for row in csv.DictReader(handle):
            rows.append(row)
            if limit and len(rows) >= limit:
                break
        return rows


def count_csv_rows(path: Path) -> int:
    if not path.exists():
        return 0
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.reader(handle)
        next(reader, None)
        return sum(1 for _ in reader)


def date_range(rows: Iterable[dict[str, str]], keys: tuple[str, ...] = ("date", "DATE", "time", "month")) -> tuple[str, str]:
    values: list[str] = []
    for row in rows:
        for key in keys:
            value = str(row.get(key, "")).strip()
            if value:
                values.append(value[:10])
                break
    if not values:
        return "", ""
    return min(values), max(values)


def file_count(pattern: str) -> int:
    return len(list(ROOT.glob(pattern)))


def newest_mtime(pattern: str) -> str:
    files = list(ROOT.glob(pattern))
    if not files:
        return ""
    newest = max(path.stat().st_mtime for path in files)
    return datetime.fromtimestamp(newest).strftime("%Y-%m-%d %H:%M")


def zip_members(pattern: str) -> int:
    total = 0
    for path in ROOT.glob(pattern):
        try:
            with zipfile.ZipFile(path) as archive:
                total += len(archive.namelist())
        except zipfile.BadZipFile:
            continue
    return total


def json_records(pattern: str) -> int:
    total = 0
    for path in ROOT.glob(pattern):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(payload, dict):
            if isinstance(payload.get("results"), list):
                total += len(payload["results"])
            elif isinstance(payload.get("features"), list):
                total += len(payload["features"])
            else:
                total += 1
        elif isinstance(payload, list):
            total += len(payload)
    return total


def build_validation_rows() -> list[dict[str, str]]:
    era5_monthly = PROCESSED / "era5_land_rwanda_monthly_2020_2026.csv"
    era5_rows = read_csv_rows(era5_monthly)
    era5_start, era5_end = date_range(era5_rows, ("month", "date"))

    era5_daily = PROCESSED / "era5_land_rwanda_daily_summary.csv"
    era5_daily_rows = read_csv_rows(era5_daily)
    era5_daily_start, era5_daily_end = date_range(era5_daily_rows)

    gbif_path = PROCESSED / "gbif_mosquito_occurrences_rwanda.csv"
    gbif_rows = read_csv_rows(gbif_path)

    district_features = PROCESSED / "public_data_district_features.csv"
    features_rows = read_csv_rows(district_features)

    pi_ecology = PROCESSED / "mosquito_ecology_preliminary.csv"
    pi_resistance = PROCESSED / "resistance_test_replicates_preliminary.csv"

    return [
        {
            "source_id": "pi_mosquito_behavior",
            "source_name": "PI mosquito behaviour ecology dataset",
            "category": "primary field ecology",
            "local_path": "data/raw/mosquito_behavior_raw.xls",
            "status": "usable_descriptive",
            "records_or_files": str(count_csv_rows(pi_ecology)),
            "date_start": "",
            "date_end": "",
            "variables": "district, site, species text, breeding-site type, agriculture exposure context",
            "model_use": "habitat and exposure evidence; district/site prioritization",
            "limitation": "missing full sample date, official GPS, count/effort, positive-negative habitat status",
            "formula_role": "E_habitat, E_species, E_exposure",
            "frontend_use": "Mosquito habitat page, overview evidence cards, modeling evidence component",
            "last_validated": newest_mtime("data/processed/mosquito_ecology_preliminary.csv"),
        },
        {
            "source_id": "pi_ir_data",
            "source_name": "PI insecticide resistance dataset",
            "category": "primary laboratory/susceptibility",
            "local_path": "data/raw/IR_data.xls",
            "status": "usable_preliminary",
            "records_or_files": str(count_csv_rows(pi_resistance)),
            "date_start": "",
            "date_end": "",
            "variables": "district, site, insecticide, concentration, 24h deaths, species text",
            "model_use": "insecticide susceptibility intelligence and resistance-pressure screening",
            "limitation": "denominator, protocol, control mortality, exact dates, and GPS require PI confirmation",
            "formula_role": "R_susceptibility, I_exposure",
            "frontend_use": "Resistance page, overview, alert-review workflow",
            "last_validated": newest_mtime("data/processed/resistance_test_replicates_preliminary.csv"),
        },
        {
            "source_id": "lecturer_sentinel_map_33",
            "source_name": "Lecturer 33 sentinel-site coordinate map",
            "category": "primary sentinel geospatial registry",
            "local_path": "Map- 33 sentinel.xls",
            "status": "usable_mapping",
            "records_or_files": str(count_csv_rows(PROCESSED / "context" / "sentinel_sites_33.csv")),
            "date_start": "",
            "date_end": "",
            "variables": "longitude, latitude, WKT, site label, sentinel name",
            "model_use": "Rwanda proof-of-concept sentinel mapping and site verification planning",
            "limitation": "coordinate metadata/provenance should still be confirmed with PI for official reporting",
            "formula_role": "sentinel_geography",
            "frontend_use": "Sites map and sentinel registry",
            "last_validated": newest_mtime("data/processed/context/sentinel_sites_33.csv"),
        },
        {
            "source_id": "era5_land_monthly",
            "source_name": "ERA5-Land monthly Rwanda climate",
            "category": "reanalysis climate",
            "local_path": "data/processed/era5_land_rwanda_monthly_2020_2026.csv",
            "status": "validated_local_summary" if era5_rows else "missing",
            "records_or_files": str(len(era5_rows)),
            "date_start": era5_start,
            "date_end": era5_end,
            "variables": "2m temperature, 2m dewpoint, total precipitation, runoff, surface runoff",
            "model_use": "monthly climate suitability baseline and trend context",
            "limitation": "Rwanda bounding-box aggregate; district extraction is future enhancement",
            "formula_role": "T_m, D_m, P_m, Q_m",
            "frontend_use": "Climate evidence, modeling formula inputs, public validation table",
            "last_validated": newest_mtime("data/processed/era5_land_rwanda_monthly_2020_2026.csv"),
        },
        {
            "source_id": "era5_land_daily_samples",
            "source_name": "ERA5-Land hourly-to-daily sample files",
            "category": "reanalysis climate validation",
            "local_path": "data/processed/era5_land_rwanda_daily_summary.csv",
            "status": "partial_validated_samples" if era5_daily_rows else "not_required_for_fast_build",
            "records_or_files": str(len(era5_daily_rows)),
            "date_start": era5_daily_start,
            "date_end": era5_daily_end,
            "variables": "daily mean temperature, dewpoint, precipitation, runoff",
            "model_use": "checks monthly extraction and supports method demonstration",
            "limitation": "not a full daily 2020-2026 archive; monthly dataset is the operational baseline",
            "formula_role": "T_d, P_d, Q_d validation sample",
            "frontend_use": "ERA5 validation details",
            "last_validated": newest_mtime("data/processed/era5_land_rwanda_daily_summary.csv"),
        },
        {
            "source_id": "nasa_power_daily",
            "source_name": "NASA POWER district daily climate",
            "category": "public daily climate",
            "local_path": "data/external/nasa_power/*.csv",
            "status": "usable_district_features",
            "records_or_files": str(file_count("data/external/nasa_power/*_nasa_power_*.csv")),
            "date_start": "2021-01-01",
            "date_end": "2025-12-31",
            "variables": "daily rainfall, temperature min/mean/max, humidity",
            "model_use": "district suitability scoring and recent rainfall-temperature screening",
            "limitation": "district centroid proxy; not site microclimate",
            "formula_role": "R_7, R_30, T_mean, RH",
            "frontend_use": "Overview climate charts, district risk table, climate page",
            "last_validated": newest_mtime("data/external/nasa_power/*_nasa_power_*.csv"),
        },
        {
            "source_id": "nasa_power_great_lakes_daily",
            "source_name": "NASA POWER Great Lakes daily climate points",
            "category": "regional public daily climate",
            "local_path": "data/external/climate/nasa_power/*_daily_climate_2021_2025.csv",
            "status": "usable_regional_context",
            "records_or_files": str(file_count("data/external/climate/nasa_power/*_daily_climate_2021_2025.csv")),
            "date_start": "2021-01-01",
            "date_end": "2025-12-31",
            "variables": "daily rainfall, temperature min/mean/max, humidity for Kigali, Goma, Bukavu, Kampala, Bujumbura, Mwanza, Kisumu",
            "model_use": "Great Lakes arboviral climate preparedness context",
            "limitation": "regional dashboard points; not lecturer sentinel-site GPS",
            "formula_role": "regional_climate_context",
            "frontend_use": "Arboviral preparedness page and regional climate evidence",
            "last_validated": newest_mtime("data/external/climate/nasa_power/*_daily_climate_2021_2025.csv"),
        },
        {
            "source_id": "district_feature_table",
            "source_name": "Integrated public district feature table",
            "category": "derived covariate table",
            "local_path": "data/processed/public_data_district_features.csv",
            "status": "usable_derived",
            "records_or_files": str(len(features_rows)),
            "date_start": "",
            "date_end": "",
            "variables": "district climate means, rainfall proxies, occurrence evidence",
            "model_use": "fast dashboard summary and district screening",
            "limitation": "derived features inherit source uncertainty",
            "formula_role": "X_district",
            "frontend_use": "Overview, maps, climate feature cards",
            "last_validated": newest_mtime("data/processed/public_data_district_features.csv"),
        },
        {
            "source_id": "chirps_daily",
            "source_name": "CHIRPS daily rainfall GeoTIFF sample",
            "category": "satellite rainfall",
            "local_path": "data/external/climate/chirps_daily/*.tif",
            "status": "partial_local_sample",
            "records_or_files": str(file_count("data/external/climate/chirps_daily/*.tif")),
            "date_start": "2024-01-01",
            "date_end": "2024-01-31",
            "variables": "high-resolution daily rainfall",
            "model_use": "rainfall validation and anomaly layer for habitat wetness",
            "limitation": "currently January 2024 sample; needs extraction to districts/sites",
            "formula_role": "P_chirps, A_rain",
            "frontend_use": "Public evidence coverage and future rainfall validation",
            "last_validated": newest_mtime("data/external/climate/chirps_daily/*.tif"),
        },
        {
            "source_id": "gbif_vector_occurrences",
            "source_name": "GBIF mosquito occurrence records",
            "category": "public vector occurrence",
            "local_path": "data/processed/gbif_mosquito_occurrences_rwanda.csv",
            "status": "usable_context",
            "records_or_files": str(len(gbif_rows) or json_records("data/external/gbif/*.json")),
            "date_start": "",
            "date_end": "",
            "variables": "species, coordinates when available, public occurrence metadata",
            "model_use": "independent historical species-occurrence context",
            "limitation": "presence-only and sampling-biased; not abundance",
            "formula_role": "O_species",
            "frontend_use": "Occurrence context, modeling evidence component",
            "last_validated": newest_mtime("data/processed/gbif_mosquito_occurrences_rwanda.csv"),
        },
        {
            "source_id": "gbif_great_lakes_vectors",
            "source_name": "GBIF Great Lakes Aedes/Culex/Anopheles occurrence context",
            "category": "regional public vector occurrence",
            "local_path": "data/external/vector_occurrence/gbif/*_great_lakes_gbif.csv",
            "status": "usable_context",
            "records_or_files": str(file_count("data/external/vector_occurrence/gbif/*_great_lakes_gbif.csv")),
            "date_start": "",
            "date_end": "",
            "variables": "Aedes aegypti, Aedes albopictus, Culex quinquefasciatus, Anopheles gambiae, Anopheles funestus occurrence records",
            "model_use": "regional vector occurrence context for dengue, chikungunya, yellow fever, RVF, and vector-infrastructure framing",
            "limitation": "presence-only and reporting-biased; not local surveillance proof",
            "formula_role": "regional_vector_context",
            "frontend_use": "Arboviral preparedness page and vector evidence table",
            "last_validated": newest_mtime("data/external/vector_occurrence/gbif/*_great_lakes_gbif.csv"),
        },
        {
            "source_id": "rwanda_boundaries",
            "source_name": "Rwanda administrative boundaries",
            "category": "geospatial boundary",
            "local_path": "data/external/boundaries/*.geojson",
            "status": "usable_mapping",
            "records_or_files": str(file_count("data/external/boundaries/*.geojson")),
            "date_start": "",
            "date_end": "",
            "variables": "national, province, and district polygons",
            "model_use": "map rendering and district aggregation",
            "limitation": "site-level GPS still needs confirmation",
            "formula_role": "G_admin",
            "frontend_use": "Maps, district table joins",
            "last_validated": newest_mtime("data/external/boundaries/*.geojson"),
        },
        {
            "source_id": "worldclim_baseline",
            "source_name": "WorldClim baseline climate archives",
            "category": "baseline climatology",
            "local_path": "data/external/worldclim/*.zip",
            "status": "downloaded_ready_for_extraction",
            "records_or_files": str(file_count("data/external/worldclim/*.zip")),
            "date_start": "1970",
            "date_end": "2000",
            "variables": "long-term temperature, precipitation, bioclim, vapor pressure",
            "model_use": "baseline suitability covariates and ecological niche context",
            "limitation": "archives need raster extraction to district/site table",
            "formula_role": "BIO_i, P_base, T_base",
            "frontend_use": "Evidence registry and model formulation",
            "last_validated": newest_mtime("data/external/worldclim/*.zip"),
        },
        {
            "source_id": "elevation_landcover_population",
            "source_name": "Elevation, land cover, population, and OSM context",
            "category": "environment and exposure covariates",
            "local_path": "data/external/{elevation,landcover,population,osm}",
            "status": "downloaded_ready_for_extraction",
            "records_or_files": str(
                file_count("data/external/elevation/*")
                + file_count("data/external/landcover/*.tif")
                + file_count("data/external/population/*.tif")
                + file_count("data/external/osm/*.zip")
            ),
            "date_start": "",
            "date_end": "",
            "variables": "altitude, land cover class, population density, roads/water/agriculture context",
            "model_use": "habitat suitability modifiers and field-access context",
            "limitation": "requires geospatial extraction before quantitative use",
            "formula_role": "Z_alt, L_landcover, N_pop, A_access",
            "frontend_use": "Public evidence coverage and future map layers",
            "last_validated": newest_mtime("data/external/landcover/*.tif"),
        },
        {
            "source_id": "who_hdx_context",
            "source_name": "WHO/HDX Rwanda health-context tables",
            "category": "public health context",
            "local_path": "data/external/resistance_context/who_hdx/*.csv",
            "status": "usable_context_only",
            "records_or_files": str(file_count("data/external/resistance_context/who_hdx/*.csv")),
            "date_start": "",
            "date_end": "",
            "variables": "health system, environment, WASH, malaria/febrile illness context indicators",
            "model_use": "proposal context and interpretation, not arboviral outcome training",
            "limitation": "mostly national/contextual indicators; does not replace RBC/MoH approved arboviral case data",
            "formula_role": "C_context",
            "frontend_use": "Data validation and proposal evidence",
            "last_validated": newest_mtime("data/external/resistance_context/who_hdx/*.csv"),
        },
        {
            "source_id": "jrc_global_surface_water",
            "source_name": "JRC Global Surface Water",
            "category": "surface water and breeding-environment context",
            "local_path": "data/external/surface_water/jrc",
            "status": "planned_requires_earth_engine",
            "records_or_files": str(file_count("data/external/surface_water/jrc/*")),
            "date_start": "1984",
            "date_end": "2021",
            "variables": "water occurrence, seasonality, recurrence, maximum extent",
            "model_use": "RVF, wetness, and mosquito breeding-environment context",
            "limitation": "requires Google Earth Engine export; MVP uses land-cover water classes and rainfall context",
            "formula_role": "surface_water_context",
            "frontend_use": "Data readiness and future RVF One Health layer",
            "last_validated": newest_mtime("data/external/surface_water/jrc/*"),
        },
        {
            "source_id": "nisr_context",
            "source_name": "NISR Rwanda official population and socioeconomic context",
            "category": "official statistics roadmap",
            "local_path": "formal_source_not_downloaded",
            "status": "planned_not_blocking",
            "records_or_files": "0",
            "date_start": "",
            "date_end": "",
            "variables": "official population, administrative, socioeconomic, and geospatial context where accessible",
            "model_use": "proposal strengthening and future official exposure denominators",
            "limitation": "not required for the 20-day MVP; integrate through official source/API when easy",
            "formula_role": "official_context",
            "frontend_use": "Data readiness roadmap",
            "last_validated": "",
        },
        {
            "source_id": "rbc_moh_arboviral_data",
            "source_name": "RBC/MoH arboviral and febrile illness data",
            "category": "formal partner surveillance data",
            "local_path": "formal_access_required",
            "status": "formal_access_required",
            "records_or_files": "0",
            "date_start": "",
            "date_end": "",
            "variables": "confirmed/suspected arboviral cases, febrile illness indicators, lab confirmation, interventions",
            "model_use": "future validation of arboviral early-action intelligence",
            "limitation": "must be accessed through formal approval and data-sharing agreements; do not build fake case data",
            "formula_role": "validated_outcome_data",
            "frontend_use": "Data readiness roadmap and governance messaging",
            "last_validated": "",
        },
    ]


def build_formula_rows() -> list[dict[str, str]]:
    return [
        {
            "module": "Climate suitability",
            "symbol": "CSI_d",
            "formula": "0.35 f_T(T_d) + 0.30 f_R(R_7,R_30) + 0.15 f_H(RH_d) + 0.10 f_Q(Q_d) + 0.10 O_species",
            "data_sources": "NASA POWER, ERA5-Land, CHIRPS, GBIF",
            "result": "District screening score from 0 to 1",
            "status": "implemented_proxy",
        },
        {
            "module": "Live field window",
            "symbol": "FWI_d",
            "formula": "0.45 LCSI_d + 0.35 clip(R_48/25,0,1) + 0.20 clip(1-W/28,0,1)",
            "data_sources": "Open-Meteo live forecast, NASA/ERA5 fallback context",
            "result": "When field verification is likely useful",
            "status": "implemented_proxy",
        },
        {
            "module": "Habitat evidence",
            "symbol": "H_d",
            "formula": "softmax count of PI breeding-site classes weighted by wetness and land-cover suitability",
            "data_sources": "PI mosquito behaviour, CHIRPS, ESA WorldCover, WorldClim",
            "result": "Habitat/exposure evidence component",
            "status": "descriptive_now",
        },
        {
            "module": "Insecticide susceptibility intelligence",
            "symbol": "IR_i",
            "formula": "1 - deaths_24h / n_tested, with n/protocol/control confirmed during pilot",
            "data_sources": "PI IR_data.xls",
            "result": "Preliminary resistance-pressure signal",
            "status": "blocked_for_final_classification",
        },
        {
            "module": "Uncertainty penalty",
            "symbol": "U_d",
            "formula": "1 - weighted_missingness(GPS,date,count,effort,denominator,protocol,control)",
            "data_sources": "PI datasets, readiness registry",
            "result": "Confidence label and pilot work queue",
            "status": "implemented_governance",
        },
        {
            "module": "Operational priority",
            "symbol": "P_d",
            "formula": "CSI_d x (0.5 + 0.3 H_d + 0.2 IR_i) x U_d",
            "data_sources": "All validated current-data layers",
            "result": "District/site follow-up priority, not malaria prediction",
            "status": "proposal_ready_proxy",
        },
    ]


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(rows[0].keys()) if rows else []
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    validation_rows = build_validation_rows()
    formula_rows = build_formula_rows()
    write_csv(VALIDATION_CSV, validation_rows)
    write_csv(FORMULA_CSV, formula_rows)
    write_csv(OUTPUT_TABLES / "data_source_validation_summary.csv", validation_rows)
    write_csv(OUTPUT_TABLES / "formulation_data_sources.csv", formula_rows)
    print(f"Wrote {VALIDATION_CSV.relative_to(ROOT)} ({len(validation_rows)} rows)")
    print(f"Wrote {FORMULA_CSV.relative_to(ROOT)} ({len(formula_rows)} rows)")


if __name__ == "__main__":
    main()
