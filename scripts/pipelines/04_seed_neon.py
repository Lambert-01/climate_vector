from __future__ import annotations

import argparse
import asyncio
import csv
import sys
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from sqlalchemy import func, select  # noqa: E402

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.models import ClimateDaily, FieldVisit, MosquitoObservation, ResistanceTestReplicate, Site  # noqa: E402


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def read_nasa_power_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        lines = handle.readlines()
    for idx, line in enumerate(lines):
        if line.strip() == "-END HEADER-":
            content = "".join(lines[idx + 1 :])
            return list(csv.DictReader(content.splitlines()))
    return []


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def as_int(value: str | None) -> int | None:
    value = clean_text(value)
    if value is None:
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def as_float(value: str | None) -> float | None:
    value = clean_text(value)
    if value is None:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def as_date_from_parts(year: str | None, month: str | None, day: str | None) -> date | None:
    y = as_int(year)
    m = as_int(month)
    d = as_int(day)
    if not (y and m and d):
        return None
    try:
        return date(y, m, d)
    except ValueError:
        return None


def site_id(value: str | None) -> str | None:
    value = clean_text(value)
    if not value:
        return None
    return value.lower().replace(" ", "_").replace("/", "_")


async def seed(dry_run: bool = False) -> dict[str, int]:
    mosquito_rows = read_csv(ROOT / "data" / "processed" / "mosquito_ecology_preliminary.csv")
    resistance_rows = read_csv(ROOT / "data" / "processed" / "resistance_test_replicates_preliminary.csv")
    site_rows = read_csv(ROOT / "data" / "sites" / "sites.csv")
    climate_rows = read_nasa_power_csv(ROOT / "data" / "climate" / "kigali_test_2021_2025.csv")

    async with AsyncSessionLocal() as session:
        sites: dict[str, Site] = {}

        for row in site_rows:
            sid = site_id(row.get("site_id"))
            if not sid:
                continue
            sites[sid] = Site(
                site_id=sid,
                site_name=clean_text(row.get("site_id")) or sid,
                latitude=as_float(row.get("latitude")),
                longitude=as_float(row.get("longitude")),
                coordinate_source="site_registry_csv",
                coordinate_quality="unconfirmed",
            )

        for row in mosquito_rows + resistance_rows:
            sid = site_id(row.get("site_raw"))
            if not sid or sid in sites:
                continue
            sites[sid] = Site(
                site_id=sid,
                site_name=clean_text(row.get("site_raw")) or sid,
                district=clean_text(row.get("district_raw")),
                coordinate_source="raw_excel_site_name_only",
                coordinate_quality="missing_gps",
            )

        for site in sites.values():
            await session.merge(site)

        for row in mosquito_rows:
            source_id = as_int(row.get("source_row_id"))
            if source_id is None:
                continue
            sid = site_id(row.get("site_raw"))
            visit_id = f"raw-ecology-{source_id}"
            await session.merge(
                FieldVisit(
                    visit_id=visit_id,
                    site_id=sid,
                    visit_date=as_date_from_parts(row.get("year"), row.get("month"), row.get("day_only")),
                    habitat_type=clean_text(row.get("breeding_site_type_raw")),
                    habitat_positive=None,
                    sampling_effort_type=None,
                    sampling_effort_value=None,
                    quality_flag=clean_text(row.get("quality_flag")),
                    notes="Preliminary row-level visit proxy from raw Excel; sampling effort not confirmed.",
                )
            )
            await session.merge(
                MosquitoObservation(
                    observation_id=f"raw-mosquito-{source_id}",
                    visit_id=visit_id,
                    life_stage="larvae",
                    count=None,
                    species_raw=clean_text(row.get("anopheles_species_raw")),
                    species_clean=None,
                    identification_method=None,
                )
            )

        for row in resistance_rows:
            source_id = as_int(row.get("source_row_id"))
            if source_id is None:
                continue
            await session.merge(
                ResistanceTestReplicate(
                    replicate_id=f"ir-{source_id}",
                    source_row_id=source_id,
                    site_id=site_id(row.get("site_raw")),
                    district=clean_text(row.get("district_raw")),
                    test_date=as_date_from_parts(row.get("year"), row.get("month"), row.get("day_only")),
                    test_month=as_int(row.get("month")),
                    test_year=as_int(row.get("year")),
                    species_raw=None,
                    species_clean=None,
                    insecticide_tested=clean_text(row.get("insecticide_tested_raw")),
                    concentration_label=clean_text(row.get("concentration_label_raw")),
                    number_exposed=as_int(row.get("number_exposed")),
                    number_dead_24h=as_int(row.get("number_dead_24h")),
                    mortality_rate=as_float(row.get("mortality_rate_raw")),
                    control_mortality=as_float(row.get("control_mortality")),
                    resistance_status=clean_text(row.get("resistance_status")),
                    quality_flag=clean_text(row.get("quality_flag")),
                )
            )

        for row in climate_rows:
            year = as_int(row.get("YEAR"))
            doy = as_int(row.get("DOY"))
            if not (year and doy):
                continue
            climate_date = date(year, 1, 1) + timedelta(days=doy - 1)
            await session.merge(
                ClimateDaily(
                    location_id="kigali_reference",
                    date=climate_date,
                    rainfall_mm=as_float(row.get("PRECTOTCORR")),
                    tmean_c=as_float(row.get("T2M")),
                    tmin_c=as_float(row.get("T2M_MIN")),
                    tmax_c=as_float(row.get("T2M_MAX")),
                    relative_humidity=as_float(row.get("RH2M")),
                )
            )

        if dry_run:
            await session.rollback()
        else:
            await session.commit()

        counts = {}
        for model, key in [
            (Site, "sites"),
            (FieldVisit, "field_visits"),
            (MosquitoObservation, "mosquito_observations"),
            (ResistanceTestReplicate, "resistance_test_replicates"),
            (ClimateDaily, "climate_daily"),
        ]:
            counts[key] = (await session.execute(select(func.count()).select_from(model))).scalar_one()
        return counts


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Neon/PostgreSQL from local processed CSV files.")
    parser.add_argument("--dry-run", action="store_true", help="Load and validate rows but roll back changes.")
    args = parser.parse_args()
    counts = asyncio.run(seed(dry_run=args.dry_run))
    for key, value in counts.items():
        print(f"{key}={value}")


if __name__ == "__main__":
    main()
