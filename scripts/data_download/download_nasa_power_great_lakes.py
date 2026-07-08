from __future__ import annotations

import csv
import ssl
import time
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[2]
POINTS = ROOT / "data" / "processed" / "context" / "great_lakes_points.csv"
OUTDIR = ROOT / "data" / "external" / "climate" / "nasa_power"

BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMETERS = "PRECTOTCORR,T2M,T2M_MIN,T2M_MAX,RH2M"


def download_point(row: dict[str, str]) -> Path:
    query = urlencode(
        {
            "parameters": PARAMETERS,
            "community": "AG",
            "longitude": row["longitude"],
            "latitude": row["latitude"],
            "start": "20210101",
            "end": "20251231",
            "format": "CSV",
            "time-standard": "UTC",
        }
    )
    url = f"{BASE_URL}?{query}"
    out = OUTDIR / f"{row['point_id']}_daily_climate_2021_2025.csv"
    try:
        with urlopen(url, timeout=90) as response:
            out.write_bytes(response.read())
    except URLError as exc:
        if "CERTIFICATE_VERIFY_FAILED" not in str(exc):
            raise
        context = ssl._create_unverified_context()
        with urlopen(url, timeout=90, context=context) as response:
            out.write_bytes(response.read())
    return out


def main() -> None:
    OUTDIR.mkdir(parents=True, exist_ok=True)
    with POINTS.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    for row in rows:
        print(f"Downloading NASA POWER climate for {row['location']}, {row['country']}...")
        out = download_point(row)
        print(f"Saved {out.relative_to(ROOT)}")
        time.sleep(0.25)


if __name__ == "__main__":
    main()
