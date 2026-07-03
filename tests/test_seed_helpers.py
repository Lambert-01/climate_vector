from __future__ import annotations

import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "pipelines" / "04_seed_neon.py"
spec = importlib.util.spec_from_file_location("seed_neon", SCRIPT)
seed_neon = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(seed_neon)


def test_site_id_normalizes_site_names() -> None:
    assert seed_neon.site_id("Kigali Site/One") == "kigali_site_one"


def test_invalid_partial_date_returns_none() -> None:
    assert seed_neon.as_date_from_parts("", "", "11") is None


def test_float_parser_handles_placeholders() -> None:
    assert seed_neon.as_float("PUT_REAL_LATITUDE") is None
    assert seed_neon.as_float("1.25") == 1.25
