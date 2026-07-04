from __future__ import annotations

import argparse
import calendar
import csv
import json
import os
import requests
from datetime import date
from pathlib import Path

from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "data" / "external" / "era5_land" / "raw"
PROCESSED_DIR = ROOT / "data" / "external" / "era5_land" / "processed"
REPORT_DIR = ROOT / "outputs" / "reports"

RWANDA_AREA = [-1.0, 28.8, -3.0, 30.9]  # north, west, south, east
DEFAULT_VARIABLES = [
    "2m_dewpoint_temperature",
    "2m_temperature",
    "runoff",
    "surface_runoff",
    "total_precipitation",
]


def split_csv(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


def days_for_month(year: str, month: str) -> list[str]:
    _, last_day = calendar.monthrange(int(year), int(month))
    return [f"{day:02d}" for day in range(1, last_day + 1)]


def month_range(start_year: int, end_year: int, through_today: bool = True) -> list[tuple[str, str]]:
    today = date.today()
    months: list[tuple[str, str]] = []
    for year in range(start_year, end_year + 1):
        max_month = 12
        if through_today and year == today.year:
            max_month = today.month
        if through_today and year > today.year:
            continue
        for month in range(1, max_month + 1):
            months.append((str(year), f"{month:02d}"))
    return months


def build_request(year: str, month: str, variables: list[str]) -> dict[str, object]:
    today = date.today()
    days = days_for_month(year, month)
    if int(year) == today.year and int(month) == today.month:
        days = [f"{day:02d}" for day in range(1, today.day + 1)]
    return {
        "variable": variables,
        "year": year,
        "month": month,
        "day": days,
        "time": [f"{hour:02d}:00" for hour in range(24)],
        "data_format": "netcdf",
        "download_format": "unarchived",
        "area": RWANDA_AREA,
    }


def masked(value: str | None) -> str:
    if not value:
        return "missing"
    return "set"


def variable_mean(ds, names: list[str]):
    for name in names:
        if name in ds:
            return ds[name].mean(dim=("latitude", "longitude"), skipna=True)
    return None


def kelvin_to_celsius(values):
    return values - 273.15


def combine_daily_summary(raw_dir: Path, output_path: Path, source_files: list[Path] | None = None) -> int:
    import xarray as xr

    rows: list[dict[str, object]] = []
    paths = source_files if source_files is not None else sorted(
        path for path in raw_dir.glob("era5_land_rwanda_*.nc") if "_test" not in path.name
    )
    for path in paths:
        if not path.exists():
            continue
        ds = xr.open_dataset(path)
        time_dim = "valid_time" if "valid_time" in ds.dims or "valid_time" in ds.coords else "time"

        t2m = variable_mean(ds, ["t2m", "2m_temperature"])
        d2m = variable_mean(ds, ["d2m", "2m_dewpoint_temperature"])
        tp = variable_mean(ds, ["tp", "total_precipitation"])
        swvl1 = variable_mean(ds, ["swvl1", "volumetric_soil_water_layer_1"])
        ro = variable_mean(ds, ["ro", "runoff"])
        sro = variable_mean(ds, ["sro", "surface_runoff"])

        daily = {}
        if t2m is not None:
            daily["tmean_c"] = kelvin_to_celsius(t2m).resample({time_dim: "1D"}).mean()
        if d2m is not None:
            daily["dewpoint_c"] = kelvin_to_celsius(d2m).resample({time_dim: "1D"}).mean()
        if tp is not None:
            daily["rainfall_mm"] = (tp * 1000).resample({time_dim: "1D"}).sum()
        if swvl1 is not None:
            daily["soil_water_layer1_m3_m3"] = swvl1.resample({time_dim: "1D"}).mean()
        if ro is not None:
            daily["runoff_mm"] = (ro * 1000).resample({time_dim: "1D"}).sum()
        if sro is not None:
            daily["surface_runoff_mm"] = (sro * 1000).resample({time_dim: "1D"}).sum()

        if not daily:
            ds.close()
            continue

        dates = next(iter(daily.values()))[time_dim].values
        for index, value in enumerate(dates):
            row = {"date": str(value)[:10], "source_file": path.name}
            for key, series in daily.items():
                row[key] = round(float(series.values[index]), 4)
            rows.append(row)
        ds.close()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "date",
        "tmean_c",
        "dewpoint_c",
        "rainfall_mm",
        "soil_water_layer1_m3_m3",
        "runoff_mm",
        "surface_runoff_mm",
        "source_file",
    ]
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    return len(rows)


def main() -> None:
    load_dotenv(ROOT / ".env")

    parser = argparse.ArgumentParser(description="Download Rwanda ERA5-Land data from Copernicus CDS.")
    parser.add_argument("--year", default=os.getenv("CDS_ERA5_YEAR", "2024"))
    parser.add_argument("--month", default=os.getenv("CDS_ERA5_MONTH", "01"))
    parser.add_argument("--start-year", type=int, default=None)
    parser.add_argument("--end-year", type=int, default=None)
    parser.add_argument("--combine-only", action="store_true", help="Build the combined daily CSV from existing NetCDF files.")
    parser.add_argument("--dry-run", action="store_true", help="Print/write the planned request without downloading.")
    args = parser.parse_args()

    url = os.getenv("CDS_API_URL", "https://cds.climate.copernicus.eu/api")
    key = os.getenv("CDS_API_KEY")
    use_env_credentials = os.getenv("CDS_USE_ENV_CREDENTIALS", "0").strip().lower() in {"1", "true", "yes"}
    variables = split_csv(os.getenv("CDS_ERA5_VARIABLES"), DEFAULT_VARIABLES)
    start_year = args.start_year
    end_year = args.end_year
    months = month_range(start_year, end_year) if start_year and end_year else [(args.year, args.month.zfill(2))]
    combined_output = PROCESSED_DIR / (
        f"era5_land_rwanda_{months[0][0]}_{months[-1][0]}_daily_summary.csv"
        if len(months) > 1
        else f"era5_land_rwanda_{months[0][0]}_{months[0][1]}_daily_summary.csv"
    )

    if args.combine_only:
        row_count = combine_daily_summary(OUT_DIR, combined_output)
        print(f"{combined_output} ({row_count} daily rows)")
        return

    requests = []
    for year, month in months:
        requests.append(
            {
                "year": year,
                "month": month,
                "target": str((OUT_DIR / f"era5_land_rwanda_{year}_{month}.nc").relative_to(ROOT)),
                "request": build_request(year, month, variables),
            }
        )
    manifest = {
        "dataset": "reanalysis-era5-land",
        "mode": "monthly_downloads_combined_daily_summary",
        "combined_output": str(combined_output.relative_to(ROOT)),
        "cds_api_url": url,
        "cds_api_key": masked(key),
        "requests": requests,
    }

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    (REPORT_DIR / "era5_land_cds_request_preview.json").write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )

    if args.dry_run:
        print(f"CDS request preview written: {REPORT_DIR / 'era5_land_cds_request_preview.json'}")
        return

    if use_env_credentials and (not key or "replace-with" in key):
        raise SystemExit("CDS_API_KEY is missing. Add your Copernicus key to .env first.")

    import cdsapi

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    client = cdsapi.Client(url=url, key=key) if use_env_credentials else cdsapi.Client()
    for item in requests:
        target = ROOT / item["target"]
        if target.exists():
            print(f"already exists: {target}")
            continue
        try:
            result = client.retrieve("reanalysis-era5-land", item["request"])
            result.download(str(target))
        except requests.HTTPError as exc:
            if exc.response is not None and exc.response.status_code in {401, 403}:
                raise SystemExit(
                    "CDS authentication/permission failed. Check that CDS_API_KEY is the current "
                    "personal access token from the CDS profile, and accept the ERA5-Land dataset "
                    "terms of use on the CDS website before retrying."
                ) from exc
            raise
        print(target)

    source_files = [ROOT / item["target"] for item in requests]
    row_count = combine_daily_summary(OUT_DIR, combined_output, source_files=source_files)
    print(f"{combined_output} ({row_count} daily rows)")


if __name__ == "__main__":
    main()
