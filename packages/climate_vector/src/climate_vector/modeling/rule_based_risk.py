from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DistrictRiskSignal:
    district: str
    risk_level: str
    score: int
    suitability_index: float
    rainfall_index: float
    temperature_index: float
    evidence_index: float
    vectorial_capacity_proxy: float
    uncertainty_level: str
    reason: str
    rule_or_model_version: str = "aedes-screen-v1"


def clamp(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    return max(lower, min(upper, value))


def temperature_suitability(tmean_c: float | None) -> float:
    """Asymmetric Aedes thermal-window proxy for climate screening.

    The bounds and optimum are informed by published Ae. aegypti transmission
    thermal limits. This is not a locally calibrated transmission function.
    """
    if tmean_c is None:
        return 0.0
    thermal_min = 17.8
    thermal_optimum = 29.1
    thermal_max = 34.6
    if tmean_c <= thermal_min or tmean_c >= thermal_max:
        return 0.0
    scale = thermal_optimum - thermal_min if tmean_c <= thermal_optimum else thermal_max - thermal_optimum
    return clamp(1.0 - ((tmean_c - thermal_optimum) / scale) ** 2)


def rainfall_suitability(rainfall_7d_mm: float | None, rainfall_30d_mm: float | None) -> float:
    """Rainfall habitat proxy with saturation and a penalty for very heavy 7-day rain."""
    r7 = max(0.0, rainfall_7d_mm or 0.0)
    r30 = max(0.0, rainfall_30d_mm or 0.0)
    short_term = clamp(r7 / 35)
    sustained = clamp(r30 / 120)
    flushing_penalty = 0.75 if r7 > 90 else 1.0
    return clamp((0.45 * short_term + 0.55 * sustained) * flushing_penalty)


def evidence_suitability(recent_records: int = 0, gps_validated: bool = False) -> float:
    record_signal = clamp(recent_records / 50)
    gps_bonus = 0.15 if gps_validated else 0.0
    return clamp(0.85 * record_signal + gps_bonus)


def vectorial_capacity_proxy(
    temperature_index: float,
    rainfall_index: float,
    evidence_index: float,
) -> float:
    """Dimensionless proxy inspired by vectorial-capacity components, not absolute R0."""
    return clamp((temperature_index**1.4) * (rainfall_index**1.1) * (0.35 + 0.65 * evidence_index))


def score_district_signal(
    district: str,
    rainfall_7d_mm: float | None,
    rainfall_30d_mm: float | None,
    tmean_c: float | None,
    recent_records: int = 0,
    gps_validated: bool = False,
) -> DistrictRiskSignal:
    """Create a conservative descriptive signal, not a validated prediction."""
    temp_index = temperature_suitability(tmean_c)
    rain_index = rainfall_suitability(rainfall_7d_mm, rainfall_30d_mm)
    evidence_index = evidence_suitability(recent_records, gps_validated)
    vc_proxy = vectorial_capacity_proxy(temp_index, rain_index, evidence_index)
    suitability = clamp(0.42 * temp_index + 0.40 * rain_index + 0.18 * evidence_index)

    score = 0
    reasons: list[str] = []

    if rainfall_7d_mm is not None and rainfall_7d_mm >= 30:
        score += 2
        reasons.append("high 7-day rainfall")
    elif rainfall_7d_mm is not None and rainfall_7d_mm >= 15:
        score += 1
        reasons.append("moderate 7-day rainfall")

    if rainfall_30d_mm is not None and rainfall_30d_mm >= 120:
        score += 2
        reasons.append("sustained 30-day rainfall")
    elif rainfall_30d_mm is not None and rainfall_30d_mm >= 60:
        score += 1
        reasons.append("moderate 30-day rainfall")

    if tmean_c is not None and 20 <= tmean_c <= 30:
        score += 1
        reasons.append("temperature within plausible vector range")

    if recent_records > 0:
        score += 1
        reasons.append("historical mosquito records present")

    if suitability >= 0.72 or score >= 5:
        risk_level = "high"
    elif suitability >= 0.45 or score >= 3:
        risk_level = "medium"
    else:
        risk_level = "low"

    uncertainty = "high" if not gps_validated else "medium"
    reason = "; ".join(reasons) if reasons else "insufficient signal; continue routine monitoring"
    return DistrictRiskSignal(
        district=district,
        risk_level=risk_level,
        score=score,
        suitability_index=round(suitability, 3),
        rainfall_index=round(rain_index, 3),
        temperature_index=round(temp_index, 3),
        evidence_index=round(evidence_index, 3),
        vectorial_capacity_proxy=round(vc_proxy, 3),
        uncertainty_level=uncertainty,
        reason=reason,
    )
