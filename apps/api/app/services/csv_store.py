from __future__ import annotations

import csv
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]


def read_csv(relative_path: str) -> list[dict[str, str]]:
    path = ROOT / relative_path
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def read_nasa_power_csv(relative_path: str) -> list[dict[str, str]]:
    path = ROOT / relative_path
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        lines = handle.readlines()

    for idx, line in enumerate(lines):
        if line.strip() == "-END HEADER-":
            rows = list(csv.DictReader("".join(lines[idx + 1 :]).splitlines()))
            return [normalise_nasa_power_row(row) for row in rows]
    return [normalise_nasa_power_row(row) for row in csv.DictReader(lines)]


def normalise_nasa_power_row(row: dict[str, str]) -> dict[str, str]:
    year = _as_int(row.get("YEAR"))
    doy = _as_int(row.get("DOY"))
    row_date = ""
    if year and doy:
        row_date = str(date(year, 1, 1) + timedelta(days=doy - 1))
    return {
        "date": row_date,
        "year": str(year or ""),
        "doy": str(doy or ""),
        "rainfall_mm": row.get("PRECTOTCORR", ""),
        "tmean_c": row.get("T2M", ""),
        "tmin_c": row.get("T2M_MIN", ""),
        "tmax_c": row.get("T2M_MAX", ""),
        "relative_humidity": row.get("RH2M", ""),
    }


def _as_int(value: str | None) -> int | None:
    try:
        return int(float(str(value).strip()))
    except (TypeError, ValueError):
        return None
