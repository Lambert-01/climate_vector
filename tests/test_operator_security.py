import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.core.security import require_operator


def test_operator_key_is_required_when_configured(monkeypatch) -> None:
    monkeypatch.setattr(settings, "operator_api_key", "pilot-secret")

    with pytest.raises(HTTPException) as exc_info:
        require_operator(None)

    assert exc_info.value.status_code == 401


def test_operator_key_accepts_exact_match(monkeypatch) -> None:
    monkeypatch.setattr(settings, "operator_api_key", "pilot-secret")

    assert require_operator("pilot-secret") == "pilot-operator"
