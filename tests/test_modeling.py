from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "climate_vector" / "src"))

from climate_vector.modeling import evaluate_training_readiness, score_district_signal  # noqa: E402


def test_training_readiness_blocks_when_critical_fields_missing() -> None:
    result = evaluate_training_readiness({"sample_date", "latitude"})
    assert result.ready is False
    assert "mosquito_count" in result.missing_fields


def test_rule_based_signal_is_descriptive_and_conservative() -> None:
    signal = score_district_signal(
        district="Bugesera",
        rainfall_7d_mm=32,
        rainfall_30d_mm=125,
        tmean_c=24,
        recent_records=10,
        gps_validated=False,
    )
    assert signal.risk_level == "high"
    assert signal.uncertainty_level == "high"
    assert signal.rule_or_model_version == "rule-v0-descriptive"
    assert 0 <= signal.suitability_index <= 1
    assert 0 <= signal.vectorial_capacity_proxy <= 1
