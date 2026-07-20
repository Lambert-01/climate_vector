from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_framework_identifies_co_pi_and_current_model_boundary() -> None:
    response = client.get("/api/dengue/mathematical-framework")
    assert response.status_code == 200
    payload = response.json()

    assert payload["scientific_lead"]["name"] == "NDACYAYISENGA Lambert"
    assert payload["current_operational_models"][0]["model_id"] == "aedes-screen-v1"
    assert "not dengue incidence" in payload["current_operational_models"][0]["claim_boundary"]


def test_framework_keeps_forecasting_models_blocked_until_pilot_data() -> None:
    payload = client.get("/api/dengue/mathematical-framework").json()

    assert all(model["status"].startswith("blocked_") for model in payload["grant_period_models"])
    assert "Rolling-origin" in payload["validation"]["temporal"]
