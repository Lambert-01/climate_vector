from __future__ import annotations

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WHO_HDX_DIR = ROOT / "data" / "external" / "resistance_context" / "who_hdx"
REPORTS = ROOT / "outputs" / "reports"
TABLES = ROOT / "outputs" / "tables"

WHO_HDX_KEEP_FILENAMES = {
    "air_pollution_indicators_rwa.csv",
    "environment_and_health_indicators_rwa.csv",
    "health_indicators_rwa.csv",
    "health_systems_indicators_rwa.csv",
    "health_workforce_indicators_rwa.csv",
    "malaria_indicators_rwa.csv",
    "neglected_tropical_diseases_indicators_rwa.csv",
    "water_sanitation_and_hygiene_wash_indicators_rwa.csv",
    "world_health_statistics_indicators_rwa.csv",
}

CORE_KEEP_PATHS = [
    "data/raw",
    "data/interim/raw_excel_exports",
    "data/processed",
    "data/sites",
    "data/external/nasa_power",
    "data/external/climate/chirps_daily",
    "data/external/boundaries",
    "data/external/gbif",
    "data/external/worldclim",
    "data/external/elevation",
    "data/external/landcover",
    "data/external/population",
    "data/external/osm",
    "data/external/era5_land",
    "data/external/resistance_context/who_data_for_rwa_package.json",
]


def cleanup_who_hdx() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    if not WHO_HDX_DIR.exists():
        return rows

    for path in sorted(WHO_HDX_DIR.glob("*.csv")):
        decision = "keep" if path.name in WHO_HDX_KEEP_FILENAMES else "delete"
        reason = (
            "Relevant to malaria, environment, WASH, health-system capacity, air pollution, or national health context."
            if decision == "keep"
            else "Broad public-health indicator not needed for the climate-vector proof-of-concept dataset layer."
        )
        size_mb = f"{path.stat().st_size / 1_048_576:.3f}"
        if decision == "delete":
            path.unlink()
        rows.append(
            {
                "path": str(path.relative_to(ROOT)),
                "decision": decision,
                "size_mb": size_mb,
                "reason": reason,
            }
        )
    return rows


def write_outputs(rows: list[dict[str, str]]) -> None:
    REPORTS.mkdir(parents=True, exist_ok=True)
    TABLES.mkdir(parents=True, exist_ok=True)
    csv_path = TABLES / "dataset_keep_delete_decision.csv"
    fieldnames = ["path", "decision", "size_mb", "reason"]
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    kept = [row for row in rows if row["decision"] == "keep"]
    deleted = [row for row in rows if row["decision"] == "delete"]
    lines = [
        "# Dataset Cleanup Report",
        "",
        "This cleanup keeps only datasets that directly support the Rwanda climate-vector proof of concept and removes broad WHO/HDX context CSVs that do not help mosquito ecology, climate exposure, mapping, malaria context, or implementation readiness.",
        "",
        "## Always Kept",
        "",
    ]
    lines.extend([f"- `{path}`" for path in CORE_KEEP_PATHS])
    lines.extend(
        [
            "",
            "## WHO/HDX Context Files Kept",
            "",
        ]
    )
    lines.extend([f"- `{row['path']}`: {row['reason']}" for row in kept] or ["- None found."])
    lines.extend(
        [
            "",
            "## WHO/HDX Files Deleted",
            "",
        ]
    )
    lines.extend([f"- `{row['path']}`: {row['reason']}" for row in deleted] or ["- None."])
    lines.extend(
        [
            "",
            "## Important Scientific Note",
            "",
            "No PI/raw mosquito data, processed mosquito/resistance tables, climate rasters, Rwanda boundaries, GBIF records, NASA POWER climate, CHIRPS rainfall, WorldClim, elevation, landcover, population, OSM, or ERA5 pilot data were deleted. The remaining missing-data problem is scientific, not a file-cleaning issue: official site GPS, exact sample dates, mosquito counts, sampling effort, assay protocol, resistance denominator, and control mortality still require PI/lab/field confirmation.",
        ]
    )
    (REPORTS / "dataset_cleanup_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Kept {len(kept)} WHO/HDX CSVs; deleted {len(deleted)} WHO/HDX CSVs.")
    print(REPORTS / "dataset_cleanup_report.md")
    print(csv_path)


def main() -> None:
    rows = cleanup_who_hdx()
    write_outputs(rows)


if __name__ == "__main__":
    main()
