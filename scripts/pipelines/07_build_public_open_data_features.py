from __future__ import annotations

import csv
import json
import zipfile
from collections import Counter, defaultdict
from datetime import date, timedelta
from pathlib import Path
from statistics import mean


ROOT = Path(__file__).resolve().parents[2]
EXTERNAL = ROOT / "data" / "external"
PROCESSED = ROOT / "data" / "processed"
TABLES = ROOT / "outputs" / "tables"
REPORTS = ROOT / "outputs" / "reports"


PUBLIC_SOURCES = [
    {
        "source_id": "nasa_power",
        "source_name": "NASA POWER Daily Climate",
        "local_path": "data/external/nasa_power",
        "use_now": "yes",
        "model_use": "daily district climate signal: rainfall, temperature, humidity",
        "limitation": "district-centroid weather proxy until official site GPS and visit dates are confirmed",
    },
    {
        "source_id": "gbif",
        "source_name": "GBIF / VectorBase mosquito occurrences",
        "local_path": "data/external/gbif",
        "use_now": "yes",
        "model_use": "independent historical mosquito occurrence evidence and species context",
        "limitation": "presence-only, heterogeneous methods, not a replacement for PI surveillance data",
    },
    {
        "source_id": "boundaries",
        "source_name": "Rwanda administrative boundaries",
        "local_path": "data/external/boundaries",
        "use_now": "yes",
        "model_use": "national, province, and district mapping layers",
        "limitation": "needs authoritative version control for official reporting",
    },
    {
        "source_id": "era5_land",
        "source_name": "ERA5-Land reanalysis",
        "local_path": "data/external/era5_land",
        "use_now": "partial",
        "model_use": "national gridded climate validation and alternative climate baseline",
        "limitation": "only a January 2021 test summary is currently processed",
    },
    {
        "source_id": "chirps",
        "source_name": "CHIRPS rainfall",
        "local_path": "data/external/climate/chirps_daily",
        "use_now": "partial",
        "model_use": "high-resolution rainfall history, anomalies, seasonality, and wetness context",
        "limitation": "sample daily GeoTIFFs downloaded; full study period and Rwanda clipping/extraction still needed",
    },
    {
        "source_id": "worldclim",
        "source_name": "WorldClim baseline climatology",
        "local_path": "data/external/worldclim",
        "use_now": "ready_for_geospatial_extraction",
        "model_use": "long-term temperature and precipitation covariates at site or district scale",
        "limitation": "requires raster extraction dependencies for site/district statistics",
    },
    {
        "source_id": "worldclim_cmip6",
        "source_name": "WorldClim CMIP6 future climate projections",
        "local_path": "data/external/worldclim_cmip6",
        "use_now": "not_downloaded_yet",
        "model_use": "SSP126, SSP245, SSP370, and SSP585 scenario projections for future suitability",
        "limitation": "choose GCMs, time periods, variables, and download manageable Rwanda subsets",
    },
    {
        "source_id": "elevation",
        "source_name": "WorldClim elevation",
        "local_path": "data/external/elevation",
        "use_now": "ready_for_geospatial_extraction",
        "model_use": "altitude covariate for mosquito ecology and temperature gradients",
        "limitation": "requires raster extraction at official site coordinates",
    },
    {
        "source_id": "landcover",
        "source_name": "ESA WorldCover land cover",
        "local_path": "data/external/landcover",
        "use_now": "ready_for_geospatial_extraction",
        "model_use": "cropland, built-up, water, wetland, and vegetation context",
        "limitation": "requires raster extraction and harmonized site buffers",
    },
    {
        "source_id": "population",
        "source_name": "WorldPop population raster",
        "local_path": "data/external/population",
        "use_now": "ready_for_geospatial_extraction",
        "model_use": "population-at-risk denominator and prioritization context",
        "limitation": "requires raster zonal statistics and health catchment definitions",
    },
    {
        "source_id": "osm",
        "source_name": "OpenStreetMap Rwanda extracts",
        "local_path": "data/external/osm",
        "use_now": "ready_for_geospatial_extraction",
        "model_use": "roads, water bodies, settlements, agriculture and accessibility context",
        "limitation": "requires feature extraction and QA of volunteered geographic information",
    },
    {
        "source_id": "who_hdx_rwanda",
        "source_name": "WHO / HDX Rwanda health indicators",
        "local_path": "data/external/resistance_context/who_hdx",
        "use_now": "yes_context_only",
        "model_use": "national health, malaria, environment, WASH, and health-system context indicators",
        "limitation": "background context only; does not replace project-specific malaria cases, resistance assays, or intervention data",
    },
]


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def nasa_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8-sig").splitlines()
    for idx, line in enumerate(lines):
        if line.strip() == "-END HEADER-":
            return list(csv.DictReader(lines[idx + 1 :]))
    return list(csv.DictReader(lines))


def nasa_date(row: dict[str, str]) -> str:
    try:
        year = int(float(row.get("YEAR", "")))
        doy = int(float(row.get("DOY", "")))
    except ValueError:
        return ""
    return str(date(year, 1, 1) + timedelta(days=doy - 1))


def as_float(value: object) -> float | None:
    try:
        number = float(str(value).strip())
    except (TypeError, ValueError):
        return None
    if number <= -900:
        return None
    return number


def build_source_inventory() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for source in PUBLIC_SOURCES:
        path = ROOT / str(source["local_path"])
        files = [item for item in path.rglob("*") if item.is_file()] if path.exists() else []
        rows.append(
            {
                **source,
                "file_count": len(files),
                "total_size_mb": round(sum(item.stat().st_size for item in files) / 1_048_576, 2),
            }
        )
    return rows


def build_worldclim_manifest() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for archive in sorted((EXTERNAL / "worldclim").glob("*.zip")):
        try:
            with zipfile.ZipFile(archive) as zf:
                tif_members = [name for name in zf.namelist() if name.lower().endswith(".tif")]
                rows.append(
                    {
                        "archive": archive.name,
                        "tif_count": len(tif_members),
                        "first_member": tif_members[0] if tif_members else "",
                        "last_member": tif_members[-1] if tif_members else "",
                        "size_mb": round(archive.stat().st_size / 1_048_576, 2),
                    }
                )
        except zipfile.BadZipFile:
            rows.append(
                {
                    "archive": archive.name,
                    "tif_count": 0,
                    "first_member": "",
                    "last_member": "",
                    "size_mb": round(archive.stat().st_size / 1_048_576, 2),
                }
            )
    return rows


def build_gbif_occurrences() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for path in sorted((EXTERNAL / "gbif").glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        genus_from_file = path.stem.replace("gbif_rwanda_", "").replace("_occurrences", "")
        for item in payload.get("results", []):
            gadm = item.get("gadm") or {}
            level2 = gadm.get("level2") or {}
            rows.append(
                {
                    "source_file": path.name,
                    "gbif_id": item.get("gbifID") or item.get("key") or "",
                    "genus_query": genus_from_file.title(),
                    "scientific_name": item.get("acceptedScientificName") or item.get("scientificName") or "",
                    "species": item.get("species") or "",
                    "event_date": item.get("eventDate") or "",
                    "year": item.get("year") or "",
                    "month": item.get("month") or "",
                    "day": item.get("day") or "",
                    "district": level2.get("name") or item.get("locality") or "",
                    "state_province": item.get("stateProvince") or "",
                    "latitude": item.get("decimalLatitude") or "",
                    "longitude": item.get("decimalLongitude") or "",
                    "individual_count": item.get("individualCount") or "",
                    "basis_of_record": item.get("basisOfRecord") or "",
                    "sampling_protocol": item.get("samplingProtocol") or "",
                    "license": item.get("license") or "",
                    "references": item.get("references") or "",
                    "limitations": "presence-only public occurrence; use as supporting evidence, not PI field outcome",
                }
            )
    return rows


def build_nasa_district_features(gbif_rows: list[dict[str, object]]) -> list[dict[str, object]]:
    centroids = {
        row["district"].strip().lower(): row
        for row in read_csv(EXTERNAL / "nasa_power" / "rwanda_district_centroids_simple.csv")
        if row.get("district")
    }
    gbif_counts = Counter(str(row.get("district", "")).strip().lower() for row in gbif_rows if row.get("district"))
    features: list[dict[str, object]] = []
    for path in sorted((EXTERNAL / "nasa_power").glob("*_nasa_power_*.csv")):
        district_key = path.name.split("_nasa_power")[0]
        rows = nasa_rows(path)
        rainfall = [as_float(row.get("PRECTOTCORR")) for row in rows]
        tmean = [as_float(row.get("T2M")) for row in rows]
        tmin = [as_float(row.get("T2M_MIN")) for row in rows]
        tmax = [as_float(row.get("T2M_MAX")) for row in rows]
        humidity = [as_float(row.get("RH2M")) for row in rows]
        rainfall = [value for value in rainfall if value is not None]
        tmean = [value for value in tmean if value is not None]
        tmin = [value for value in tmin if value is not None]
        tmax = [value for value in tmax if value is not None]
        humidity = [value for value in humidity if value is not None]

        dates = [nasa_date(row) for row in rows]
        valid_dates = [value for value in dates if value]
        centroid = centroids.get(district_key, {})
        wet_days = sum(1 for value in rainfall if value >= 1)
        heavy_rain_days = sum(1 for value in rainfall if value >= 20)
        features.append(
            {
                "district": district_key.title(),
                "latitude": centroid.get("latitude", ""),
                "longitude": centroid.get("longitude", ""),
                "climate_records": len(rows),
                "date_start": min(valid_dates) if valid_dates else "",
                "date_end": max(valid_dates) if valid_dates else "",
                "rainfall_total_mm": round(sum(rainfall), 2),
                "rainfall_mean_daily_mm": round(mean(rainfall), 3) if rainfall else "",
                "rainy_day_count_ge_1mm": wet_days,
                "heavy_rain_day_count_ge_20mm": heavy_rain_days,
                "tmean_c_mean": round(mean(tmean), 3) if tmean else "",
                "tmin_c_mean": round(mean(tmin), 3) if tmin else "",
                "tmax_c_mean": round(mean(tmax), 3) if tmax else "",
                "relative_humidity_mean": round(mean(humidity), 3) if humidity else "",
                "gbif_occurrence_count": gbif_counts.get(district_key, 0),
                "data_use": "district-level public covariate; validate with official site GPS before fitting field models",
            }
        )
    return features


def build_era5_summary() -> list[dict[str, object]]:
    rows = read_csv(EXTERNAL / "era5_land" / "processed" / "era5_land_rwanda_2021_01_daily_summary.csv")
    if not rows:
        return []
    rainfall = [as_float(row.get("rainfall_total_mm")) for row in rows]
    temp = [as_float(row.get("temperature_mean_c")) for row in rows]
    rainfall = [value for value in rainfall if value is not None]
    temp = [value for value in temp if value is not None]
    return [
        {
            "dataset": "era5_land_rwanda_2021_01_daily_summary",
            "records": len(rows),
            "date_start": rows[0].get("date", ""),
            "date_end": rows[-1].get("date", ""),
            "rainfall_total_mm": round(sum(rainfall), 2),
            "rainfall_mean_daily_mm": round(mean(rainfall), 3) if rainfall else "",
            "temperature_mean_c": round(mean(temp), 3) if temp else "",
            "data_use": "national gridded climate test layer; expand before use as operational baseline",
        }
    ]


def write_report(
    inventory: list[dict[str, object]],
    gbif_rows: list[dict[str, object]],
    district_features: list[dict[str, object]],
    worldclim_manifest: list[dict[str, object]],
    era5_summary: list[dict[str, object]],
) -> None:
    source_by_id = {str(row["source_id"]): row for row in inventory}
    gbif_by_genus = Counter(str(row.get("genus_query", "")) for row in gbif_rows)
    high_rain = sorted(
        district_features,
        key=lambda row: float(row.get("rainfall_mean_daily_mm") or 0),
        reverse=True,
    )[:5]
    next_downloads = [row for row in inventory if str(row.get("use_now")) == "not_downloaded_yet"]

    lines = [
        "# Public/Open Data Exploitation Summary",
        "",
        "This report summarizes the public datasets currently available locally and what the project can use immediately.",
        "",
        "## What Is Now Usable",
        "",
        f"- NASA POWER district climate files: {source_by_id.get('nasa_power', {}).get('file_count', 0)} files.",
        f"- GBIF mosquito occurrence rows extracted: {len(gbif_rows):,}.",
        f"- District-level public climate feature rows created: {len(district_features):,}.",
        f"- WorldClim archives catalogued: {len(worldclim_manifest):,}.",
        f"- ERA5-Land processed summaries available: {len(era5_summary):,}.",
        f"- Open-data download manifest: `outputs/tables/open_data_download_manifest.csv` if generated.",
        "",
        "## Extracted Tables",
        "",
        "- `outputs/tables/public_data_sources_inventory.csv`",
        "- `outputs/tables/worldclim_archives_manifest.csv`",
        "- `data/processed/gbif_mosquito_occurrences_rwanda.csv`",
        "- `data/processed/public_data_district_features.csv`",
        "- `data/processed/era5_land_available_summary.csv`",
        "",
        "## GBIF Occurrence Counts",
        "",
    ]
    if gbif_by_genus:
        lines.extend([f"- {name}: {count:,}" for name, count in sorted(gbif_by_genus.items())])
    else:
        lines.append("- No GBIF occurrence records found locally.")

    lines.extend(["", "## Highest Mean Daily Rainfall District Proxies", ""])
    lines.extend(
        [
            f"- {row['district']}: {row['rainfall_mean_daily_mm']} mm/day, "
            f"{row['tmean_c_mean']} C mean temperature, {row['gbif_occurrence_count']} GBIF records"
            for row in high_rain
        ]
    )

    lines.extend(
        [
            "",
            "## Next Public Downloads Needed",
            "",
        ]
    )
    if next_downloads:
        lines.extend(
            [
                f"- {row['source_name']}: {row['model_use']}."
                for row in next_downloads
            ]
        )
    else:
        lines.append("- No missing public downloads are currently catalogued.")

    lines.extend(
        [
            "",
            "## Scientific Interpretation",
            "",
            "The public data strengthens climate/environment context, mapping, and district screening. It does not solve the missing PI outcome variables: full visit dates, official GPS, mosquito counts, effort, positive/negative habitat status, resistance denominators, valid protocols, control mortality, and health/action outcomes.",
            "",
            "## Recommended Next Geospatial Step",
            "",
            "Install/use the geospatial stack (`geopandas`, `rasterio`, `xarray`) and extract WorldClim, elevation, land-cover, OSM, and population values at official sentinel-site coordinates or district polygons.",
        ]
    )

    REPORTS.mkdir(parents=True, exist_ok=True)
    (REPORTS / "public_data_exploitation_summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    inventory = build_source_inventory()
    worldclim_manifest = build_worldclim_manifest()
    gbif_rows = build_gbif_occurrences()
    district_features = build_nasa_district_features(gbif_rows)
    era5_summary = build_era5_summary()

    write_csv(
        TABLES / "public_data_sources_inventory.csv",
        inventory,
        [
            "source_id",
            "source_name",
            "local_path",
            "use_now",
            "model_use",
            "limitation",
            "file_count",
            "total_size_mb",
        ],
    )
    write_csv(
        TABLES / "worldclim_archives_manifest.csv",
        worldclim_manifest,
        ["archive", "tif_count", "first_member", "last_member", "size_mb"],
    )
    write_csv(
        PROCESSED / "gbif_mosquito_occurrences_rwanda.csv",
        gbif_rows,
        [
            "source_file",
            "gbif_id",
            "genus_query",
            "scientific_name",
            "species",
            "event_date",
            "year",
            "month",
            "day",
            "district",
            "state_province",
            "latitude",
            "longitude",
            "individual_count",
            "basis_of_record",
            "sampling_protocol",
            "license",
            "references",
            "limitations",
        ],
    )
    write_csv(
        PROCESSED / "public_data_district_features.csv",
        district_features,
        [
            "district",
            "latitude",
            "longitude",
            "climate_records",
            "date_start",
            "date_end",
            "rainfall_total_mm",
            "rainfall_mean_daily_mm",
            "rainy_day_count_ge_1mm",
            "heavy_rain_day_count_ge_20mm",
            "tmean_c_mean",
            "tmin_c_mean",
            "tmax_c_mean",
            "relative_humidity_mean",
            "gbif_occurrence_count",
            "data_use",
        ],
    )
    write_csv(
        PROCESSED / "era5_land_available_summary.csv",
        era5_summary,
        [
            "dataset",
            "records",
            "date_start",
            "date_end",
            "rainfall_total_mm",
            "rainfall_mean_daily_mm",
            "temperature_mean_c",
            "data_use",
        ],
    )
    write_report(inventory, gbif_rows, district_features, worldclim_manifest, era5_summary)
    print(REPORTS / "public_data_exploitation_summary.md")


if __name__ == "__main__":
    main()
