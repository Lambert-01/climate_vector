import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.services.dengue_metrics import summarize_aedes_surveillance  # noqa: E402


def test_aedes_indices_use_observed_counts_and_effort() -> None:
    summary = summarize_aedes_surveillance([
        {
            "district": "Bugesera",
            "collection_date": "2026-07-01",
            "containers_inspected": 20,
            "containers_positive": 5,
            "traps_deployed": 2,
            "trap_hours": 48,
            "eggs_count": 30,
            "larvae_count": 8,
            "adults_count": 12,
            "quality_status": "validated",
        }
    ])
    assert summary["indices"]["container_index_pct"] == 25.0
    assert summary["indices"]["eggs_per_trap"] == 15.0
    assert summary["indices"]["adults_per_24_trap_hours"] == 6.0
    assert summary["effort"]["coverage_pct"] == 100.0


def test_aedes_indices_are_null_without_denominators() -> None:
    summary = summarize_aedes_surveillance([])
    assert summary["indices"]["container_index_pct"] is None
    assert summary["indices"]["adults_per_24_trap_hours"] is None
