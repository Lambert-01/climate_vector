from __future__ import annotations

import csv
import gzip
import shutil
import ssl
import urllib.error
import urllib.request
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
EXTERNAL = ROOT / "data" / "external"
REPORTS = ROOT / "outputs" / "reports"
TABLES = ROOT / "outputs" / "tables"

RWANDA_BBOX = {
    "north": -1.0,
    "south": -3.0,
    "west": 28.8,
    "east": 30.9,
}


def ensure_layout() -> None:
    for relative in [
        "climate/chirps_daily",
        "climate/era5_land",
        "hydrology/jrc_surface_water",
        "landcover",
        "elevation",
        "population",
        "boundaries",
        "mosquito_context",
        "resistance_context",
        "catalogs",
    ]:
        (EXTERNAL / relative).mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    TABLES.mkdir(parents=True, exist_ok=True)


def download_url(url: str, destination: Path, timeout: int = 90) -> tuple[bool, str]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            destination.write_bytes(response.read())
        return True, "downloaded"
    except urllib.error.URLError as exc:
        if "CERTIFICATE_VERIFY_FAILED" not in str(exc):
            return False, f"failed: {exc}"
        try:
            context = ssl._create_unverified_context()
            with urllib.request.urlopen(url, timeout=timeout, context=context) as response:
                destination.write_bytes(response.read())
            return True, "downloaded_ssl_unverified"
        except Exception as fallback_exc:
            return False, f"failed_after_ssl_fallback: {fallback_exc}"
    except urllib.error.HTTPError as exc:
        return False, f"http_{exc.code}"
    except Exception as exc:  # network errors vary by platform
        return False, f"failed: {exc}"


def download_chirps_sample(start: date, days: int = 7) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    out_dir = EXTERNAL / "climate" / "chirps_daily"
    for index in range(days):
        day = start + timedelta(days=index)
        stem = f"chirps-v2.0.{day:%Y.%m.%d}.tif"
        url = f"https://data.chc.ucsb.edu/products/CHIRPS-2.0/africa_daily/tifs/p05/{day.year}/{stem}.gz"
        gz_path = out_dir / f"{stem}.gz"
        tif_path = out_dir / stem
        if tif_path.exists():
            rows.append(_download_row("chirps_daily", url, tif_path, True, "already_exists"))
            continue

        ok, status = download_url(url, gz_path)
        if ok:
            try:
                with gzip.open(gz_path, "rb") as source, tif_path.open("wb") as target:
                    shutil.copyfileobj(source, target)
                gz_path.unlink(missing_ok=True)
                rows.append(_download_row("chirps_daily", url, tif_path, True, "downloaded_unzipped"))
            except Exception as exc:
                rows.append(_download_row("chirps_daily", url, gz_path, False, f"gunzip_failed: {exc}"))
        else:
            gz_path.unlink(missing_ok=True)
            rows.append(_download_row("chirps_daily", url, tif_path, False, status))
    return rows


def download_srtm_if_missing() -> dict[str, object]:
    destination = EXTERNAL / "elevation" / "rwanda_srtm_opentopography.tif"
    url = (
        "https://portal.opentopography.org/API/globaldem"
        f"?demtype=SRTMGL1&south={RWANDA_BBOX['south']}&north={RWANDA_BBOX['north']}"
        f"&west={RWANDA_BBOX['west']}&east={RWANDA_BBOX['east']}&outputFormat=GTiff"
    )
    if destination.exists():
        return _download_row("srtm_opentopography", url, destination, True, "already_exists")
    ok, status = download_url(url, destination, timeout=120)
    if not ok:
        destination.unlink(missing_ok=True)
    return _download_row("srtm_opentopography", url, destination, ok, status)


def build_planned_rows() -> list[dict[str, object]]:
    return [
        {
            "dataset": "era5_land",
            "status": "planned_requires_cds_account",
            "local_path": "data/external/climate/era5_land",
            "reason": "Requires Copernicus CDS account/token and can be multi-GB if downloaded broadly.",
            "safe_next_step": "Use a short pilot period or monthly/daily summaries after CDS credentials are configured.",
        },
        {
            "dataset": "jrc_global_surface_water",
            "status": "planned_requires_earth_engine_or_alternate_export",
            "local_path": "data/external/hydrology/jrc_surface_water",
            "reason": "Guidance uses Google Earth Engine export, which requires authenticated Earth Engine setup.",
            "safe_next_step": "Export Rwanda-clipped occurrence/seasonality/recurrence bands through Earth Engine.",
        },
        {
            "dataset": "esa_worldcover",
            "status": "already_available_locally",
            "local_path": "data/external/landcover",
            "reason": "Two Rwanda-covering ESA WorldCover tiles already exist locally.",
            "safe_next_step": "Extract district/site covariates once rasterio/geopandas are installed.",
        },
        {
            "dataset": "worldpop",
            "status": "already_available_locally",
            "local_path": "data/external/population",
            "reason": "Rwanda WorldPop raster already exists locally.",
            "safe_next_step": "Extract population-at-risk summaries by district/site buffer.",
        },
        {
            "dataset": "boundaries",
            "status": "already_available_locally",
            "local_path": "data/external/boundaries",
            "reason": "Rwanda admin boundary GeoJSON files already exist locally.",
            "safe_next_step": "Use as the spatial reference layer for district mapping and future raster clipping.",
        },
        {
            "dataset": "who_malaria_context",
            "status": "planned_current_resource_link_needed",
            "local_path": "data/external/resistance_context",
            "reason": "HDX/WHO resource URLs can change and should be selected from the current resource page.",
            "safe_next_step": "Add current CSV resource URLs after manual confirmation.",
        },
    ]


def _download_row(dataset: str, url: str, path: Path, ok: bool, status: str) -> dict[str, object]:
    return {
        "dataset": dataset,
        "status": status,
        "success": ok,
        "url": url,
        "local_path": str(path.relative_to(ROOT)),
        "size_mb": round(path.stat().st_size / 1_048_576, 3) if path.exists() else 0,
    }


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def write_report(download_rows: list[dict[str, object]], planned_rows: list[dict[str, object]]) -> None:
    successful = [row for row in download_rows if row.get("success")]
    lines = [
        "# Open Data Download Context Report",
        "",
        "This report records the safe open-data downloads attempted for the Climate-Vector Intelligence Prototype.",
        "",
        "## Downloaded Or Already Present",
        "",
    ]
    if successful:
        lines.extend(
            [
                f"- {row['dataset']}: {row['status']} -> `{row['local_path']}` ({row['size_mb']} MB)"
                for row in successful
            ]
        )
    else:
        lines.append("- No new no-account downloads completed in this run.")

    failed = [row for row in download_rows if not row.get("success")]
    lines.extend(["", "## Failed Or Skipped No-Account Downloads", ""])
    if failed:
        lines.extend([f"- {row['dataset']}: {row['status']} from {row['url']}" for row in failed])
    else:
        lines.append("- None.")

    lines.extend(["", "## Planned / Account-Based / Heavy Sources", ""])
    lines.extend(
        [
            f"- {row['dataset']}: {row['status']}. {row['safe_next_step']}"
            for row in planned_rows
        ]
    )
    lines.extend(
        [
            "",
            "## Scientific Note",
            "",
            "These open datasets improve climate, hydrology, land-cover, elevation, population, and context covariates. They do not replace PI/field/lab outcome variables such as exact sample dates, official GPS, mosquito counts, sampling effort, resistance denominator, control mortality, and assay protocol.",
        ]
    )
    (REPORTS / "open_data_download_context_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ensure_layout()
    download_rows: list[dict[str, object]] = []
    download_rows.extend(download_chirps_sample(date(2024, 1, 1), days=7))
    download_rows.append(download_srtm_if_missing())
    planned_rows = build_planned_rows()

    write_csv(
        TABLES / "open_data_download_manifest.csv",
        download_rows,
        ["dataset", "status", "success", "url", "local_path", "size_mb"],
    )
    write_csv(
        TABLES / "open_data_planned_sources.csv",
        planned_rows,
        ["dataset", "status", "local_path", "reason", "safe_next_step"],
    )
    write_report(download_rows, planned_rows)
    print(REPORTS / "open_data_download_context_report.md")


if __name__ == "__main__":
    main()
