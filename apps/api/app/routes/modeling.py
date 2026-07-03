from __future__ import annotations

import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.services.csv_store import read_csv, read_nasa_power_csv


ROOT = Path(__file__).resolve().parents[4]
PACKAGE_SRC = ROOT / "packages" / "climate_vector" / "src"
if str(PACKAGE_SRC) not in sys.path:
    sys.path.insert(0, str(PACKAGE_SRC))

from climate_vector.modeling import evaluate_training_readiness, score_district_signal  # noqa: E402


router = APIRouter(tags=["modeling"])

NASA_POWER_DIR = ROOT / "data" / "external" / "nasa_power"


@router.get("/modeling/readiness")
def modeling_readiness() -> dict:
    current_fields = {
        "sample_date_day_only",
        "site_name",
        "district",
        "species_raw",
        "insecticide_tested",
        "number_dead_24h",
        "climate_daily",
    }
    readiness = evaluate_training_readiness(current_fields)
    return {
        "ready": readiness.ready,
        "missing_fields": list(readiness.missing_fields),
        "message": readiness.message,
        "current_fields": sorted(current_fields),
    }


@router.get("/modeling/district-risk")
def district_risk(days: int = 30) -> dict:
    items = []
    mosquito_counts = _mosquito_counts_by_district()
    for path in sorted(NASA_POWER_DIR.glob("*_nasa_power_*.csv")):
        district = path.name.split("_nasa_power")[0]
        rows = read_nasa_power_csv(str(path.relative_to(ROOT)))
        if not rows:
            continue
        signal = _signal_from_rows(district, rows, days, mosquito_counts.get(_norm(district), 0))
        items.append(signal)
    items.sort(key=lambda row: (row["suitability_index"], row["score"]), reverse=True)
    return {
        "items": items,
        "model_note": "Applied-mathematical descriptive suitability proxy; not validated prediction.",
    }


@router.get("/modeling/district/{district}")
def district_model_detail(district: str, days: int = 30) -> dict:
    path = NASA_POWER_DIR / f"{district.lower()}_nasa_power_2021_2025.csv"
    if not path.exists():
        raise HTTPException(404, f"No climate data for district: {district}")
    rows = read_nasa_power_csv(str(path.relative_to(ROOT)))
    mosquito_counts = _mosquito_counts_by_district()
    return {
        "district": district,
        "signal": _signal_from_rows(district, rows, days, mosquito_counts.get(_norm(district), 0)),
        "recent_climate": rows[-days:],
    }


def _signal_from_rows(district: str, rows: list[dict[str, str]], days: int, recent_records: int) -> dict:
    recent = rows[-max(1, days) :]
    last_7 = rows[-7:]
    last_30 = rows[-30:]
    rainfall_7d = sum(_as_float(row.get("rainfall_mm")) for row in last_7)
    rainfall_30d = sum(_as_float(row.get("rainfall_mm")) for row in last_30)
    temps = [_as_float(row.get("tmean_c")) for row in recent]
    temps = [value for value in temps if value is not None]
    tmean = sum(temps) / len(temps) if temps else None
    signal = score_district_signal(
        district=district,
        rainfall_7d_mm=rainfall_7d,
        rainfall_30d_mm=rainfall_30d,
        tmean_c=tmean,
        recent_records=recent_records,
        gps_validated=False,
    )
    return {
        "district": signal.district,
        "risk_level": signal.risk_level,
        "score": signal.score,
        "suitability_index": signal.suitability_index,
        "rainfall_index": signal.rainfall_index,
        "temperature_index": signal.temperature_index,
        "evidence_index": signal.evidence_index,
        "vectorial_capacity_proxy": signal.vectorial_capacity_proxy,
        "uncertainty_level": signal.uncertainty_level,
        "reason": signal.reason,
        "rule_or_model_version": signal.rule_or_model_version,
        "rainfall_7d_mm": round(rainfall_7d, 2),
        "rainfall_30d_mm": round(rainfall_30d, 2),
        "tmean_c": round(tmean, 2) if tmean is not None else None,
        "recent_records": recent_records,
    }


def _mosquito_counts_by_district() -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in read_csv("outputs/tables/mosquito_district_raw_frequency.csv"):
        key = _norm(row.get("value", ""))
        counts[key] = counts.get(key, 0) + int(float(row.get("count") or 0))
    return counts


def _as_float(value: str | None) -> float:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return 0.0


def _norm(value: str) -> str:
    return str(value).strip().lower()
