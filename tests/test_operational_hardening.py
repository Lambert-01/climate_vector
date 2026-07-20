from __future__ import annotations

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token, decode_token, require_operator
from app.main import app
from app.routes.alerts import ACTION_TRANSITIONS
from app.routes.dengue import GenomicArtifactIn


def test_production_operator_security_fails_closed(monkeypatch) -> None:
    monkeypatch.setattr(settings, "project_env", "production")
    monkeypatch.setattr(settings, "operator_api_key", "")
    with pytest.raises(HTTPException) as exc_info:
        require_operator(None)
    assert exc_info.value.status_code == 503


def test_jwt_round_trip_preserves_identity_and_role(monkeypatch) -> None:
    monkeypatch.setattr(settings, "jwt_secret", "test-only-secret")
    token = create_access_token("user-123", "field_officer")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "field_officer"


def test_response_action_lifecycle_is_controlled() -> None:
    assert ACTION_TRANSITIONS["assigned"] == {"acknowledged", "cancelled"}
    assert "completed" not in ACTION_TRANSITIONS["assigned"]
    assert ACTION_TRANSITIONS["completed"] == set()


def test_genomic_artifact_requires_real_result_or_url() -> None:
    with pytest.raises(ValueError):
        GenomicArtifactIn(artifact_type="lineage")
    artifact = GenomicArtifactIn(artifact_type="lineage", result_value="DENV-2 lineage under review")
    assert artifact.review_status == "pending_review"


def test_operational_routes_are_registered() -> None:
    client = TestClient(app)
    schema = client.get("/openapi.json").json()
    assert "/api/auth/login" in schema["paths"]
    assert "/api/operations/status" in schema["paths"]
    assert "/api/response-actions" in schema["paths"]
    assert "/api/media/community-photo" in schema["paths"]
    assert "/api/dengue/genomic-artifacts" in schema["paths"]
