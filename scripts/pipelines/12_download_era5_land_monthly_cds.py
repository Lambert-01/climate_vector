from __future__ import annotations

import argparse
import calendar
import csv
import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "external" / "era5_land" / "monthly_raw"
PROCESSED_DIR = ROOT / "data" / "processed"
REPORTS_DIR = ROOT / "outputs" / "reports"

DATASET = "reanalysis-era5-land-monthly-means"
RWANDA_AREA = [-1.0, 28.8, -3.0, 30.9]
VARIABLES = [
    "2m_dewpoint_temperature",
    "2m_temperature",
    "runoff",
    "surface_runoff",
    "total_precipitation",
]


def month_range(start_year: int, end_year: int) -> list[tuple[str, str]]:
    today = date.today()
    months: list[tuple[str, str]] = []
    for year in range(start_year, end_year + 1):
        if year > today.year:
            continue
        max_month = today.month if year == today.year else 12
        for month in range(1, max_month + 1):
            months.append((str(year), f"{month:02d}"))
    return months


def build_request(months: list[tuple[str, str]]) -> dict[str, object]:
    years = sorted({year for year, _ in months})
    month_values = sorted({month for _, month in months})
    return {
        "product_type": "monthly_averaged_reanalysis",
        "variable": VARIABLES,
        "year": years,
        "month": month_values,
        "time": "00:00",
        "data_format": "netcdf",
        "download_format": "unarchived",
        "area": RWANDA_AREA,
    }


def group_months_by_year(months: list[tuple[str, str]]) -> dict[str, list[str]]:
    grouped: dict[str, list[str]] = {}
    for year, month in months:
        grouped.setdefault(year, []).append(month)
    return {year: sorted(values) for year, values in sorted(grouped.items())}


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def variable_mean(ds, names: list[str]):
    for name in names:
        if name in ds:
            return ds[name].mean(dim=("latitude", "longitude"), skipna=True)
    return None


def time_coord(ds) -> str:
    for candidate in ["valid_time", "time"]:
        if candidate in ds.dims or candidate in ds.coords:
            return candidate
    raise ValueError("No time coordinate found in monthly ERA5-Land file.")


def values_to_rows(paths: list[Path], output_csv: Path) -> int:
    import xarray as xr

    rows: list[dict[str, object]] = []
    for path in paths:
        ds = xr.open_dataset(path)
        tdim = time_coord(ds)

        t2m = variable_mean(ds, ["t2m", "2m_temperature"])
        d2m = variable_mean(ds, ["d2m", "2m_dewpoint_temperature"])
        tp = variable_mean(ds, ["tp", "total_precipitation"])
        ro = variable_mean(ds, ["ro", "runoff"])
        sro = variable_mean(ds, ["sro", "surface_runoff"])

        times = ds[tdim].values
        for index, value in enumerate(times):
            month = str(value)[:7]
            year_int = int(month[:4])
            month_int = int(month[5:7])
            days = calendar.monthrange(year_int, month_int)[1]

            rainfall_mean_daily_mm = float(tp.values[index]) * 1000 if tp is not None else ""
            runoff_mean_daily_mm = float(ro.values[index]) * 1000 if ro is not None else ""
            surface_runoff_mean_daily_mm = float(sro.values[index]) * 1000 if sro is not None else ""

            rows.append(
                {
                    "month": month,
                    "tmean_c": round(float(t2m.values[index]) - 273.15, 4) if t2m is not None else "",
                    "dewpoint_c": round(float(d2m.values[index]) - 273.15, 4) if d2m is not None else "",
                    "rainfall_mean_daily_mm": round(rainfall_mean_daily_mm, 4) if rainfall_mean_daily_mm != "" else "",
                    "rainfall_total_estimated_mm": round(rainfall_mean_daily_mm * days, 4) if rainfall_mean_daily_mm != "" else "",
                    "runoff_mean_daily_mm": round(runoff_mean_daily_mm, 4) if runoff_mean_daily_mm != "" else "",
                    "runoff_total_estimated_mm": round(runoff_mean_daily_mm * days, 4) if runoff_mean_daily_mm != "" else "",
                    "surface_runoff_mean_daily_mm": round(surface_runoff_mean_daily_mm, 4) if surface_runoff_mean_daily_mm != "" else "",
                    "surface_runoff_total_estimated_mm": round(surface_runoff_mean_daily_mm * days, 4) if surface_runoff_mean_daily_mm != "" else "",
                    "days_in_month": days,
                    "coverage": "rwanda_bbox_mean",
                    "source_file": path.name,
                }
            )

        ds.close()

    rows.sort(key=lambda row: str(row["month"]))
    write_csv(
        output_csv,
        rows,
        [
            "month",
            "tmean_c",
            "dewpoint_c",
            "rainfall_mean_daily_mm",
            "rainfall_total_estimated_mm",
            "runoff_mean_daily_mm",
            "runoff_total_estimated_mm",
            "surface_runoff_mean_daily_mm",
            "surface_runoff_total_estimated_mm",
            "days_in_month",
            "coverage",
            "source_file",
        ],
    )
    return len(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Fast monthly ERA5-Land download for Rwanda.")
    parser.add_argument("--start-year", type=int, default=2020)
    parser.add_argument("--end-year", type=int, default=2026)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--convert-only", action="store_true")
    args = parser.parse_args()

    months = month_range(args.start_year, args.end_year)
    grouped = group_months_by_year(months)
    targets = {
        year: RAW_DIR / f"era5_land_rwanda_monthly_{year}.nc"
        for year in grouped
    }
    output_csv = PROCESSED_DIR / f"era5_land_rwanda_monthly_{args.start_year}_{months[-1][0]}.csv"
    requests = {
        year: build_request([(year, month) for month in month_values])
        for year, month_values in grouped.items()
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    preview = {
        "dataset": DATASET,
        "requests": requests,
        "targets": {year: str(path.relative_to(ROOT)) for year, path in targets.items()},
        "output_csv": str(output_csv.relative_to(ROOT)),
        "note": "Monthly means are much faster than hourly downloads and are suitable for climate-context screening.",
    }
    (REPORTS_DIR / "era5_land_monthly_cds_request_preview.json").write_text(
        json.dumps(preview, indent=2),
        encoding="utf-8",
    )

    if args.dry_run:
        print(REPORTS_DIR / "era5_land_monthly_cds_request_preview.json")
        return

    if not args.convert_only:
        import cdsapi

        RAW_DIR.mkdir(parents=True, exist_ok=True)
        for year, request in requests.items():
            target = targets[year]
            if target.exists():
                print(f"already exists: {target}")
                continue
            client = cdsapi.Client()
            result = client.retrieve(DATASET, request)
            result.download(str(target))
            print(target)

    rows = values_to_rows(list(targets.values()), output_csv)
    print(f"{output_csv} ({rows} monthly rows)")


if __name__ == "__main__":
    main()
