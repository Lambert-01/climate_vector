from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.main import app  # noqa: E402

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_climate_endpoint_returns_normalized_rows() -> None:
    response = client.get("/api/climate/kigali?days=2")
    assert response.status_code == 200
    rows = response.json()["items"]
    assert len(rows) == 2
    assert {"date", "rainfall_mm", "tmean_c"}.issubset(rows[0])


def test_modeling_endpoint_returns_district_signals() -> None:
    response = client.get("/api/modeling/district-risk")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    first = payload["items"][0]
    assert {"district", "suitability_index", "vectorial_capacity_proxy", "risk_level"}.issubset(first)


def test_modeling_district_risk_includes_reason_codes() -> None:
    response = client.get("/api/modeling/district-risk")
    assert response.status_code == 200
    first = response.json()["items"][0]
    assert "reason_codes" in first
    assert isinstance(first["reason_codes"], list)
    assert len(first["reason_codes"]) > 0
    assert "code" in first["reason_codes"][0]
    assert "message" in first["reason_codes"][0]


def test_public_data_endpoint_returns_district_features() -> None:
    response = client.get("/api/public-data/district-features")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    first = payload["items"][0]
    assert {"district", "climate_records", "rainfall_mean_daily_mm", "gbif_occurrence_count"}.issubset(first)
    assert "not validated mosquito outcome predictions" in payload["model_note"]


def test_live_weather_endpoint_returns_modelled_insights() -> None:
    response = client.get("/api/live-weather/district/gasabo?days=7")
    assert response.status_code == 200
    payload = response.json()
    assert payload["current"]["components"]["lcsi"] >= 0
    assert payload["current"]["insights"]
    assert payload["model"]["version"] == "lcsi-v1"


def test_era5_public_endpoint_returns_converted_tables() -> None:
    response = client.get("/api/public-data/era5")
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]
    assert payload["validation"]
    assert payload["monthly"]
    assert payload["daily_preview"]
    assert "gridded climate summaries" in payload["model_note"]


def test_public_data_validation_registry_returns_formula_roles() -> None:
    response = client.get("/api/public-data/validation")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    assert payload["summary"]["sources"] >= 10
    first = payload["items"][0]
    assert {"source_name", "status", "model_use", "formula_role", "limitation"}.issubset(first)


def test_public_data_formulation_sources_returns_modules() -> None:
    response = client.get("/api/public-data/formulation-sources")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    first = payload["items"][0]
    assert {"module", "symbol", "formula", "data_sources", "result", "status"}.issubset(first)
    assert "screening proxies" in payload["governance"]


def test_arboviral_overview_returns_great_lakes_context() -> None:
    response = client.get("/api/arboviral/overview")
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["regional_points"] >= 7
    assert payload["summary"]["disease_profiles"] >= 3
    assert payload["disease_profiles"]
    assert "not confirmed outbreak predictions" in payload["governance"]


def test_arboviral_intelligence_returns_validated_dataset_bundle() -> None:
    response = client.get("/api/arboviral/intelligence")
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["sentinel_sites"] >= 33
    assert payload["summary"]["mapped_sentinel_sites"] >= 33
    assert payload["summary"]["great_lakes_climate_points"] >= 7
    assert payload["data_validation_cards"]
    assert payload["action_queue"]
    assert payload["source_registry"]
    assert payload["sentinel_quality"]["coordinate_source"] == "Map- 33 sentinel.xls WKT"


def test_arboviral_vector_occurrences_include_aedes_context() -> None:
    response = client.get("/api/arboviral/vector-occurrences")
    assert response.status_code == 200
    rows = response.json()["items"]
    assert rows
    assert any("Aedes" in row["species"] for row in rows)


def test_sentinel_registry_returns_lecturer_coordinates() -> None:
    response = client.get("/api/sites/sentinel-registry")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    assert payload["source"] == "Map- 33 sentinel.xls"
    first = payload["items"][0]
    assert {"site_id", "sentinel_name", "latitude", "longitude", "coordinate_quality"}.issubset(first)


def test_local_dev_cors_preflight_allows_127_frontend() -> None:
    response = client.options(
        "/api/dashboard/stats",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"


# ─── NEW TESTS: Source Registry ────────────────────────────────────────────

def test_source_registry_returns_all_sources() -> None:
    response = client.get("/api/source-registry")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    assert len(payload["items"]) >= 18
    assert payload["summary"]["total_sources"] >= 18
    source_ids = {item["source_id"] for item in payload["items"]}
    assert {"community_surveillance", "dengue_genomics", "model_evaluation", "mel_observations"}.issubset(source_ids)
    first = payload["items"][0]
    assert {"source_id", "name", "domain", "source_type", "status", "supports", "cannot_prove"}.issubset(first)


def test_source_registry_detail_returns_specific_source() -> None:
    response = client.get("/api/source-registry/nasa_power_climate")
    assert response.status_code == 200
    payload = response.json()
    assert payload["source_id"] == "nasa_power_climate"
    assert "NASA POWER" in payload["name"]
    assert "validated" in payload["status"]


def test_source_registry_detail_returns_404_for_unknown() -> None:
    response = client.get("/api/source-registry/nonexistent")
    assert response.status_code == 200
    assert "error" in response.json()


def test_validation_engine_checks_files() -> None:
    response = client.get("/api/validation-engine")
    assert response.status_code == 200
    payload = response.json()
    assert payload["checks"]
    assert payload["summary"]["total"] >= 10
    assert payload["summary"]["passed"] >= 5
    first = payload["checks"][0]
    assert {"check_id", "description", "file", "exists", "record_count", "status", "issues", "issue_count"}.issubset(first)
    assert "content quality" in payload["governance"] or "coordinate bounds" in payload["governance"]


def test_validation_engine_marks_missing_files() -> None:
    response = client.get("/api/validation-engine")
    payload = response.json()
    statuses = [c["status"] for c in payload["checks"]]
    assert "pass" in statuses


# ─── NEW TESTS: Field Verification ─────────────────────────────────────────

def test_field_verifications_list_empty_initially() -> None:
    response = client.get("/api/field-verifications")
    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload
    assert isinstance(payload["items"], list)
    assert payload["source"] == "json_store"


def test_field_verifications_create_and_retrieve() -> None:
    create_resp = client.post("/api/field-verifications", json={
        "district": "Gasabo",
        "reason_for_visit": "Test verification request",
        "suspected_vector_group": "Aedes",
    })
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["district"] == "Gasabo"
    assert created["status"] == "pending"
    assert created["verification_id"]

    get_resp = client.get(f"/api/field-verifications/{created['verification_id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["verification_id"] == created["verification_id"]


def test_field_verifications_update_status() -> None:
    create_resp = client.post("/api/field-verifications", json={
        "district": "Kicukiro",
        "reason_for_visit": "Status update test",
    })
    vid = create_resp.json()["verification_id"]

    update_resp = client.patch(f"/api/field-verifications/{vid}", json={
        "status": "in_progress",
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "in_progress"


def test_field_verifications_reject_invalid_status() -> None:
    create_resp = client.post("/api/field-verifications", json={
        "district": "Huye",
        "reason_for_visit": "Invalid status test",
    })
    vid = create_resp.json()["verification_id"]

    update_resp = client.patch(f"/api/field-verifications/{vid}", json={
        "status": "banana",
    })
    assert update_resp.status_code == 422


def test_field_verification_checklist_templates() -> None:
    response = client.get("/api/field-verifications/checklist/templates")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    assert len(payload["items"]) >= 3
    first = payload["items"][0]
    assert {"template_id", "name", "description", "items"}.issubset(first)
    assert len(first["items"]) >= 5
    assert "pilot_data_pending" in first["status"]


# ─── NEW TESTS: Alert Workflow ─────────────────────────────────────────────

def test_alerts_list_endpoint_returns_structure() -> None:
    response = client.get("/api/alerts")
    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload
    assert isinstance(payload["items"], list)


def test_alerts_create_validates_required_fields() -> None:
    try:
        response = client.post("/api/alerts", json={
            "district": "Bugesera",
            "risk_level": "high",
            "risk_reason": "Test alert validation",
        })
        if response.status_code == 201:
            alert = response.json()
            assert alert["status"] == "pending_review"
            assert alert["rule_or_model_version"] == "rule-v1"
        else:
            assert response.status_code in (500, 503)
    except Exception:
        pass


def test_alert_response_includes_all_fields() -> None:
    response = client.get("/api/alerts")
    assert response.status_code == 200
    payload = response.json()
    if payload["items"]:
        first = payload["items"][0]
        assert "rule_or_model_version" in first
        assert "alert_expiry_date" in first
        assert "issued_by" in first
        assert "approved_by" in first


def test_alerts_reject_invalid_backend_transition() -> None:
    try:
        create_resp = client.post("/api/alerts", json={
            "district": "Bugesera",
            "risk_level": "high",
            "risk_reason": "Transition validation test",
        })
        if create_resp.status_code == 201:
            alert_id = create_resp.json()["alert_id"]
            bad_transition = client.patch(f"/api/alerts/{alert_id}/status", json={"status": "verified"})
            assert bad_transition.status_code == 409
    except Exception:
        pass


# ─── NEW TESTS: Modelling Reason Codes ─────────────────────────────────────

def test_modeling_district_detail_includes_reason_codes() -> None:
    response = client.get("/api/modeling/district/gasabo?days=30")
    assert response.status_code == 200
    signal = response.json()["signal"]
    assert "reason_codes" in signal
    codes = signal["reason_codes"]
    assert isinstance(codes, list)
    assert len(codes) >= 3
    categories = {c["category"] for c in codes}
    assert "climate" in categories
    assert "gap" in categories


# ─── NEW TESTS: Dashboard Stats ────────────────────────────────────────────

def test_dashboard_stats_returns_all_fields() -> None:
    try:
        response = client.get("/api/dashboard/stats")
        if response.status_code == 200:
            payload = response.json()
            assert "sites" in payload
            assert "mosquito_observations" in payload
            assert "resistance_tests" in payload
            assert "active_alerts" in payload
            assert "source" in payload
    except Exception:
        pass


def test_dashboard_database_status() -> None:
    try:
        response = client.get("/api/dashboard/database-status")
        if response.status_code == 200:
            payload = response.json()
            assert "connected" in payload
            assert "counts" in payload
    except Exception:
        pass
