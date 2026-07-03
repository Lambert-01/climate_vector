from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages" / "climate_vector" / "src"))

from climate_vector.processing.summaries import frequency, norm, numeric_summary, read_records, write_records


EXPORTS = ROOT / "data" / "interim" / "raw_excel_exports"
PROCESSED = ROOT / "data" / "processed"
OUTPUTS = ROOT / "outputs"


def build_mosquito() -> list[dict[str, object]]:
    source = EXPORTS / "IR_data_sheet1.csv"
    rows = read_records(source)
    out = []
    for index, row in enumerate(rows, start=1):
        out.append(
            {
                "source_row_id": index,
                "day_only": norm(row.get("Date")),
                "month": norm(row.get("Month")),
                "year": norm(row.get("Year")),
                "site_raw": norm(row.get("Site")),
                "district_raw": norm(row.get("District")),
                "origin_larvae_collection_raw": norm(row.get("Origin/larvae collection")),
                "breeding_site_type_raw": norm(row.get("Types breeding sites")),
                "agri_insecticide_1_raw": norm(row.get("Insecticide used_Agri_1")),
                "agri_insecticide_2_raw": norm(row.get("Insecticide used_Agri_2")),
                "agri_insecticide_3_raw": norm(row.get("Insecticide used_Agri_3")),
                "anopheles_species_raw": norm(row.get("Anopheles species")),
                "quality_flag": "missing_month_year_missing_gps_descriptive_only",
            }
        )
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
                "quality_flag": "needs_denominator_protocol_control_date_gps_confirmation",
            }
        )
    write_records(PROCESSED / "resistance_test_replicates_preliminary.csv", out, list(out[0].keys()))
    return out


def build_outputs(mosquito: list[dict[str, object]], resistance: list[dict[str, object]]) -> None:
    tables = OUTPUTS / "tables"
    write_records(
        PROCESSED / "data_readiness_summary.csv",
        [
            {"item": "mosquito_ecology_records", "ready": True, "status": "available"},
            {"item": "resistance_test_records", "ready": True, "status": "available_preliminary"},
            {"item": "full_row_level_dates", "ready": False, "status": "missing_month_year"},
            {"item": "site_gps", "ready": False, "status": "missing"},
            {"item": "resistance_denominator_protocol", "ready": False, "status": "needs_pi_lab_confirmation"},
            {"item": "malaria_action_data", "ready": False, "status": "requires_formal_access_or_pilot_collection"},
        ],
        ["item", "ready", "status"],
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


def main() -> None:
    mosquito = build_mosquito()
    resistance = build_resistance()
    build_outputs(mosquito, resistance)
    print(f"mosquito_rows={len(mosquito)}")
    print(f"resistance_rows={len(resistance)}")


if __name__ == "__main__":
    main()

