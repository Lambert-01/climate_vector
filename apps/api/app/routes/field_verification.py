from __future__ import annotations

import uuid
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Alert

router = APIRouter(tags=["field-verification"])


class FieldVerificationIn(BaseModel):
    alert_id: str | None = None
    district: str
    site_name: str | None = None
    reason_for_visit: str
    climate_trigger: str | None = None
    suspected_vector_group: str | None = None
    suspected_breeding_source: str | None = None
    checklist_items: str | None = None
    notes: str | None = None


class FieldVerificationUpdate(BaseModel):
    status: str | None = None
    gps_latitude: float | None = None
    gps_longitude: float | None = None
    photo_notes: str | None = None
    larval_inspection_result: str | None = None
    adult_collection_result: str | None = None
    community_observation: str | None = None
    action_taken: str | None = None
    final_status: str | None = None
    notes: str | None = None


_VALID_VF_STATUSES = [
    "pending", "in_progress", "data_collected",
    "larvae_confirmed", "larvae_not_found",
    "adults_collected", "completed", "escalated",
]


_IN_MEMORY_VERIFICATIONS: list[dict] = []


@router.get("/field-verifications")
def list_verifications() -> dict:
    return {"items": _IN_MEMORY_VERIFICATIONS, "source": "in_memory"}


@router.post("/field-verifications", status_code=201)
def create_verification(payload: FieldVerificationIn) -> dict:
    verification = {
        "verification_id": str(uuid.uuid4()),
        "alert_id": payload.alert_id,
        "district": payload.district,
        "site_name": payload.site_name,
        "reason_for_visit": payload.reason_for_visit,
        "climate_trigger": payload.climate_trigger,
        "suspected_vector_group": payload.suspected_vector_group,
        "suspected_breeding_source": payload.suspected_breeding_source,
        "checklist_items": payload.checklist_items,
        "notes": payload.notes,
        "status": "pending",
        "gps_latitude": None,
        "gps_longitude": None,
        "photo_notes": None,
        "larval_inspection_result": None,
        "adult_collection_result": None,
        "community_observation": None,
        "action_taken": None,
        "final_status": None,
        "created_date": str(date.today()),
        "completed_date": None,
    }
    _IN_MEMORY_VERIFICATIONS.insert(0, verification)
    return verification


@router.get("/field-verifications/{verification_id}")
def get_verification(verification_id: str) -> dict:
    v = next((v for v in _IN_MEMORY_VERIFICATIONS if v["verification_id"] == verification_id), None)
    if not v:
        raise HTTPException(404, "Verification not found")
    return v


@router.patch("/field-verifications/{verification_id}")
def update_verification(verification_id: str, payload: FieldVerificationUpdate) -> dict:
    v = next((v for v in _IN_MEMORY_VERIFICATIONS if v["verification_id"] == verification_id), None)
    if not v:
        raise HTTPException(404, "Verification not found")
    updates = payload.model_dump(exclude_unset=True)
    if "status" in updates and updates["status"] not in _VALID_VF_STATUSES:
        raise HTTPException(422, f"Invalid status. Must be one of: {', '.join(_VALID_VF_STATUSES)}")
    if updates.get("status") == "completed":
        updates["completed_date"] = str(date.today())
    v.update(updates)
    return v


@router.get("/field-verifications/checklist/templates")
def verification_checklist_templates() -> dict:
    return {
        "items": [
            {
                "template_id": "larval_source_inspection",
                "name": "Larval Source Inspection",
                "description": "Standard checklist for breeding site verification",
                "items": [
                    "Arrive at site and confirm GPS coordinates",
                    "Photograph the site from multiple angles",
                    "Inspect all potential breeding containers/habitats",
                    "Record larval presence/absence for each container",
                    "Collect larval samples if positive",
                    "Record water source type and condition",
                    "Note nearby land use and human activity",
                    "Document community observations",
                    "Record action taken (source reduction, larviciding, referral)",
                ],
                "status": "pilot_data_pending",
            },
            {
                "template_id": "adult_trap_check",
                "name": "Adult Mosquito Trap Check",
                "description": "Checklist for adult mosquito collection and identification",
                "items": [
                    "Locate and retrieve trap (BG-Sentinel, CDC light, etc.)",
                    "Record trap deployment and retrieval dates/times",
                    "Photograph trap location",
                    "Preserve collected specimens",
                    "Record environmental conditions at trap site",
                    "Note any visible breeding sites nearby",
                    "Transport specimens to lab for identification",
                    "Record species identification results",
                ],
                "status": "pilot_data_pending",
            },
            {
                "template_id": "community_observation",
                "name": "Community Health Worker Observation",
                "description": "Community-level mosquito and disease observation form",
                "items": [
                    "Interview community health worker or household head",
                    "Record perceived mosquito density (high/medium/low)",
                    "Note peak biting times reported",
                    "Record recent illness with fever in the household",
                    "Identify potential breeding sites in the area",
                    "Document any recent rainfall or flooding",
                    "Record water storage practices",
                    "Note any vector control activities observed",
                ],
                "status": "pilot_data_pending",
            },
        ],
        "governance": "Checklist templates are operational designs for the proof-of-concept pilot. They guide field data collection and do not represent completed field results.",
    }
