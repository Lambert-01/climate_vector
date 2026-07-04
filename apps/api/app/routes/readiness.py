from __future__ import annotations

from fastapi import APIRouter

from app.services.csv_store import read_csv


router = APIRouter(tags=["readiness"])


SOURCE_GUIDANCE = {
    "official latitude and longitude for every sentinel site": {
        "where_to_get": "PI field team, district entomology officers, original trap/sentinel-site registry, GPS field forms.",
        "responsible_partner": "PI / field coordinator",
        "acceptable_file": "CSV or Excel: site_name, district, latitude, longitude, coordinate_source, coordinate_quality.",
        "dashboard_use": "Validated site maps, site-level climate extraction, spatial risk modelling.",
    },
    "full date: day, month, year": {
        "where_to_get": "Original field collection sheets, Kobo/ODK exports, lab receiving logbooks, trap deployment/retrieval logs.",
        "responsible_partner": "PI / data manager / field team",
        "acceptable_file": "CSV or Excel: sample_id, site_name, collection_date, collection_method.",
        "dashboard_use": "Rainfall/temperature lags, seasonality, forecasting, time-series figures.",
    },
    "mosquito count or abundance per sample": {
        "where_to_get": "Trap count forms, larval dipping records, adult collection logbooks, lab species-count sheets.",
        "responsible_partner": "Entomology lab / field surveillance team",
        "acceptable_file": "CSV or Excel: sample_id, species, life_stage, count.",
        "dashboard_use": "Abundance graphs, negative-binomial/GAM models, hotspot ranking.",
    },
    "sampling effort and method": {
        "where_to_get": "Field protocols, trap-night records, dipping effort logs, number of collectors/hours.",
        "responsible_partner": "Field coordinator / entomology team",
        "acceptable_file": "CSV or Excel: sample_id, method, effort_type, effort_value.",
        "dashboard_use": "Fair comparison between sites, effort-adjusted abundance models.",
    },
    "positive and negative habitat status": {
        "where_to_get": "Larval habitat inspection forms, breeding-site survey sheets, negative-site survey logs.",
        "responsible_partner": "Field ecology team",
        "acceptable_file": "CSV or Excel: survey_id, site_name, date, habitat_type, habitat_positive.",
        "dashboard_use": "Presence/absence maps, occurrence models, validation of suitability signals.",
    },
    "number exposed denominator": {
        "where_to_get": "WHO/CDC susceptibility test bench sheets, bottle/bioassay replicate forms, lab notebooks.",
        "responsible_partner": "Entomology lab / resistance-testing lead",
        "acceptable_file": "CSV or Excel: replicate_id, insecticide, number_exposed, number_dead_24h.",
        "dashboard_use": "Mortality rates and resistance-status classification.",
    },
    "control mortality and protocol": {
        "where_to_get": "WHO/CDC assay records, control tube/bottle sheets, lab SOPs, species confirmation sheets.",
        "responsible_partner": "Entomology lab / resistance-testing lead",
        "acceptable_file": "CSV or Excel: replicate_id, protocol, control_mortality, species, test_date.",
        "dashboard_use": "Abbott correction, valid/invalid assay flag, final resistance interpretation.",
    },
    "insecticide class, timing, dose/frequency, and field location": {
        "where_to_get": "RAB/agriculture extension records, farm pesticide-use surveys, agro-dealer logs, district crop-protection records.",
        "responsible_partner": "RAB / district agriculture office / PI exposure survey team",
        "acceptable_file": "CSV or Excel: site, date, insecticide, chemical_class, dose_or_frequency, field_latitude, field_longitude.",
        "dashboard_use": "Agricultural exposure score and resistance selection-pressure model.",
    },
}


@router.get("/readiness")
def readiness() -> dict[str, object]:
    rows = read_csv("data/processed/data_readiness_summary.csv")
    return {"items": rows}


@router.get("/readiness/missing-data-sources")
def missing_data_sources() -> dict[str, object]:
    request_rows = read_csv("outputs/reports/pi_missing_data_request.csv")
    enriched = []
    for row in request_rows:
        item = row.get("missing_item", "")
        guide = SOURCE_GUIDANCE.get(item, {})
        enriched.append(
            {
                **row,
                "where_to_get": guide.get("where_to_get", "PI/project partner confirmation required."),
                "responsible_partner": guide.get("responsible_partner", "PI / project data manager"),
                "acceptable_file": guide.get("acceptable_file", "Structured CSV or Excel with stable row IDs."),
                "dashboard_use": guide.get("dashboard_use", "Improves validation and modelling readiness."),
            }
        )
    return {
        "items": enriched,
        "message": "These sources should be requested from PI/field/lab/institutional partners. Public climate data cannot replace these outcome variables.",
    }
