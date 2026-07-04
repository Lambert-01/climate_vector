from __future__ import annotations

import csv
from collections import defaultdict
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "external" / "era5_land" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"
TABLES_DIR = ROOT / "outputs" / "tables"
REPORTS_DIR = ROOT / "outputs" / "reports"

DAILY_CSV = PROCESSED_DIR / "era5_land_rwanda_daily_summary.csv"
VALIDATION_CSV = PROCESSED_DIR / "era5_land_file_validation.csv"
AVAILABLE_SUMMARY_CSV = PROCESSED_DIR / "era5_land_available_summary.csv"
MONTHLY_CSV = TABLES_DIR / "era5_land_monthly_summary.csv"
REPORT_MD = REPORTS_DIR / "era5_land_validation_report.md"

EXPECTED_VARIABLES = {
    "t2m": "2m_temperature",
    "d2m": "2m_dewpoint_temperature",
    "tp": "total_precipitation",
    "ro": "runoff",
    "sro": "surface_runoff",
    "swvl1": "volumetric_soil_water_layer_1",
}


def nc_files() -> list[Path]:
    return sorted(path for path in RAW_DIR.glob("era5_land_rwanda_*.nc") if "_test" not in path.name)


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


def kelvin_to_celsius(values):
    return values - 273.15


def time_coord(ds) -> str:
    if "valid_time" in ds.dims or "valid_time" in ds.coords:
        return "valid_time"
    return "time"


def scalar(value) -> float | str:
    try:
        return round(float(value), 4)
    except Exception:
        return ""


def date_text(value) -> str:
    return str(value)[:10]


def build_daily_rows(files: list[Path]) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    import xarray as xr

    daily_rows: list[dict[str, object]] = []
    validation_rows: list[dict[str, object]] = []

    for path in files:
        status = "ok"
        message = ""
        try:
            ds = xr.open_dataset(path)
            tdim = time_coord(ds)
            variables = set(ds.data_vars)
            missing_core = [name for name in ["t2m", "d2m", "tp", "ro"] if name not in variables]

            t2m = variable_mean(ds, ["t2m", "2m_temperature"])
            d2m = variable_mean(ds, ["d2m", "2m_dewpoint_temperature"])
            tp = variable_mean(ds, ["tp", "total_precipitation"])
            ro = variable_mean(ds, ["ro", "runoff"])
            sro = variable_mean(ds, ["sro", "surface_runoff"])
            swvl1 = variable_mean(ds, ["swvl1", "volumetric_soil_water_layer_1"])

            daily = {}
            if t2m is not None:
                daily["tmean_c"] = kelvin_to_celsius(t2m).resample({tdim: "1D"}).mean()
            if d2m is not None:
                daily["dewpoint_c"] = kelvin_to_celsius(d2m).resample({tdim: "1D"}).mean()
            if tp is not None:
                daily["rainfall_mm"] = (tp * 1000).resample({tdim: "1D"}).max()
            if ro is not None:
                daily["runoff_mm"] = (ro * 1000).resample({tdim: "1D"}).max()
            if sro is not None:
                daily["surface_runoff_mm"] = (sro * 1000).resample({tdim: "1D"}).max()
            if swvl1 is not None:
                daily["soil_water_layer1_m3_m3"] = swvl1.resample({tdim: "1D"}).mean()

            if not daily:
                status = "no_supported_variables"
                message = "No supported ERA5 variables found."
            else:
                dates = next(iter(daily.values()))[tdim].values
                for index, date_value in enumerate(dates):
                    row = {
                        "date": date_text(date_value),
                        "source_file": path.name,
                        "coverage": "rwanda_bbox_mean",
                    }
                    for key, series in daily.items():
                        row[key] = scalar(series.values[index])
                    daily_rows.append(row)

            validation_rows.append(
                {
                    "file": path.name,
                    "status": status,
                    "message": message,
                    "size_mb": round(path.stat().st_size / 1_048_576, 3),
                    "hourly_records": int(ds.sizes.get(tdim, 0)),
                    "daily_records": len(daily[next(iter(daily))][tdim]) if daily else 0,
                    "date_start": date_text(ds[tdim].values[0]) if int(ds.sizes.get(tdim, 0)) else "",
                    "date_end": date_text(ds[tdim].values[-1]) if int(ds.sizes.get(tdim, 0)) else "",
                    "variables_found": ",".join(sorted(variables)),
                    "variables_interpreted": ",".join(
                        EXPECTED_VARIABLES[name] for name in sorted(variables) if name in EXPECTED_VARIABLES
                    ),
                    "missing_core_variables": ",".join(missing_core),
                }
            )
            ds.close()
        except Exception as exc:
            validation_rows.append(
                {
                    "file": path.name,
                    "status": "failed",
                    "message": str(exc)[:240],
                    "size_mb": round(path.stat().st_size / 1_048_576, 3) if path.exists() else 0,
                    "hourly_records": 0,
                    "daily_records": 0,
                    "date_start": "",
                    "date_end": "",
                    "variables_found": "",
                    "variables_interpreted": "",
                    "missing_core_variables": "",
                }
            )

    daily_rows.sort(key=lambda row: (str(row.get("date")), str(row.get("source_file"))))
    return daily_rows, validation_rows


def build_monthly_rows(daily_rows: list[dict[str, object]]) -> list[dict[str, object]]:
    grouped: dict[str, list[dict[str, object]]] = defaultdict(list)
    for row in daily_rows:
        grouped[str(row["date"])[:7]].append(row)

    monthly_rows = []
    for month, rows in sorted(grouped.items()):
        rainfall = [float(row.get("rainfall_mm") or 0) for row in rows]
        runoff = [float(row.get("runoff_mm") or 0) for row in rows]
        sro = [float(row.get("surface_runoff_mm") or 0) for row in rows if row.get("surface_runoff_mm") != ""]
        temp = [float(row.get("tmean_c") or 0) for row in rows if row.get("tmean_c") != ""]
        dew = [float(row.get("dewpoint_c") or 0) for row in rows if row.get("dewpoint_c") != ""]
        monthly_rows.append(
            {
                "month": month,
                "daily_records": len(rows),
                "date_start": rows[0]["date"],
                "date_end": rows[-1]["date"],
                "rainfall_total_mm": round(sum(rainfall), 3),
                "rainfall_mean_daily_mm": round(sum(rainfall) / len(rainfall), 3) if rainfall else "",
                "runoff_total_mm": round(sum(runoff), 3),
                "surface_runoff_total_mm": round(sum(sro), 3) if sro else "",
                "tmean_c": round(sum(temp) / len(temp), 3) if temp else "",
                "dewpoint_c": round(sum(dew) / len(dew), 3) if dew else "",
                "source_files": ",".join(sorted({str(row["source_file"]) for row in rows})),
            }
        )
    return monthly_rows


def build_available_summary(daily_rows: list[dict[str, object]], validation_rows: list[dict[str, object]]) -> list[dict[str, object]]:
    if not daily_rows:
        return []
    rainfall = [float(row.get("rainfall_mm") or 0) for row in daily_rows]
    temp = [float(row.get("tmean_c") or 0) for row in daily_rows if row.get("tmean_c") != ""]
    dew = [float(row.get("dewpoint_c") or 0) for row in daily_rows if row.get("dewpoint_c") != ""]
    valid_files = [row for row in validation_rows if row.get("status") == "ok"]
    dates = [str(row["date"]) for row in daily_rows]
    return [
        {
            "dataset": "era5_land_rwanda_daily_summary",
            "records": len(daily_rows),
            "valid_files": len(valid_files),
            "date_start": min(dates),
            "date_end": max(dates),
            "rainfall_total_mm": round(sum(rainfall), 2),
            "rainfall_mean_daily_mm": round(sum(rainfall) / len(rainfall), 3) if rainfall else "",
            "temperature_mean_c": round(sum(temp) / len(temp), 3) if temp else "",
            "dewpoint_mean_c": round(sum(dew) / len(dew), 3) if dew else "",
            "coverage": "Rwanda bounding-box mean",
            "data_use": "gridded climate reanalysis covariate for suitability screening and field-planning context",
        }
    ]


def write_report(files: list[Path], daily_rows: list[dict[str, object]], validation_rows: list[dict[str, object]], monthly_rows: list[dict[str, object]]) -> None:
    ok_files = [row for row in validation_rows if row["status"] == "ok"]
    failed_files = [row for row in validation_rows if row["status"] != "ok"]
    dates = [str(row["date"]) for row in daily_rows]
    rainfall_total = sum(float(row.get("rainfall_mm") or 0) for row in daily_rows)
    lines = [
        "# ERA5-Land Validation And Conversion Report",
        "",
        f"Generated: {datetime.now().isoformat(timespec='seconds')}",
        "",
        "## Status",
        "",
        f"- NetCDF files found: {len(files):,}",
        f"- Valid files: {len(ok_files):,}",
        f"- Files needing review: {len(failed_files):,}",
        f"- Daily CSV rows created: {len(daily_rows):,}",
        f"- Monthly CSV rows created: {len(monthly_rows):,}",
        f"- Date coverage: {min(dates) if dates else ''} to {max(dates) if dates else ''}",
        f"- Total rainfall in converted files: {round(rainfall_total, 2)} mm",
        "",
        "## Generated Friendly Datasets",
        "",
        f"- `{DAILY_CSV.relative_to(ROOT)}`",
        f"- `{MONTHLY_CSV.relative_to(ROOT)}`",
        f"- `{VALIDATION_CSV.relative_to(ROOT)}`",
        "",
        "## How To Use",
        "",
        "The `.nc` files are scientific NetCDF rasters. The CSV files above are the project-friendly tables for dashboards, modelling summaries, and PI communication.",
        "",
        "## Scientific Note",
        "",
        "These are Rwanda bounding-box gridded climate summaries. ERA5-Land accumulated variables such as precipitation and runoff are converted using the daily maximum accumulated value, not the sum of all hourly accumulation values. They strengthen climate suitability and field-planning signals, but they do not replace missing mosquito outcome variables such as exact sample dates, official GPS, counts, effort, habitat status, or resistance protocol information.",
    ]
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    files = nc_files()
    daily_rows, validation_rows = build_daily_rows(files)
    monthly_rows = build_monthly_rows(daily_rows)
    available_summary = build_available_summary(daily_rows, validation_rows)

    write_csv(
        DAILY_CSV,
        daily_rows,
        [
            "date",
            "tmean_c",
            "dewpoint_c",
            "rainfall_mm",
            "runoff_mm",
            "surface_runoff_mm",
            "soil_water_layer1_m3_m3",
            "coverage",
            "source_file",
        ],
    )
    write_csv(
        VALIDATION_CSV,
        validation_rows,
        [
            "file",
            "status",
            "message",
            "size_mb",
            "hourly_records",
            "daily_records",
            "date_start",
            "date_end",
            "variables_found",
            "variables_interpreted",
            "missing_core_variables",
        ],
    )
    write_csv(
        AVAILABLE_SUMMARY_CSV,
        available_summary,
        [
            "dataset",
            "records",
            "valid_files",
            "date_start",
            "date_end",
            "rainfall_total_mm",
            "rainfall_mean_daily_mm",
            "temperature_mean_c",
            "dewpoint_mean_c",
            "coverage",
            "data_use",
        ],
    )
    write_csv(
        MONTHLY_CSV,
        monthly_rows,
        [
            "month",
            "daily_records",
            "date_start",
            "date_end",
            "rainfall_total_mm",
            "rainfall_mean_daily_mm",
            "runoff_total_mm",
            "surface_runoff_total_mm",
            "tmean_c",
            "dewpoint_c",
            "source_files",
        ],
    )
    write_report(files, daily_rows, validation_rows, monthly_rows)
    print(REPORT_MD)


if __name__ == "__main__":
    main()
