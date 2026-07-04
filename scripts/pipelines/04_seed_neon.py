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
from sqlalchemy.dialects.postgresql import insert  # noqa: E402

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.models import Alert, ClimateDaily, FieldVisit, MosquitoObservation, ResistanceTestReplicate, Site  # noqa: E402


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


def title_label(value: str | None) -> str | None:
    value = clean_text(value)
    if not value:
        return None
    return " ".join(part[:1].upper() + part[1:].lower() for part in value.split())


async def bulk_upsert(
    session,
    model,
    rows: list[dict],
    conflict_cols: list[str],
    batch_size: int = 1000,
) -> None:
    if not rows:
        return
    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]
        statement = insert(model).values(batch)
        update_cols = {
            column.name: getattr(statement.excluded, column.name)
            for column in model.__table__.columns
            if column.name not in conflict_cols
        }
        statement = statement.on_conflict_do_update(index_elements=conflict_cols, set_=update_cols)
        await session.execute(statement)


async def seed(dry_run: bool = False) -> dict[str, int]:
    mosquito_rows = read_csv(ROOT / "data" / "processed" / "mosquito_ecology_preliminary.csv")
    resistance_rows = read_csv(ROOT / "data" / "processed" / "resistance_test_replicates_preliminary.csv")
    site_rows = read_csv(ROOT / "data" / "sites" / "sites.csv")

    sites: dict[str, dict] = {}

    for row in site_rows:
        sid = site_id(row.get("site_id"))
        if not sid:
            continue
        sites[sid] = {
            "site_id": sid,
            "site_name": clean_text(row.get("site_name")) or title_label(row.get("site_id")) or sid,
            "district": clean_text(row.get("district")),
            "province": clean_text(row.get("province")),
            "latitude": as_float(row.get("latitude")),
            "longitude": as_float(row.get("longitude")),
            "coordinate_source": clean_text(row.get("coordinate_source")) or "current_data_site_registry",
            "coordinate_quality": clean_text(row.get("coordinate_quality")) or "provisional_requires_pi_gps",
        }

    for row in mosquito_rows + resistance_rows:
        sid = site_id(row.get("site_raw"))
        if not sid or sid in sites:
            continue
        sites[sid] = {
            "site_id": sid,
            "site_name": clean_text(row.get("site_raw")) or sid,
            "district": clean_text(row.get("district_raw")),
            "province": None,
            "latitude": None,
            "longitude": None,
            "coordinate_source": "raw_excel_site_name_only",
            "coordinate_quality": "missing_gps",
        }

    field_visits: list[dict] = []
    mosquito_observations: list[dict] = []
    for row in mosquito_rows:
        source_id = as_int(row.get("source_row_id"))
        if source_id is None:
            continue
        sid = site_id(row.get("site_raw"))
        visit_id = f"raw-ecology-{source_id}"
        field_visits.append(
            {
                "visit_id": visit_id,
                "site_id": sid,
                "visit_date": as_date_from_parts(row.get("year"), row.get("month"), row.get("day_only")),
                "habitat_type": clean_text(row.get("breeding_site_type_raw")),
                "habitat_positive": None,
                "sampling_effort_type": None,
                "sampling_effort_value": None,
                "quality_flag": clean_text(row.get("quality_flag")),
                "notes": "Preliminary row-level visit proxy from raw Excel; sampling effort not confirmed.",
            }
        )
        mosquito_observations.append(
            {
                "observation_id": f"raw-mosquito-{source_id}",
                "visit_id": visit_id,
                "life_stage": "larvae",
                "count": None,
                "species_raw": clean_text(row.get("anopheles_species_raw")),
                "species_clean": None,
                "identification_method": None,
            }
        )

    resistance_replicates: list[dict] = []
    for row in resistance_rows:
        source_id = as_int(row.get("source_row_id"))
        if source_id is None:
            continue
        resistance_replicates.append(
            {
                "replicate_id": f"ir-{source_id}",
                "source_row_id": source_id,
                "site_id": site_id(row.get("site_raw")),
                "district": clean_text(row.get("district_raw")),
                "test_date": as_date_from_parts(row.get("year"), row.get("month"), row.get("day_only")),
                "test_month": as_int(row.get("month")),
                "test_year": as_int(row.get("year")),
                "species_raw": None,
                "species_clean": None,
                "insecticide_tested": clean_text(row.get("insecticide_tested_raw")),
                "concentration_label": clean_text(row.get("concentration_label_raw")),
                "number_exposed": as_int(row.get("number_exposed")),
                "number_dead_24h": as_int(row.get("number_dead_24h")),
                "mortality_rate": as_float(row.get("mortality_rate_raw")),
                "control_mortality": as_float(row.get("control_mortality")),
                "resistance_status": clean_text(row.get("resistance_status")),
                "quality_flag": clean_text(row.get("quality_flag")),
            }
        )

    climate_daily: list[dict] = []
    climate_dir = ROOT / "data" / "external" / "nasa_power"
    for path in sorted(climate_dir.glob("*_nasa_power_*.csv")):
        district_key = path.name.split("_nasa_power")[0]
        for row in read_nasa_power_csv(path):
            year = as_int(row.get("YEAR"))
            doy = as_int(row.get("DOY"))
            if not (year and doy):
                continue
            climate_daily.append(
                {
                    "location_id": district_key,
                    "date": date(year, 1, 1) + timedelta(days=doy - 1),
                    "rainfall_mm": as_float(row.get("PRECTOTCORR")),
                    "tmean_c": as_float(row.get("T2M")),
                    "tmin_c": as_float(row.get("T2M_MIN")),
                    "tmax_c": as_float(row.get("T2M_MAX")),
                    "relative_humidity": as_float(row.get("RH2M")),
                }
            )

    district_counts: dict[str, int] = {}
    site_counts: dict[str, int] = {}
    rainfall_by_district: dict[str, float] = {}
    for row in mosquito_rows:
        district = clean_text(row.get("district_raw"))
        if district:
            district_counts[district.lower()] = district_counts.get(district.lower(), 0) + 1
    for row in site_rows:
        district = clean_text(row.get("district"))
        if district:
            site_counts[district.lower()] = site_counts.get(district.lower(), 0) + 1
    for row in read_csv(ROOT / "data" / "processed" / "public_data_district_features.csv"):
        district = clean_text(row.get("district"))
        if district:
            rainfall_by_district[district.lower()] = as_float(row.get("rainfall_mean_daily_mm")) or 0.0

    alert_candidates = []
    for district_key, record_count in district_counts.items():
        rainfall = rainfall_by_district.get(district_key, 0.0)
        mapped_sites = site_counts.get(district_key, 0)
        score = record_count * 0.65 + rainfall * 35 + mapped_sites * 8
        alert_candidates.append((score, district_key, record_count, rainfall, mapped_sites))
    alert_candidates.sort(reverse=True)
    alerts = [
        {
            "alert_id": f"current-data-{index:03d}",
            "alert_date": date.today(),
            "district": title_label(district_key),
            "risk_level": "high" if index <= 2 else "medium",
            "risk_reason": f"{record_count} PI ecology records, {mapped_sites} mapped sites, {rainfall:.2f} mm/day rainfall proxy",
            "rule_or_model_version": "field-verification-priority-v1",
            "uncertainty_level": "managed",
            "issued_by": None,
            "approved_by": None,
            "status": "pending_review" if index <= 3 else "acknowledged",
            "alert_expiry_date": None,
            "recommended_action": "Prioritize site GPS validation and targeted larval/resistance follow-up",
        }
        for index, (_, district_key, record_count, rainfall, mapped_sites) in enumerate(alert_candidates[:5], start=1)
    ]

    async with AsyncSessionLocal() as session:
        await bulk_upsert(session, Site, list(sites.values()), ["site_id"])
        await bulk_upsert(session, FieldVisit, field_visits, ["visit_id"])
        await bulk_upsert(session, MosquitoObservation, mosquito_observations, ["observation_id"])
        await bulk_upsert(session, ResistanceTestReplicate, resistance_replicates, ["replicate_id"])
        await bulk_upsert(session, ClimateDaily, climate_daily, ["location_id", "date"])
        await bulk_upsert(session, Alert, alerts, ["alert_id"])

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
            (Alert, "alerts"),
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
