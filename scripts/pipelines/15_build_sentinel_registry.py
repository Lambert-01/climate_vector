from __future__ import annotations

import csv
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages" / "climate_vector" / "src"))

from climate_vector.data.xls_biff import write_xls_sheets  # noqa: E402


RAW_XLS = ROOT / "Map- 33 sentinel.xls"
EXPORT_DIR = ROOT / "data" / "interim" / "raw_excel_exports"
RAW_CSV = EXPORT_DIR / "Map- 33 sentinel_untitled_map__33_sentinel.csv"
OUT = ROOT / "data" / "processed" / "context" / "sentinel_sites_33.csv"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")


def title(value: str) -> str:
    return " ".join(part[:1].upper() + part[1:].lower() for part in value.split())


def parse_wkt_point(value: str) -> tuple[float | None, float | None]:
    match = re.search(r"POINT\s*\(\s*([-0-9.]+)\s+([-0-9.]+)\s*\)", value or "", re.I)
    if not match:
        return None, None
    return float(match.group(1)), float(match.group(2))


def main() -> None:
    if not RAW_CSV.exists():
        write_xls_sheets(RAW_XLS, EXPORT_DIR)

    rows = []
    seen: set[str] = set()
    for index, row in enumerate(read_csv(RAW_CSV), start=1):
        longitude, latitude = parse_wkt_point(row.get("WKT", ""))
        if longitude is None or latitude is None:
            longitude = float(row["long"])
            latitude = float(row["lat"])

        sentinel = row.get("sentinel") or row.get("name") or f"sentinel_{index}"
        site_id = slug(sentinel)
        if site_id in seen:
            site_id = f"{site_id}_{index}"
        seen.add(site_id)

        rows.append(
            {
                "site_id": site_id,
                "sentinel_name": title(sentinel),
                "site_label": row.get("name", ""),
                "longitude": round(float(longitude), 7),
                "latitude": round(float(latitude), 7),
                "wkt": f"POINT ({round(float(longitude), 7)} {round(float(latitude), 7)})",
                "coordinate_source": "map_33_sentinel_xls_wkt",
                "coordinate_quality": "lecturer_provided_wkt_coordinate",
                "regional_role": "rwanda_proof_of_concept_sentinel_site",
            }
        )

    write_csv(OUT, rows)
    print(f"sentinel_sites={len(rows)}")
    print(OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
