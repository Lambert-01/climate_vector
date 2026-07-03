from __future__ import annotations

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]


def read_csv(relative_path: str) -> list[dict[str, str]]:
    path = ROOT / relative_path
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))

