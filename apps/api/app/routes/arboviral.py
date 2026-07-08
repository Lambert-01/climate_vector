from __future__ import annotations

from fastapi import APIRouter

from app.services.csv_store import read_csv


router = APIRouter(tags=["arboviral"])


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
