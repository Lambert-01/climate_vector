from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DistrictRiskSignal:
    district: str
    risk_level: str
    score: int
    uncertainty_level: str
    reason: str
    rule_or_model_version: str = "rule-v0-descriptive"


def score_district_signal(
    district: str,
    rainfall_7d_mm: float | None,
    rainfall_30d_mm: float | None,
    tmean_c: float | None,
    recent_records: int = 0,
    gps_validated: bool = False,
) -> DistrictRiskSignal:
    """Create a conservative descriptive signal, not a validated prediction."""
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

    if score >= 5:
        risk_level = "high"
    elif score >= 3:
        risk_level = "medium"
    else:
        risk_level = "low"

    uncertainty = "high" if not gps_validated else "medium"
    reason = "; ".join(reasons) if reasons else "insufficient signal; continue routine monitoring"
    return DistrictRiskSignal(
        district=district,
        risk_level=risk_level,
        score=score,
        uncertainty_level=uncertainty,
        reason=reason,
    )
