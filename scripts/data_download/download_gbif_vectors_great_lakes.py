from __future__ import annotations

import csv
import json
import ssl
import time
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[2]
OUTDIR = ROOT / "data" / "external" / "vector_occurrence" / "gbif"

BASE_URL = "https://api.gbif.org/v1/occurrence/search"
GEOMETRY = "POLYGON((27 -12, 39 -12, 39 4, 27 4, 27 -12))"
SPECIES = [
    "Aedes aegypti",
    "Aedes albopictus",
    "Culex quinquefasciatus",
    "Anopheles gambiae",
    "Anopheles funestus",
]
FIELDS = [
    "species_requested",
    "scientificName",
    "country",
    "decimalLatitude",
    "decimalLongitude",
    "eventDate",
    "year",
    "basisOfRecord",
    "institutionCode",
    "datasetName",
    "gbifID",
]


def fetch_species(species: str) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    offset = 0
    limit = 300
    while True:
        query = urlencode(
            {
                "scientificName": species,
                "geometry": GEOMETRY,
                "hasCoordinate": "true",
                "limit": str(limit),
                "offset": str(offset),
            }
        )
        try:
            with urlopen(f"{BASE_URL}?{query}", timeout=90) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except URLError as exc:
            if "CERTIFICATE_VERIFY_FAILED" not in str(exc):
                raise
            context = ssl._create_unverified_context()
            with urlopen(f"{BASE_URL}?{query}", timeout=90, context=context) as response:
                payload = json.loads(response.read().decode("utf-8"))
        results = payload.get("results", [])
        if not results:
            break
        for item in results:
            rows.append(
                {
                    "species_requested": species,
                    "scientificName": item.get("scientificName", ""),
                    "country": item.get("country", ""),
                    "decimalLatitude": item.get("decimalLatitude", ""),
                    "decimalLongitude": item.get("decimalLongitude", ""),
                    "eventDate": item.get("eventDate", ""),
                    "year": item.get("year", ""),
                    "basisOfRecord": item.get("basisOfRecord", ""),
                    "institutionCode": item.get("institutionCode", ""),
                    "datasetName": item.get("datasetName", ""),
                    "gbifID": item.get("gbifID", ""),
                }
            )
        offset += limit
        if offset >= int(payload.get("count", 0)) or offset >= 3000:
            break
        time.sleep(0.25)
    return rows


def safe_name(value: str) -> str:
    return value.lower().replace(" ", "_")


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    OUTDIR.mkdir(parents=True, exist_ok=True)
    for species in SPECIES:
        print(f"Downloading GBIF occurrences for {species}...")
        rows = fetch_species(species)
        out = OUTDIR / f"{safe_name(species)}_great_lakes_gbif.csv"
        write_csv(out, rows)
        print(f"Saved {len(rows)} rows to {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
