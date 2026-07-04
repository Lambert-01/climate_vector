from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.main import app  # noqa: E402


def test_health_endpoint() -> None:
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_climate_endpoint_returns_normalized_rows() -> None:
    client = TestClient(app)
    response = client.get("/api/climate/kigali?days=2")
    assert response.status_code == 200
    rows = response.json()["items"]
    assert len(rows) == 2
    assert {"date", "rainfall_mm", "tmean_c"}.issubset(rows[0])


def test_modeling_endpoint_returns_district_signals() -> None:
    client = TestClient(app)
    response = client.get("/api/modeling/district-risk")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    first = payload["items"][0]
    assert {"district", "suitability_index", "vectorial_capacity_proxy", "risk_level"}.issubset(first)


def test_public_data_endpoint_returns_district_features() -> None:
    client = TestClient(app)
    response = client.get("/api/public-data/district-features")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    first = payload["items"][0]
    assert {"district", "climate_records", "rainfall_mean_daily_mm", "gbif_occurrence_count"}.issubset(first)
    assert "not validated mosquito outcome predictions" in payload["model_note"]


def test_live_weather_endpoint_returns_modelled_insights() -> None:
    client = TestClient(app)
    response = client.get("/api/live-weather/district/gasabo?days=7")
    assert response.status_code == 200
    payload = response.json()
    assert payload["current"]["components"]["lcsi"] >= 0
    assert payload["current"]["insights"]
    assert payload["model"]["version"] == "lcsi-v1"


def test_era5_public_endpoint_returns_converted_tables() -> None:
    client = TestClient(app)
    response = client.get("/api/public-data/era5")
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]
    assert payload["validation"]
    assert payload["monthly"]
    assert payload["daily_preview"]
    assert "gridded climate summaries" in payload["model_note"]


def test_public_data_validation_registry_returns_formula_roles() -> None:
    client = TestClient(app)
    response = client.get("/api/public-data/validation")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    assert payload["summary"]["sources"] >= 10
    first = payload["items"][0]
    assert {"source_name", "status", "model_use", "formula_role", "limitation"}.issubset(first)


def test_public_data_formulation_sources_returns_modules() -> None:
    client = TestClient(app)
    response = client.get("/api/public-data/formulation-sources")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"]
    first = payload["items"][0]
    assert {"module", "symbol", "formula", "data_sources", "result", "status"}.issubset(first)
    assert "screening proxies" in payload["governance"]


def test_local_dev_cors_preflight_allows_127_frontend() -> None:
    client = TestClient(app)
    response = client.options(
        "/api/dashboard/stats",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"
