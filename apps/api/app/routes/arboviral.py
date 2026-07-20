from __future__ import annotations

from collections import Counter

from fastapi import APIRouter

from app.services.csv_store import read_csv


router = APIRouter(tags=["arboviral"])


def _f(v) -> float:
    try:
        return float(str(v).strip())
    except (TypeError, ValueError):
        return 0.0


def _i(v) -> int:
    return int(_f(v))


def _status_variant(status: str) -> str:
    text = str(status or "").lower()
    if any(word in text for word in ("usable", "validated", "available", "ready", "mapping")):
        return "ready"
    if any(word in text for word in ("partial", "downloaded", "context", "planned")):
        return "partial"
    return "required"


@router.get("/arboviral/overview")
def arboviral_overview() -> dict:
    climate = read_csv("data/processed/context/great_lakes_climate_summary.csv")
    vectors = read_csv("data/processed/context/great_lakes_vector_occurrence_summary.csv")
    diseases = read_csv("data/processed/context/arboviral_disease_profiles.csv")
    readiness = read_csv("data/processed/context/arboviral_readiness_layers.csv")
    climate_signals = [row for row in climate if "high" in str(row.get("climate_signal", ""))]
    aedes_records = sum(
        int(float(row.get("records") or 0))
        for row in vectors
        if str(row.get("species", "")).lower().startswith("aedes")
    )
    culex_records = sum(
        int(float(row.get("records") or 0))
        for row in vectors
        if str(row.get("species", "")).lower().startswith("culex")
    )
    return {
        "summary": {
            "regional_points": len(climate),
            "high_climate_context_points": len(climate_signals),
            "vector_species_groups": len(vectors),
            "aedes_occurrence_records": aedes_records,
            "culex_occurrence_records": culex_records,
            "disease_profiles": len(diseases),
            "readiness_layers": len(readiness),
        },
        "disease_profiles": diseases,
        "readiness_layers": readiness,
        "governance": "Great Lakes arboviral preparedness context. Outputs guide surveillance planning and field verification; they are not confirmed outbreak predictions.",
    }


@router.get("/arboviral/intelligence")
def arboviral_intelligence() -> dict:
    """Policy-ready regional context bundle for the DengueEW-GL dashboard."""
    validation = read_csv("data/processed/data_source_validation_summary.csv")
    sentinel = read_csv("data/processed/context/sentinel_sites_33.csv")
    climate = read_csv("data/processed/context/great_lakes_climate_summary.csv")
    vectors = read_csv("data/processed/context/great_lakes_vector_occurrence_summary.csv")
    readiness = read_csv("data/processed/context/arboviral_readiness_layers.csv")
    diseases = read_csv("data/processed/context/arboviral_disease_profiles.csv")
    district_features = read_csv("data/processed/public_data_district_features.csv")
    pi_ecology = read_csv("data/processed/mosquito_ecology_preliminary.csv")
    pi_susceptibility = read_csv("data/processed/resistance_test_replicates_preliminary.csv")

    status_counts = Counter(_status_variant(row.get("status", "")) for row in validation)
    file_records = sum(_i(row.get("records_or_files")) for row in validation)
    mapped_sites = [
        row for row in sentinel
        if _f(row.get("latitude")) and _f(row.get("longitude"))
    ]
    duplicate_site_names = [
        name for name, count in Counter(
            str(row.get("sentinel_name") or row.get("site_label") or "").strip().lower()
            for row in sentinel
            if str(row.get("sentinel_name") or row.get("site_label") or "").strip()
        ).items()
        if count > 1
    ]

    high_climate = [
        row for row in climate
        if "high" in str(row.get("climate_signal", "")).lower()
    ]
    top_climate = sorted(
        climate,
        key=lambda row: _f(row.get("rainfall_latest_30d_mm")),
        reverse=True,
    )[:5]
    aedes_records = sum(
        _i(row.get("records"))
        for row in vectors
        if str(row.get("species", "")).lower().startswith("aedes")
    )
    culex_records = sum(
        _i(row.get("records"))
        for row in vectors
        if str(row.get("species", "")).lower().startswith("culex")
    )
    anopheles_records = sum(
        _i(row.get("records"))
        for row in vectors
        if str(row.get("species", "")).lower().startswith("anopheles")
    )

    district_top = sorted(
        district_features,
        key=lambda row: (_f(row.get("rainfall_mean_daily_mm")), _f(row.get("tmean_c_mean"))),
        reverse=True,
    )[:8]

    data_validation_cards = [
        {
            "domain": "PI vector ecology",
            "status": "usable_descriptive",
            "records": len(pi_ecology),
            "result": "Habitat and site evidence can support field-verification prioritisation.",
            "limitation": "Full dates, counts, sampling effort, and official GPS are incomplete.",
        },
        {
            "domain": "PI susceptibility context",
            "status": "usable_preliminary",
            "records": len(pi_susceptibility),
            "result": "Vector-control context can be summarized for preparedness planning.",
            "limitation": "Protocol, denominator, and control mortality still need PI confirmation.",
        },
        {
            "domain": "Lecturer sentinel registry",
            "status": "usable_mapping",
            "records": len(mapped_sites),
            "result": "Sentinel map now supports site-level visualization and verification workflow.",
            "limitation": "Administrative metadata and official coordinate confirmation remain useful.",
        },
        {
            "domain": "Great Lakes climate context",
            "status": "usable_regional_context",
            "records": len(climate),
            "result": "Regional rainfall, temperature, and humidity context available for readiness signals.",
            "limitation": "Regional points are not disease surveillance outcomes.",
        },
        {
            "domain": "Public vector occurrence",
            "status": "usable_context",
            "records": len(vectors),
            "result": "Aedes, Culex, and Anopheles occurrence context supports vector-scope framing.",
            "limitation": "Presence-only data are biased and not abundance or transmission proof.",
        },
        {
            "domain": "Official arboviral outcomes",
            "status": "formal_access_required",
            "records": 0,
            "result": "Not used in the current system; no fake disease dashboard is generated.",
            "limitation": "RBC/MoH approval is required for validation and prediction claims.",
        },
    ]

    action_queue = [
        {
            "priority": "high",
            "action": "Validate sentinel registry",
            "owner": "PI / field team",
            "evidence": f"{len(mapped_sites)} lecturer-provided WKT coordinates loaded",
            "decision_use": "Unlock site maps, climate extraction, and field verification planning.",
        },
        {
            "priority": "high",
            "action": "Start Aedes/Culex pilot surveillance",
            "owner": "Entomology team",
            "evidence": f"{aedes_records} Aedes and {culex_records} Culex public occurrence records in regional context",
            "decision_use": "Convert regional context into local arboviral vector evidence.",
        },
        {
            "priority": "high",
            "action": "Request arboviral/febrile illness data",
            "owner": "RBC/MoH data governance",
            "evidence": "Current system has no official outcome data and does not fabricate it",
            "decision_use": "Enable validation, threshold calibration, and stronger policy reporting.",
        },
        {
            "priority": "medium",
            "action": "Extract surface water and urban exposure",
            "owner": "Data engineering",
            "evidence": "CHIRPS, landcover, elevation, WorldClim, and ERA5 files are locally available",
            "decision_use": "Improve habitat, RVF wetness, and urban Aedes readiness layers.",
        },
        {
            "priority": "medium",
            "action": "Confirm susceptibility protocols",
            "owner": "PI / lab team",
            "evidence": f"{len(pi_susceptibility)} preliminary susceptibility rows loaded",
            "decision_use": "Make vector-control context interpretable and audit-ready.",
        },
    ]

    return {
        "mission": "Climate-informed arboviral preparedness and vector intelligence for the African Great Lakes region.",
        "governance": "Current outputs are policy preparedness and field-verification intelligence. They are not official outbreak alerts or confirmed incidence forecasts.",
        "summary": {
            "data_sources": len(validation),
            "ready_or_usable_sources": status_counts["ready"],
            "partial_context_sources": status_counts["partial"],
            "formal_or_required_sources": status_counts["required"],
            "records_or_files_indexed": file_records,
            "sentinel_sites": len(sentinel),
            "mapped_sentinel_sites": len(mapped_sites),
            "great_lakes_climate_points": len(climate),
            "high_climate_context_points": len(high_climate),
            "aedes_records": aedes_records,
            "culex_records": culex_records,
            "anopheles_records": anopheles_records,
            "disease_profiles": len(diseases),
            "readiness_layers": len(readiness),
        },
        "data_validation_cards": data_validation_cards,
        "source_registry": validation,
        "sentinel_sites": sentinel,
        "sentinel_quality": {
            "mapped": len(mapped_sites),
            "total": len(sentinel),
            "coverage_pct": round((len(mapped_sites) / max(len(sentinel), 1)) * 100, 1),
            "duplicate_site_names": duplicate_site_names,
            "coordinate_source": "Map- 33 sentinel.xls WKT",
            "quality_note": "Coordinates are lecturer-provided and usable for MVP mapping; PI confirmation is still recommended before official reporting.",
        },
        "regional_climate": {
            "items": climate,
            "top_wetness_points": top_climate,
            "high_signal_locations": high_climate,
        },
        "vector_context": {
            "items": vectors,
            "aedes_records": aedes_records,
            "culex_records": culex_records,
            "anopheles_records": anopheles_records,
            "interpretation": "Aedes/Culex records support the arboviral pivot; Anopheles data support legacy vector-infrastructure and co-occurrence context.",
        },
        "district_context": district_top,
        "disease_profiles": diseases,
        "readiness_layers": readiness,
        "action_queue": action_queue,
    }


@router.get("/arboviral/great-lakes-climate")
def great_lakes_climate() -> dict:
    return {
        "items": read_csv("data/processed/context/great_lakes_climate_summary.csv"),
        "source": "NASA POWER daily climate, 2021-2025",
        "use_boundary": "Regional dashboard points; not lecturer sentinel-site GPS.",
    }


@router.get("/arboviral/vector-occurrences")
def vector_occurrences() -> dict:
    return {
        "items": read_csv("data/processed/context/great_lakes_vector_occurrence_summary.csv"),
        "source": "GBIF public vector occurrence context",
        "use_boundary": "Presence-only records; not local surveillance proof.",
    }


@router.get("/arboviral/disease-profiles")
def disease_profiles() -> dict:
    return {"items": read_csv("data/processed/context/arboviral_disease_profiles.csv")}


@router.get("/arboviral/readiness")
def arboviral_readiness() -> dict:
    return {"items": read_csv("data/processed/context/arboviral_readiness_layers.csv")}


@router.get("/arboviral/scoring")
def arboviral_scoring() -> dict:
    """Climate suitability, Aedes preparedness, RVF watch, and data confidence indices."""
    climate = read_csv("data/processed/context/great_lakes_climate_summary.csv")
    vectors = read_csv("data/processed/context/great_lakes_vector_occurrence_summary.csv")

    def _f(v) -> float:
        try:
            return float(str(v).strip())
        except (TypeError, ValueError):
            return 0.0

    # --- Climate suitability scores per regional point ---
    climate_scores = []
    for row in climate:
        rain30 = _f(row.get("rainfall_latest_30d_mm"))
        tmean = _f(row.get("tmean_mean_c"))
        humidity = _f(row.get("humidity_mean_pct"))
        # Rainfall index: 0-1, optimal 80-200 mm/30d
        rain_idx = min(rain30 / 200.0, 1.0) if rain30 <= 200 else max(0.0, 1.0 - (rain30 - 200) / 300)
        # Temperature index: 0-1, optimal 20-30 C for Aedes
        if 20 <= tmean <= 30:
            temp_idx = 1.0
        elif tmean < 20:
            temp_idx = max(0.0, (tmean - 10) / 10)
        else:
            temp_idx = max(0.0, 1.0 - (tmean - 30) / 10)
        # Humidity index: 0-1, optimal >70%
        hum_idx = min(humidity / 80.0, 1.0)
        suitability = round((rain_idx * 0.4 + temp_idx * 0.4 + hum_idx * 0.2), 3)
        signal = row.get("climate_signal", "")
        if "high" in signal:
            level = "high"
        elif "moderate" in signal:
            level = "moderate"
        else:
            level = "low"
        climate_scores.append({
            "location": row.get("location"),
            "country": row.get("country"),
            "climate_suitability_index": suitability,
            "rainfall_index": round(rain_idx, 3),
            "temperature_index": round(temp_idx, 3),
            "humidity_index": round(hum_idx, 3),
            "suitability_level": level,
            "rainfall_30d_mm": rain30,
            "tmean_c": tmean,
            "humidity_pct": humidity,
            "confidence": "context-only",
            "use_boundary": "Climate screening proxy; not validated vector emergence prediction.",
        })

    # --- Aedes-borne preparedness index ---
    aedes_records = sum(
        _f(row.get("records"))
        for row in vectors
        if str(row.get("species", "")).lower().startswith("aedes")
    )
    aedes_occurrence_idx = min(aedes_records / 500.0, 1.0)
    high_climate_points = sum(1 for s in climate_scores if s["suitability_level"] == "high")
    climate_context_idx = high_climate_points / max(len(climate_scores), 1)
    aedes_preparedness_index = round((aedes_occurrence_idx * 0.35 + climate_context_idx * 0.65), 3)
    aedes_level = "high" if aedes_preparedness_index >= 0.6 else "moderate" if aedes_preparedness_index >= 0.35 else "low"

    # --- RVF One Health watch index ---
    culex_records = sum(
        _f(row.get("records"))
        for row in vectors
        if str(row.get("species", "")).lower().startswith("culex")
    )
    culex_idx = min(culex_records / 100.0, 1.0)
    max_rain30 = max((_f(r.get("rainfall_latest_30d_mm")) for r in climate), default=0)
    rvf_rain_idx = min(max_rain30 / 250.0, 1.0)
    rvf_watch_index = round((rvf_rain_idx * 0.5 + culex_idx * 0.3 + climate_context_idx * 0.2), 3)
    rvf_level = "watch" if rvf_watch_index >= 0.5 else "monitor" if rvf_watch_index >= 0.3 else "routine"

    # --- Data confidence index ---
    confidence_components = [
        {"component": "Great Lakes climate points", "score": 1.0, "status": "ready", "note": "NASA POWER 2021-2025 downloaded"},
        {"component": "GBIF vector occurrence", "score": 0.7, "status": "context-only", "note": "Presence-only; not local surveillance"},
        {"component": "PI vector ecology records", "score": 0.6, "status": "context-only", "note": "Dates, GPS, counts incomplete"},
        {"component": "PI susceptibility records", "score": 0.5, "status": "context-only", "note": "Denominator/protocol/control unconfirmed"},
        {"component": "Sentinel site coordinates", "score": 0.8, "status": "lecturer-provided", "note": "WKT from Map-33 sentinel.xls"},
        {"component": "Arboviral case data", "score": 0.0, "status": "formal-access-required", "note": "RBC/MoH approval needed"},
        {"component": "Aedes/Culex field surveillance", "score": 0.0, "status": "pilot-required", "note": "Prospective collection needed"},
        {"component": "Livestock/RVF event data", "score": 0.0, "status": "pilot-required", "note": "Animal health partner needed"},
    ]
    overall_confidence = round(
        sum(c["score"] for c in confidence_components) / len(confidence_components), 3
    )

    return {
        "climate_suitability_scores": climate_scores,
        "aedes_preparedness": {
            "index": aedes_preparedness_index,
            "level": aedes_level,
            "aedes_occurrence_index": round(aedes_occurrence_idx, 3),
            "climate_context_index": round(climate_context_idx, 3),
            "aedes_gbif_records": int(aedes_records),
            "high_climate_points": high_climate_points,
            "recommended_action": "Prioritize urban/peri-urban Aedes surveillance and source-reduction planning in high-climate-signal locations.",
            "data_gaps": ["confirmed cases", "ovitrap/container surveys", "Aedes infection testing", "urban water-storage data"],
            "confidence": "context-only",
            "use_boundary": "Preparedness screening; not confirmed dengue/chikungunya/Zika prediction.",
        },
        "rvf_watch": {
            "index": rvf_watch_index,
            "level": rvf_level,
            "rainfall_index": round(rvf_rain_idx, 3),
            "culex_occurrence_index": round(culex_idx, 3),
            "culex_gbif_records": int(culex_records),
            "max_regional_rain30d_mm": round(max_rain30, 1),
            "recommended_action": "Coordinate One Health partners when heavy rainfall and wetness signals rise; verify livestock health events.",
            "data_gaps": ["livestock density", "animal abortion/mortality events", "RVF lab confirmation", "flood/water extraction"],
            "confidence": "context-only",
            "use_boundary": "One Health watch signal; not validated RVF outbreak prediction.",
        },
        "data_confidence": {
            "overall_index": overall_confidence,
            "components": confidence_components,
            "interpretation": "Index reflects current data completeness. Values below 0.5 indicate pilot-required or formal-access-required data.",
        },
        "governance": "All indices are climate-vector preparedness screening proxies. They support field verification planning and partner coordination. They do not constitute confirmed arboviral outbreak prediction.",
    }


@router.get("/arboviral/vector-taxonomy")
def vector_taxonomy() -> dict:
    """Vector group classification table for arboviral preparedness context."""
    return {
        "items": [
            {
                "vector_group": "Aedes",
                "key_species": "Aedes aegypti, Aedes albopictus",
                "arboviral_relevance": "Dengue, Chikungunya, Zika, Yellow fever",
                "habitat_context": "Urban/peri-urban containers, water storage, tyres, flower pots",
                "climate_drivers": "Temperature 20-35 C, rainfall, humidity >60%, urban built-up",
                "gbif_records_region": "329",
                "surveillance_priority": "high",
                "current_evidence": "GBIF occurrence context; no local ovitrap/container survey yet",
                "pilot_need": "Ovitrap positivity, container index, adult trap counts, species confirmation",
            },
            {
                "vector_group": "Culex",
                "key_species": "Culex quinquefasciatus",
                "arboviral_relevance": "Rift Valley fever (secondary), West Nile virus context",
                "habitat_context": "Stagnant water, wetlands, rice paddies, drainage channels",
                "climate_drivers": "Heavy rainfall, flooding, surface water accumulation",
                "gbif_records_region": "51",
                "surveillance_priority": "moderate",
                "current_evidence": "GBIF occurrence context; no local trap data yet",
                "pilot_need": "Adult trap counts, species confirmation, RVF One Health coordination",
            },
            {
                "vector_group": "Anopheles",
                "key_species": "Anopheles gambiae, Anopheles funestus",
                "arboviral_relevance": "Malaria (not arboviral); included for completeness and co-occurrence context",
                "habitat_context": "Temporary pools, rice paddies, slow-moving water",
                "climate_drivers": "Rainfall, temperature, humidity",
                "gbif_records_region": "6000+",
                "surveillance_priority": "context-only",
                "current_evidence": "GBIF occurrence context; PI ecology dataset includes Anopheles records",
                "pilot_need": "Not primary arboviral target; retain for co-occurrence and land-cover context",
            },
        ],
        "use_boundary": "Vector taxonomy is based on GBIF public occurrence context and published ecology. Local species confirmation requires field surveillance.",
    }


@router.get("/arboviral/partner-governance")
def partner_governance() -> dict:
    """Partner data governance status for each formal dataset domain."""
    return {
        "items": [
            {
                "dataset": "RBC/MoH arboviral / febrile illness data",
                "partner": "Rwanda Biomedical Centre / Ministry of Health",
                "governance_status": "not_requested",
                "data_type": "Confirmed/suspected arboviral cases, febrile illness indicators, lab confirmation",
                "required_for": "Validation, surveillance outcome modelling, early-action thresholds",
                "next_step": "Initiate formal data-sharing agreement during funded pilot",
            },
            {
                "dataset": "Aedes/Culex field surveillance",
                "partner": "PI field team / entomology lab",
                "governance_status": "pilot_required",
                "data_type": "Ovitrap positivity, container index, adult trap counts, species confirmation",
                "required_for": "Aedes preparedness index validation, vector presence/absence modelling",
                "next_step": "Design prospective surveillance protocol and deploy during pilot",
            },
            {
                "dataset": "Livestock / RVF event data",
                "partner": "Rwanda Agriculture Board / animal health partners",
                "governance_status": "not_requested",
                "data_type": "Livestock density, abortion/mortality events, RVF lab confirmation",
                "required_for": "RVF One Health watch validation, livestock-human interface analysis",
                "next_step": "Identify animal health partner and initiate One Health coordination",
            },
            {
                "dataset": "Yellow fever vaccination coverage",
                "partner": "RBC / MoH immunisation programme",
                "governance_status": "not_requested",
                "data_type": "District/site vaccination coverage, campaign records",
                "required_for": "Yellow fever preparedness targeting, population susceptibility context",
                "next_step": "Request through MoH immunisation data-sharing channel",
            },
            {
                "dataset": "Official sentinel site metadata",
                "partner": "PI / district health offices",
                "governance_status": "partial",
                "data_type": "Official GPS, facility names, catchment linkage, administrative harmonisation",
                "required_for": "Validated site maps, site-level climate extraction, spatial modelling",
                "next_step": "PI confirmation of WKT coordinates and official facility names",
            },
            {
                "dataset": "NISR population and socioeconomic context",
                "partner": "National Institute of Statistics of Rwanda",
                "governance_status": "not_requested",
                "data_type": "Official population denominators, socioeconomic indicators",
                "required_for": "Exposure denominators, incidence rate calculation, equity analysis",
                "next_step": "Formal data request through NISR access portal",
            },
            {
                "dataset": "Intervention and response logs",
                "partner": "District health teams / vector control programme",
                "governance_status": "not_requested",
                "data_type": "Spray campaigns, source reduction activities, response dates and coverage",
                "required_for": "Action evaluation, response effectiveness, policy feedback loop",
                "next_step": "Collect prospectively during pilot using digital action log form",
            },
        ],
        "governance_note": "Formal datasets require institutional approval and data-sharing agreements. The current platform is built on public and PI-provided data only. Partner integration is the primary Phase 2 objective.",
    }
