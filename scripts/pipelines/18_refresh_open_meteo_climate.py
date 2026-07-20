#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import csv
import sys
from datetime import date
from pathlib import Path

import httpx
from sqlalchemy.dialects.postgresql import insert

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.models import ClimateDaily  # noqa: E402


def district_points() -> dict[str, tuple[float, float]]:
    path = ROOT / "data/processed/public_data_district_features.csv"
    points: dict[str, tuple[float, float]] = {}
    with path.open(encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            if row.get("district") and row.get("latitude") and row.get("longitude"):
                points[row["district"].strip().lower()] = (float(row["latitude"]), float(row["longitude"]))
    if not points:
        raise RuntimeError("No district coordinates were available for climate refresh.")
    return points


async def main() -> None:
    rows = []
    async with httpx.AsyncClient(timeout=60) as client:
        for district, (latitude, longitude) in district_points().items():
            response = await client.get("https://api.open-meteo.com/v1/forecast", params={"latitude": latitude, "longitude": longitude, "past_days": 5, "forecast_days": 7, "daily": "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean", "timezone": "Africa/Kigali"})
            response.raise_for_status()
            daily = response.json()["daily"]
            for index, day in enumerate(daily["time"]):
                rows.append({"location_id": district, "date": date.fromisoformat(day), "rainfall_mm": daily["precipitation_sum"][index], "tmean_c": daily["temperature_2m_mean"][index], "tmin_c": daily["temperature_2m_min"][index], "tmax_c": daily["temperature_2m_max"][index], "relative_humidity": daily["relative_humidity_2m_mean"][index]})
    async with AsyncSessionLocal() as db:
        statement = insert(ClimateDaily).values(rows)
        statement = statement.on_conflict_do_update(index_elements=[ClimateDaily.location_id, ClimateDaily.date], set_={key: getattr(statement.excluded, key) for key in rows[0] if key not in {"location_id", "date"}})
        await db.execute(statement)
        await db.commit()
    print(f"Upserted {len(rows)} observed/forecast district climate rows.")


if __name__ == "__main__":
    asyncio.run(main())
