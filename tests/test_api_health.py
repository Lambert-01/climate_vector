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
