from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def read_csv(relative_path: str) -> list[dict[str, str]]:
    path = ROOT / relative_path
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def write_csv(relative_path: str, rows: list[dict[str, object]], fields: list[str]) -> Path:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    return path


def norm(value: str | None) -> str:
    return " ".join(str(value or "").strip().split()).title()


def key(value: str | None) -> str:
    return norm(value).lower()


def build_site_candidates() -> list[dict[str, object]]:
    mosquito = read_csv("data/processed/mosquito_ecology_preliminary.csv")
    resistance = read_csv("data/processed/resistance_test_replicates_preliminary.csv")
    centroids = {key(row["district"]): row for row in read_csv("data/external/nasa_power/rwanda_district_centroids_simple.csv")}

    site_district_counts: dict[tuple[str, str], int] = defaultdict(int)
    for row in mosquito + resistance:
        site = norm(row.get("site_raw"))
        district = norm(row.get("district_raw"))
        if site and district:
            site_district_counts[(site, district)] += 1

    rows = []
    for (site, district), records in sorted(site_district_counts.items(), key=lambda item: (-item[1], item[0][1], item[0][0])):
        centroid = centroids.get(key(district), {})
        rows.append(
            {
                "site_name": site,
                "district": district,
                "records": records,
                "candidate_longitude": centroid.get("longitude", ""),
                "candidate_latitude": centroid.get("latitude", ""),
                "coordinate_source": "district_centroid_proxy_not_site_gps",
                "coordinate_quality": "provisional_do_not_use_for_site_level_validation",
                "pi_action": "Confirm official site GPS latitude/longitude.",
            }
        )
    return rows


def build_pi_request_rows() -> list[dict[str, object]]:
    return [
        {
            "priority": "critical",
            "dataset_area": "site registry",
            "missing_item": "official latitude and longitude for every sentinel site",
            "why_needed": "site-level maps, spatial modelling, climate extraction, and validation",
            "minimum_acceptable_format": "site_name,district,latitude,longitude,coordinate_source",
            "current_workaround": "district centroid proxy only",
            "can_model_without_it": "district-only descriptive suitability yes; site-level modelling no",
        },
        {
            "priority": "critical",
            "dataset_area": "field ecology",
            "missing_item": "full date: day, month, year",
            "why_needed": "temporal matching to rainfall, temperature, seasonality, and forecasting",
            "minimum_acceptable_format": "sample_id,collection_date",
            "current_workaround": "day-only values retained",
            "can_model_without_it": "no validated temporal model",
        },
        {
            "priority": "critical",
            "dataset_area": "field ecology",
            "missing_item": "mosquito count or abundance per sample",
            "why_needed": "abundance forecasting and negative-binomial/GAM models",
            "minimum_acceptable_format": "sample_id,count,life_stage",
            "current_workaround": "record count used only as evidence proxy",
            "can_model_without_it": "no abundance model",
        },
        {
            "priority": "critical",
            "dataset_area": "field ecology",
            "missing_item": "sampling effort and method",
            "why_needed": "fair comparison across sites and dates",
            "minimum_acceptable_format": "sample_id,method,effort_type,effort_value",
            "current_workaround": "none",
            "can_model_without_it": "no valid count model",
        },
        {
            "priority": "high",
            "dataset_area": "field ecology",
            "missing_item": "positive and negative habitat status",
            "why_needed": "presence/absence GLM, GAM, MaxEnt/background validation",
            "minimum_acceptable_format": "sample_id,habitat_positive",
            "current_workaround": "presence-like descriptive records only",
            "can_model_without_it": "no validated occurrence model",
        },
        {
            "priority": "critical",
            "dataset_area": "resistance",
            "missing_item": "number exposed denominator",
            "why_needed": "mortality rate and resistance classification",
            "minimum_acceptable_format": "replicate_id,number_exposed",
            "current_workaround": "none; do not assume 25 without lab confirmation",
            "can_model_without_it": "no final resistance classification",
        },
        {
            "priority": "critical",
            "dataset_area": "resistance",
            "missing_item": "control mortality and protocol",
            "why_needed": "Abbott correction, test validity, WHO/CDC interpretation",
            "minimum_acceptable_format": "replicate_id,control_mortality,protocol,species,test_date",
            "current_workaround": "descriptive death summaries only",
            "can_model_without_it": "no final resistance classification",
        },
        {
            "priority": "high",
            "dataset_area": "agricultural exposure",
            "missing_item": "insecticide class, timing, dose/frequency, and field location",
            "why_needed": "exposure score and resistance selection-pressure model",
            "minimum_acceptable_format": "site,date,insecticide,chemical_class,dose_or_frequency",
            "current_workaround": "raw names only",
            "can_model_without_it": "only descriptive exposure screening",
        },
    ]


def build_readme(candidate_count: int) -> str:
    return f"""# Gap Resolution Package

This package converts current dashboard gaps into a practical PI/data-owner action list.

Generated files:

- `data/processed/site_coordinate_candidates.csv`: provisional site-to-district centroid candidates for mapping discussion.
- `outputs/reports/pi_missing_data_request.csv`: exact missing fields to request from PI/lab/field team.
- `outputs/reports/gap_resolution_summary.md`: human-readable summary.

Important:

- Candidate coordinates are district centroids, not official site GPS.
- They may be used for rough district-level display only.
- They must not be used as validated site coordinates in scientific models.

Current candidate site-district pairs: {candidate_count}
"""


def main() -> None:
    site_candidates = build_site_candidates()
    pi_requests = build_pi_request_rows()

    site_path = write_csv(
        "data/processed/site_coordinate_candidates.csv",
        site_candidates,
        [
            "site_name",
            "district",
            "records",
            "candidate_longitude",
            "candidate_latitude",
            "coordinate_source",
            "coordinate_quality",
            "pi_action",
        ],
    )
    request_path = write_csv(
        "outputs/reports/pi_missing_data_request.csv",
        pi_requests,
        [
            "priority",
            "dataset_area",
            "missing_item",
            "why_needed",
            "minimum_acceptable_format",
            "current_workaround",
            "can_model_without_it",
        ],
    )
    summary_path = ROOT / "outputs" / "reports" / "gap_resolution_summary.md"
    summary_path.write_text(build_readme(len(site_candidates)), encoding="utf-8")

    print(site_path)
    print(request_path)
    print(summary_path)


if __name__ == "__main__":
    main()
