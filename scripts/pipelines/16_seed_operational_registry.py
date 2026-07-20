#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import hashlib
import sys
from datetime import date
from pathlib import Path

from sqlalchemy.dialects.postgresql import insert

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.models import DatasetRegistry  # noqa: E402
from app.routes.source_registry import _SOURCE_ENTRIES  # noqa: E402
from app.services.audit import add_audit_event  # noqa: E402


def checksum(path_value: str) -> str | None:
    path = ROOT / path_value
    if not path.is_file():
        return None
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


async def main() -> None:
    rows = []
    for source in _SOURCE_ENTRIES:
        processed = source.get("processed_table", "")
        rows.append({
            "dataset_id": source["source_id"], "dataset_name": source["name"],
            "source_organization": "PI/UR" if source["source_type"] == "pi_provided" else source["name"].split()[0],
            "source_url": None, "license": "Confirm in source terms" if source["source_type"] != "pi_provided" else "Project restricted",
            "download_date": date.today(), "coverage_period": source.get("date_range"),
            "file_checksum": checksum(processed), "responsible_person": "Data manager",
        })
    async with AsyncSessionLocal() as db:
        statement = insert(DatasetRegistry).values(rows)
        statement = statement.on_conflict_do_update(index_elements=[DatasetRegistry.dataset_id], set_={key: getattr(statement.excluded, key) for key in rows[0] if key != "dataset_id"})
        await db.execute(statement)
        add_audit_event(
            db, action="registry_sync", table_name="dataset_registry",
            record_id="source-registry", new_value={"entries": len(rows), "source": "source_registry.py"},
        )
        await db.commit()
    print(f"Seeded {len(rows)} dataset registry entries.")


if __name__ == "__main__":
    asyncio.run(main())
