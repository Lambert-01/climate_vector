from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def read_csv(relative_path: str) -> list[dict[str, str]]:
    path = ROOT / relative_path
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def present(value: str | None) -> bool:
    return value is not None and str(value).strip() not in {"", "NA", "N/A", "nan", "None"}


def ratio(rows: list[dict[str, str]], column: str) -> float:
    if not rows:
        return 0.0
    return sum(1 for row in rows if present(row.get(column))) / len(rows)


def unique_count(rows: list[dict[str, str]], column: str) -> int:
    return len({row.get(column, "").strip() for row in rows if present(row.get(column))})


def top_values(rows: list[dict[str, str]], column: str, n: int = 8) -> list[tuple[str, int]]:
    return Counter(row.get(column, "").strip() for row in rows if present(row.get(column))).most_common(n)


def status_from_ratio(value: float, high: float = 0.95, partial: float = 0.50) -> str:
    if value >= high:
        return "ready"
    if value >= partial:
        return "partial"
    return "missing_or_insufficient"


def build_validation() -> str:
    mosquito = read_csv("data/processed/mosquito_ecology_preliminary.csv")
    resistance = read_csv("data/processed/resistance_test_replicates_preliminary.csv")
    sites = read_csv("data/sites/sites.csv")
    climate = read_csv("data/external/nasa_power/rwanda_district_centroids_simple.csv")
    site_candidates = read_csv("data/processed/site_coordinate_candidates.csv")

    checks = [
        ("Mosquito records", len(mosquito), "Rows available from processed ecology table."),
        ("Resistance records", len(resistance), "Rows available from processed resistance table."),
        ("Site registry rows", len(sites), "Rows in current site registry."),
        ("District climate centroids", len(climate), "District-level climate reference locations."),
        ("Provisional site coordinate candidates", len(site_candidates), "District-centroid proxy coordinates for PI review only."),
    ]

    mosquito_fields = [
        ("day_only", "Collection day only"),
        ("month", "Collection month"),
        ("year", "Collection year"),
        ("site_raw", "Site name"),
        ("district_raw", "District"),
        ("breeding_site_type_raw", "Breeding site type"),
        ("anopheles_species_raw", "Anopheles species"),
    ]
    resistance_fields = [
        ("day_only", "Test day only"),
        ("month", "Test month"),
        ("year", "Test year"),
        ("site_raw", "Test site"),
        ("district_raw", "District"),
        ("insecticide_tested_raw", "Insecticide tested"),
        ("concentration_label_raw", "Concentration label"),
        ("number_dead_24h", "Dead at 24h"),
        ("number_exposed", "Number exposed"),
        ("control_mortality", "Control mortality"),
    ]

    lines = [
        "# Model Readiness Validation Report",
        "",
        "This report validates the currently available project data against the requirements of the national climate-vector modelling concept.",
        "",
        "## Inventory",
        "",
        "| Dataset | Count | Interpretation |",
        "|---|---:|---|",
    ]
    for name, count, note in checks:
        lines.append(f"| {name} | {count:,} | {note} |")

    lines.extend([
        "",
        "## Mosquito Ecology Completeness",
        "",
        "| Field | Meaning | Completeness | Status |",
        "|---|---|---:|---|",
    ])
    for column, label in mosquito_fields:
        value = ratio(mosquito, column)
        lines.append(f"| `{column}` | {label} | {value:.1%} | {status_from_ratio(value)} |")

    lines.extend([
        "",
        "## Resistance Data Completeness",
        "",
        "| Field | Meaning | Completeness | Status |",
        "|---|---|---:|---|",
    ])
    for column, label in resistance_fields:
        value = ratio(resistance, column)
        lines.append(f"| `{column}` | {label} | {value:.1%} | {status_from_ratio(value)} |")

    lines.extend([
        "",
        "## Spatial And Temporal Readiness",
        "",
        f"- Unique mosquito districts: {unique_count(mosquito, 'district_raw')}",
        f"- Unique mosquito sites: {unique_count(mosquito, 'site_raw')}",
        f"- Unique resistance districts: {unique_count(resistance, 'district_raw')}",
        f"- Unique resistance sites: {unique_count(resistance, 'site_raw')}",
        f"- Site registry rows with numeric latitude: {sum(1 for row in sites if _is_float(row.get('latitude')))} / {len(sites)}",
        f"- Site registry rows with numeric longitude: {sum(1 for row in sites if _is_float(row.get('longitude')))} / {len(sites)}",
        f"- Provisional site-district coordinate candidates: {len(site_candidates)}",
        "",
        "## Dominant Observed Categories",
        "",
        "### Mosquito Districts",
        "",
    ])
    lines.extend([f"- {name}: {count}" for name, count in top_values(mosquito, "district_raw")])
    lines.extend(["", "### Breeding Site Types", ""])
    lines.extend([f"- {name}: {count}" for name, count in top_values(mosquito, "breeding_site_type_raw")])
    lines.extend(["", "### Resistance Insecticides", ""])
    lines.extend([f"- {name}: {count}" for name, count in top_values(resistance, "insecticide_tested_raw")])

    lines.extend([
        "",
        "## Current Modelling Decision",
        "",
        "The current data can support:",
        "",
        "- Descriptive national dashboarding.",
        "- District-level climate suitability screening.",
        "- Preliminary habitat and insecticide exposure mapping.",
        "- Data-readiness tracking for PI and partner institutions.",
        "",
        "The current data cannot yet support:",
        "",
        "- Validated mosquito abundance forecasting.",
        "- True larval presence/absence modelling.",
        "- Resistance classification using WHO/CDC rules.",
        "- Malaria early warning or intervention-effect modelling.",
        "",
        "## Critical Missing Items",
        "",
        "- Full date: day, month, and year for every observation.",
        "- Valid GPS coordinates for all sentinel sites.",
        "- Mosquito counts or standardized abundance measures.",
        "- Sampling effort and collection method.",
        "- Positive and negative habitat observations.",
        "- Resistance denominator, protocol, control mortality, and validity status.",
        "- Formal malaria or intervention outcome data, if disease early-warning is required.",
        "",
        "## Gap Mitigation Files Now Generated",
        "",
        "- `data/processed/site_coordinate_candidates.csv`: provisional district-centroid coordinates for mapping discussion only.",
        "- `outputs/reports/pi_missing_data_request.csv`: exact missing fields to request from PI/lab/field teams.",
        "- `outputs/reports/gap_resolution_summary.md`: short summary of what was generated.",
        "",
        "These files reduce project management gaps, but they do not replace official field data.",
    ])
    return "\n".join(lines) + "\n"


def _is_float(value: str | None) -> bool:
    try:
        float(str(value).strip())
        return True
    except (TypeError, ValueError):
        return False


def main() -> None:
    output = ROOT / "outputs" / "reports" / "model_readiness_validation.md"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(build_validation(), encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()
