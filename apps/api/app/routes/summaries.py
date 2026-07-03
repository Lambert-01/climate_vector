from __future__ import annotations

from fastapi import APIRouter

from app.services.csv_store import read_csv


router = APIRouter(tags=["summaries"])


@router.get("/summaries/mosquito-districts")
def mosquito_districts() -> dict[str, object]:
    return {"items": read_csv("outputs/tables/mosquito_district_raw_frequency.csv")}


@router.get("/summaries/resistance-tests")
def resistance_tests() -> dict[str, object]:
    return {"items": read_csv("outputs/tables/resistance_insecticide_tested_raw_frequency.csv")}


@router.get("/summaries/resistance-deaths")
def resistance_deaths() -> dict[str, object]:
    return {"items": read_csv("outputs/tables/resistance_death_summary_by_insecticide.csv")}

