from __future__ import annotations

from pathlib import Path
import sys
from collections import Counter, defaultdict

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages" / "climate_vector" / "src"))

from climate_vector.processing.summaries import frequency, norm, numeric_summary, read_records, write_records


EXPORTS = ROOT / "data" / "interim" / "raw_excel_exports"
PROCESSED = ROOT / "data" / "processed"
OUTPUTS = ROOT / "outputs"
EXTERNAL = ROOT / "data" / "external"
SITES = ROOT / "data" / "sites"


def clean_label(value: object) -> str:
    text = norm(value)
    if not text:
        return ""
    return " ".join(part[:1].upper() + part[1:].lower() for part in text.split())


def read_keyed_csv(path: Path, key: str) -> dict[str, dict[str, str]]:
    rows = read_records(path) if path.exists() else []
    return {norm(row.get(key)).lower(): row for row in rows if norm(row.get(key))}


def build_mosquito() -> list[dict[str, object]]:
    source = EXPORTS / "mosquito_behavior_raw_sheet1.csv"
    species_source = EXPORTS / "IR_data_sheet1.csv"
    rows = read_records(source)
    species_rows = read_records(species_source)
    out = []
    for index, row in enumerate(rows, start=1):
        species_row = species_rows[index - 1] if index - 1 < len(species_rows) else {}
        out.append(
            {
                "source_row_id": index,
                "source_dataset": "mosquito_behavior_raw.xls",
                "day_only": norm(row.get("Date")),
                "month": norm(row.get("Month")),
                "year": norm(row.get("Year")),
                "site_raw": norm(row.get("Site")),
                "district_raw": norm(row.get("District")),
                "origin_larvae_collection_raw": norm(row.get("Origin larvae collection")),
                "breeding_site_type_raw": norm(row.get("Types breeding sites")),
                "agri_insecticide_1_raw": norm(row.get("Insecticide used_Agri_1")),
                "agri_insecticide_2_raw": norm(row.get("Insecticide used_Agri_2")),
                "agri_insecticide_3_raw": norm(row.get("Insecticide used_Agri_3")),
                "anopheles_species_raw": norm(species_row.get("Anopheles species")),
                "species_source_dataset": "IR_data.xls" if norm(species_row.get("Anopheles species")) else "",
                "quality_flag": "current_data_descriptive_day_only_no_gps_no_counts_no_effort",
            }
        )
    if out:
        write_records(PROCESSED / "mosquito_ecology_preliminary.csv", out, list(out[0].keys()))
    return out


def build_resistance() -> list[dict[str, object]]:
    source = EXPORTS / "IR_data_selected_variables.csv"
    rows = read_records(source)
    out = []
    for index, row in enumerate(rows, start=1):
        out.append(
            {
                "source_row_id": index,
                "source_dataset": "IR_data.xls",
                "day_only": norm(row.get("Date")),
                "month": norm(row.get("Month")),
                "year": norm(row.get("Year")),
                "site_raw": norm(row.get("Site")),
                "district_raw": norm(row.get("District")),
                "insecticide_tested_raw": norm(row.get("Insecticide Tested+Concentration")),
                "concentration_label_raw": norm(row.get("conc")),
                "number_dead_24h": norm(row.get("# death observed_24h")),
                "mortality_rate_raw": norm(row.get("Mortality_rate")),
                "number_exposed": "",
                "control_mortality": "",
                "resistance_status": "",
                "quality_flag": "current_data_descriptive_needs_denominator_protocol_control_gps_for_validation",
            }
        )
    if out:
        write_records(PROCESSED / "resistance_test_replicates_preliminary.csv", out, list(out[0].keys()))
    return out


def build_outputs(mosquito: list[dict[str, object]], resistance: list[dict[str, object]]) -> None:
    tables = OUTPUTS / "tables"
    write_records(
        PROCESSED / "data_readiness_summary.csv",
        [
            {
                "item": "mosquito_ecology_records",
                "ready": True,
                "status": "available_from_mosquito_behavior_raw",
                "proposal_use": "descriptive ecology and breeding-site evidence",
            },
            {
                "item": "species_context",
                "ready": True,
                "status": "available_from_ir_data_sheet1",
                "proposal_use": "descriptive species context linked by row order",
            },
            {
                "item": "resistance_test_records",
                "ready": True,
                "status": "available_preliminary_from_ir_data",
                "proposal_use": "descriptive insecticide exposure and mortality pattern summaries",
            },
            {
                "item": "full_row_level_dates",
                "ready": False,
                "status": "day_only_present_month_year_missing",
                "proposal_use": "treat validation of dates as pilot work package",
            },
            {
                "item": "official_site_gps",
                "ready": False,
                "status": "not_in_pi_excel_files",
                "proposal_use": "use district centroids/provisional coordinates for prototype maps only",
            },
            {
                "item": "mosquito_counts_and_sampling_effort",
                "ready": False,
                "status": "not_in_current_excel_files",
                "proposal_use": "prototype uses record frequency; pilot will collect denominator and effort",
            },
            {
                "item": "resistance_denominator_protocol_control",
                "ready": False,
                "status": "not_confirmed_in_current_excel_files",
                "proposal_use": "avoid definitive resistance classification before lab confirmation",
            },
            {
                "item": "malaria_action_data",
                "ready": False,
                "status": "not_required_for_current_poc",
                "proposal_use": "future validation and operational impact work package",
            },
        ],
        ["item", "ready", "status", "proposal_use"],
    )
    write_records(
        PROCESSED / "current_data_source_inventory.csv",
        [
            {
                "source": "IR_data.xls",
                "type": "PI lecturer dataset",
                "current_use": "resistance test records, insecticide tested, deaths observed after 24h, mortality-rate field where present, species context from sheet 1",
                "limitations": "denominator, protocol, control mortality, official GPS, and full dates not confirmed",
            },
            {
                "source": "mosquito_behavior_raw.xls",
                "type": "PI lecturer dataset",
                "current_use": "district/site ecology records, larval origin, breeding-site type, agricultural insecticide-use context",
                "limitations": "no full dates, GPS, explicit mosquito counts, sampling effort, or positive/negative habitat status",
            },
            {
                "source": "public open datasets in data/external",
                "type": "supporting public covariates",
                "current_use": "climate, rainfall, boundaries, population, land cover, elevation, public mosquito occurrences, and health-system context",
                "limitations": "support context only; cannot replace project-specific field and lab measurements",
            },
        ],
        ["source", "type", "current_use", "limitations"],
    )
    for name, records, fields in [
        ("mosquito", mosquito, ["district_raw", "site_raw", "breeding_site_type_raw", "anopheles_species_raw"]),
        ("resistance", resistance, ["district_raw", "site_raw", "insecticide_tested_raw", "concentration_label_raw"]),
    ]:
        for field in fields:
            rows = frequency(records, field)
            write_records(tables / f"{name}_{field}_frequency.csv", rows, ["value", "count"])
    rows = numeric_summary(resistance, "insecticide_tested_raw", "number_dead_24h")
    write_records(tables / "resistance_death_summary_by_insecticide.csv", rows, ["insecticide_tested_raw", "records", "mean", "min", "max"])
    build_site_products(mosquito)


def build_site_products(mosquito: list[dict[str, object]]) -> None:
    district_features = read_keyed_csv(PROCESSED / "public_data_district_features.csv", "district")
    centroids = read_keyed_csv(EXTERNAL / "nasa_power" / "rwanda_district_centroids_simple.csv", "district")

    grouped: dict[tuple[str, str], list[dict[str, object]]] = defaultdict(list)
    site_case: dict[str, str] = {}
    district_case: dict[str, str] = {}
    for row in mosquito:
        site = clean_label(row.get("site_raw"))
        district = clean_label(row.get("district_raw"))
        if not site or not district:
            continue
        key = (site.lower(), district.lower())
        grouped[key].append(row)
        site_case[site.lower()] = site
        district_case[district.lower()] = district

    by_district_index: Counter[str] = Counter()
    candidate_rows: list[dict[str, object]] = []
    registry_rows: list[dict[str, object]] = []

    for (site_key, district_key), rows in sorted(grouped.items(), key=lambda item: (-len(item[1]), item[0])):
        site = site_case[site_key]
        district = district_case[district_key]
        feature = district_features.get(district_key, {})
        centroid = centroids.get(district_key, {})
        lat = feature.get("latitude") or centroid.get("latitude")
        lng = feature.get("longitude") or centroid.get("longitude")
        by_district_index[district_key] += 1
        index = by_district_index[district_key]
        try:
            base_lat = float(lat)
            base_lng = float(lng)
            # Small deterministic offsets keep markers readable while staying within district-scale context.
            offset_lat = ((index % 5) - 2) * 0.018
            offset_lng = (((index // 5) % 5) - 2) * 0.018
            candidate_latitude = round(base_lat + offset_lat, 6)
            candidate_longitude = round(base_lng + offset_lng, 6)
        except (TypeError, ValueError):
            candidate_latitude = ""
            candidate_longitude = ""

        agri_values = Counter()
        habitats = Counter()
        species = Counter()
        for row in rows:
            for field in ["agri_insecticide_1_raw", "agri_insecticide_2_raw", "agri_insecticide_3_raw"]:
                value = norm(row.get(field))
                if value:
                    agri_values[value] += 1
            habitat = norm(row.get("breeding_site_type_raw"))
            if habitat:
                habitats[habitat] += 1
            species_value = norm(row.get("anopheles_species_raw"))
            if species_value:
                species[species_value] += 1

        shared = {
            "site_id": site.lower().replace(" ", "_"),
            "site_name": site,
            "district": district,
            "province": "",
            "records": len(rows),
            "latitude": candidate_latitude,
            "longitude": candidate_longitude,
            "coordinate_source": "district_centroid_offset_from_public_boundaries",
            "coordinate_quality": "provisional_requires_pi_gps",
            "dominant_habitat": habitats.most_common(1)[0][0] if habitats else "",
            "dominant_species_context": species.most_common(1)[0][0] if species else "",
            "dominant_agri_insecticide": agri_values.most_common(1)[0][0] if agri_values else "",
            "rainfall_mean_daily_mm": feature.get("rainfall_mean_daily_mm", ""),
            "tmean_c_mean": feature.get("tmean_c_mean", ""),
            "gbif_occurrence_count": feature.get("gbif_occurrence_count", ""),
        }
        registry_rows.append(shared)
        candidate_rows.append(
            {
                **shared,
                "candidate_latitude": candidate_latitude,
                "candidate_longitude": candidate_longitude,
                "pi_action": "confirm official GPS before site-level modelling",
            }
        )

    registry_fields = [
        "site_id",
        "site_name",
        "district",
        "province",
        "records",
        "latitude",
        "longitude",
        "coordinate_source",
        "coordinate_quality",
        "dominant_habitat",
        "dominant_species_context",
        "dominant_agri_insecticide",
        "rainfall_mean_daily_mm",
        "tmean_c_mean",
        "gbif_occurrence_count",
    ]
    candidate_fields = registry_fields + ["candidate_latitude", "candidate_longitude", "pi_action"]
    write_records(SITES / "sites.csv", registry_rows, registry_fields)
    write_records(PROCESSED / "site_coordinate_candidates.csv", candidate_rows, candidate_fields)


def main() -> None:
    mosquito = build_mosquito()
    resistance = build_resistance()
    build_outputs(mosquito, resistance)
    print(f"mosquito_rows={len(mosquito)}")
    print(f"resistance_rows={len(resistance)}")


if __name__ == "__main__":
    main()
