from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
NASA_DIR = ROOT / "data" / "external" / "nasa_power"


def _parse_nasa_csv(path: Path) -> list[dict]:
    """Parse NASA POWER CSV which has a multi-line header block."""
    rows = []
    in_data = False
    headers: list[str] = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("-END HEADER-"):
                in_data = True
                continue
            if not in_data:
                continue
            if not headers:
                headers = [h.strip() for h in line.split(",")]
                continue
            parts = line.split(",")
            if len(parts) >= len(headers):
                rows.append({headers[i]: parts[i].strip() for i in range(len(headers))})
    return rows


def _temp_suitability(t: float) -> float:
    if t < 16 or t > 34:
        return 0.0
    if t <= 25:
        return (t - 16) / 9
    if t <= 29:
        return 1.0
    return (34 - t) / 5


def _rainfall_suitability(r7: float, r30: float) -> float:
    s = 0.45 * min(r7 / 35, 1.0) + 0.55 * min(r30 / 120, 1.0)
    if r7 > 90:
        s *= 0.75
    return max(0.0, min(s, 1.0))


def _evidence_index(records: int) -> float:
    return min(records / 50, 1.0)


def _suitability_index(s_t: float, s_r: float, s_e: float) -> float:
    return 0.42 * s_t + 0.40 * s_r + 0.18 * s_e


def _vcp(s_t: float, s_r: float, s_e: float) -> float:
    return (s_t ** 1.4) * (s_r ** 1.1) * (0.35 + 0.65 * s_e)


def _risk_level(s: float) -> str:
    if s >= 0.72:
        return "high"
    if s >= 0.45:
        return "medium"
    return "low"


def _get_recent_climate(district: str, window: int = 30) -> tuple[float, float, float]:
    """Return (mean_temp, r7, r30) from the last available days."""
    path = NASA_DIR / f"{district.lower()}_nasa_power_2021_2025.csv"
    if not path.exists():
        raise ValueError(f"No NASA POWER climate file for district: {district}")
    rows = _parse_nasa_csv(path)
    if not rows:
        raise ValueError(f"NASA POWER climate file has no rows for district: {district}")
    recent = rows[-window:]
    last7 = rows[-7:]
    r7 = sum(float(r.get("PRECTOTCORR", 0) or 0) for r in last7)
    r30 = sum(float(r.get("PRECTOTCORR", 0) or 0) for r in recent)
    temps = [float(r.get("T2M", 20) or 20) for r in recent if r.get("T2M")]
    if not temps:
        raise ValueError(f"NASA POWER climate file has no valid temperature rows for district: {district}")
    tmean = sum(temps) / len(temps)
    return tmean, r7, r30


def _district_evidence_counts() -> dict[str, int]:
    path = ROOT / "data" / "processed" / "mosquito_ecology_preliminary.csv"
    counts: dict[str, int] = {}
    if not path.exists():
        return counts
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            district = str(row.get("district_raw") or "").strip().lower()
            if district:
                counts[district] = counts.get(district, 0) + 1
    return counts


def compute_district_suitability(district: str) -> dict:
    tmean, r7, r30 = _get_recent_climate(district)
    evidence = _district_evidence_counts().get(district.lower(), 0)

    s_t = _temp_suitability(tmean)
    s_r = _rainfall_suitability(r7, r30)
    s_e = _evidence_index(evidence)
    s = _suitability_index(s_t, s_r, s_e)
    vcp = _vcp(s_t, s_r, s_e)
    risk = _risk_level(s)

    return {
        "district": district,
        "temperature_mean_c": round(tmean, 2),
        "rainfall_7d_mm": round(r7, 2),
        "rainfall_30d_mm": round(r30, 2),
        "temperature_index": round(s_t, 3),
        "rainfall_index": round(s_r, 3),
        "evidence_index": round(s_e, 3),
        "suitability_index": round(s, 3),
        "vectorial_capacity_proxy": round(vcp, 4),
        "risk_level": risk,
        "uncertainty_level": "high",
        "model_version": "proxy-v1",
        "note": "Transparent proxy model. Not a validated prediction. GPS, full dates, counts, and effort are missing.",
    }


def compute_all_districts() -> list[dict]:
    files = sorted(NASA_DIR.glob("*_nasa_power_*.csv"))
    districts = [f.name.split("_nasa_power")[0] for f in files
                 if not f.name.startswith("rwanda_district")]
    return [compute_district_suitability(d) for d in districts]
