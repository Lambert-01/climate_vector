from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.main import app  # noqa: E402


client = TestClient(app)


def test_submission_readiness_is_honest_and_operational() -> None:
    response = client.get("/api/dengue/submission-readiness")
    assert response.status_code == 200
    payload = response.json()
    assert payload["submission_position"] == "Existing digital architecture with grant-period prospective validation"
    assert "does not yet provide a validated dengue outbreak forecast" in payload["claim_boundary"]
    pillars = {row["pillar"]: row for row in payload["pillars"]}
    assert pillars["Digital platform"]["status"] == "implemented"
    assert pillars["Validated dengue forecast"]["status"] == "grant_period_work"


def test_dengue_model_readiness_registers_scientific_gates() -> None:
    response = client.get("/api/dengue/model-readiness")
    assert response.status_code == 200
    payload = response.json()
    gates = {row["gate"]: row for row in payload["gates"]}
    assert gates["climate_history"]["status"] == "ready"
    assert gates["dengue_outcomes"]["status"] == "formal_access_required"
    assert payload["training_ready"] is False
    assert "rolling-origin temporal validation" in payload["validation_plan"]


def test_community_report_rejects_missing_consent() -> None:
    response = client.post(
        "/api/dengue/community-reports",
        json={
            "reporter_role": "community_health_worker",
            "district": "Bugesera",
            "breeding_source": "Water storage container",
            "consent_confirmed": False,
        },
    )
    assert response.status_code == 422


def test_aedes_record_requires_count_and_valid_denominator() -> None:
    missing_count = client.post(
        "/api/dengue/aedes-surveillance",
        json={
            "district": "Bugesera",
            "collection_date": "2026-07-01",
            "trap_type": "ovitrap",
            "containers_inspected": 10,
            "containers_positive": 3,
        },
    )
    assert missing_count.status_code == 422

    invalid_denominator = client.post(
        "/api/dengue/aedes-surveillance",
        json={
            "district": "Bugesera",
            "collection_date": "2026-07-01",
            "trap_type": "ovitrap",
            "containers_inspected": 4,
            "containers_positive": 5,
            "eggs_count": 10,
        },
    )
    assert invalid_denominator.status_code == 422


def test_genomic_registry_rejects_unconfirmed_serotype() -> None:
    response = client.post(
        "/api/dengue/genomic-samples",
        json={
            "district": "Bugesera",
            "collection_date": "2026-07-01",
            "pool_size": 20,
            "dengue_result": "negative",
            "dengue_serotype": "DENV-2",
        },
    )
    assert response.status_code == 422


def test_mel_summary_has_proposal_indicators_without_fake_targets() -> None:
    response = client.get("/api/dengue/mel-summary")
    assert response.status_code == 200
    payload = response.json()
    assert payload["indicators"]
    assert payload["evaluation_schedule"] == ["baseline", "monthly monitoring", "midline", "endline"]
    assert "Targets must be approved" in payload["governance"]
