from __future__ import annotations

import pytest
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))
from app.core.config import settings


@pytest.fixture(autouse=True)
def isolated_security_settings(monkeypatch):
    """Tests run in explicit development mode, independent of local .env secrets."""
    monkeypatch.setattr(settings, "project_env", "development")
    monkeypatch.setattr(settings, "operator_api_key", "")
