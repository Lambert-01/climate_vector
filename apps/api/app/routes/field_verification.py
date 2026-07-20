from __future__ import annotations

import json
import uuid
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import Principal, require_roles
from app.models import FieldVerificationRecord
from app.services.audit import add_audit_event


router = APIRouter(tags=["field-verification"])
ROOT = Path(__file__).resolve().parents[4]
STORE_PATH = ROOT / "data" / "processed" / "field_verifications.json"

_VALID_VF_STATUSES = {
    "pending", "in_progress", "data_collected", "larvae_confirmed",
    "larvae_not_found", "adults_collected", "completed", "escalated",
}
_IN_MEMORY_VERIFICATIONS: list[dict] = []


class FieldVerificationIn(BaseModel):
    alert_id: str | None = Field(default=None, max_length=120)
    district: str = Field(min_length=2, max_length=80)
    site_name: str | None = Field(default=None, max_length=160)
    reason_for_visit: str = Field(min_length=3, max_length=1000)
    climate_trigger: str | None = Field(default=None, max_length=500)
    suspected_vector_group: str | None = Field(default=None, max_length=120)
    suspected_breeding_source: str | None = Field(default=None, max_length=500)
    checklist_items: str | None = Field(default=None, max_length=4000)
    notes: str | None = Field(default=None, max_length=2000)


class FieldVerificationUpdate(BaseModel):
    status: str | None = None
    gps_latitude: float | None = Field(default=None, ge=-12, le=6)
    gps_longitude: float | None = Field(default=None, ge=27, le=36)
    photo_notes: str | None = Field(default=None, max_length=1000)
    larval_inspection_result: str | None = Field(default=None, max_length=1000)
    adult_collection_result: str | None = Field(default=None, max_length=1000)
    community_observation: str | None = Field(default=None, max_length=1000)
    action_taken: str | None = Field(default=None, max_length=1000)
    final_status: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def validate_status(self):
        if self.status is not None and self.status not in _VALID_VF_STATUSES:
            allowed = ", ".join(sorted(_VALID_VF_STATUSES))
            raise ValueError(f"Invalid status. Must be one of: {allowed}")
        return self


def _row_dict(row: FieldVerificationRecord) -> dict:
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}


def _load_fallback() -> list[dict]:
    if _IN_MEMORY_VERIFICATIONS:
        return _IN_MEMORY_VERIFICATIONS
    if not STORE_PATH.exists():
        return _IN_MEMORY_VERIFICATIONS
    try:
        payload = json.loads(STORE_PATH.read_text(encoding="utf-8"))
        if isinstance(payload, list):
            _IN_MEMORY_VERIFICATIONS.extend(payload)
    except (OSError, json.JSONDecodeError):
        _IN_MEMORY_VERIFICATIONS.clear()
    return _IN_MEMORY_VERIFICATIONS


def _save_fallback() -> None:
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STORE_PATH.write_text(json.dumps(_IN_MEMORY_VERIFICATIONS, indent=2, default=str), encoding="utf-8")


@router.get("/field-verifications")
async def list_verifications(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        rows = (
            await db.execute(
                select(FieldVerificationRecord).order_by(FieldVerificationRecord.created_date.desc())
            )
        ).scalars().all()
        return {"items": [_row_dict(row) for row in rows], "source": "database"}
    except Exception:
        await db.rollback()
        return {
            "items": _load_fallback(),
            "source": "json_fallback",
            "governance": "Offline fallback only; production records should persist in PostgreSQL.",
        }


@router.post("/field-verifications", status_code=201)
async def create_verification(
    payload: FieldVerificationIn,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles("admin", "field_officer", "technical_reviewer")),
) -> dict:
    row = FieldVerificationRecord(
        verification_id=str(uuid.uuid4()),
        status="pending",
        created_date=date.today(),
        **payload.model_dump(),
    )
    try:
        db.add(row)
        add_audit_event(
            db,
            action="create",
            table_name="field_verification_records",
            record_id=row.verification_id,
            user_id=principal.user_id if principal.auth_method == "jwt" else None,
            new_value=payload.model_dump(),
        )
        await db.commit()
        await db.refresh(row)
        return {**_row_dict(row), "source": "database"}
    except Exception:
        await db.rollback()
        item = _row_dict(row)
        _load_fallback().insert(0, item)
        _save_fallback()
        return {**item, "source": "json_fallback"}


@router.get("/field-verifications/{verification_id}")
async def get_verification(verification_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    try:
        row = await db.get(FieldVerificationRecord, verification_id)
        if row:
            return {**_row_dict(row), "source": "database"}
    except Exception:
        await db.rollback()
    item = next((row for row in _load_fallback() if row["verification_id"] == verification_id), None)
    if not item:
        raise HTTPException(404, "Verification not found")
    return {**item, "source": "json_fallback"}


@router.patch("/field-verifications/{verification_id}")
async def update_verification(
    verification_id: str,
    payload: FieldVerificationUpdate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles("admin", "field_officer", "technical_reviewer")),
) -> dict:
    updates = payload.model_dump(exclude_unset=True)
    try:
        row = await db.get(FieldVerificationRecord, verification_id)
        if row:
            candidate_lat = updates.get("gps_latitude", row.gps_latitude)
            candidate_lon = updates.get("gps_longitude", row.gps_longitude)
            if (candidate_lat is None) != (candidate_lon is None):
                raise HTTPException(422, "Latitude and longitude must be supplied together.")
            old_value = {key: getattr(row, key) for key in updates}
            if updates.get("status") == "completed":
                updates["completed_date"] = date.today()
            for key, value in updates.items():
                setattr(row, key, value)
            add_audit_event(
                db,
                action="update",
                table_name="field_verification_records",
                record_id=verification_id,
                user_id=principal.user_id if principal.auth_method == "jwt" else None,
                old_value=old_value,
                new_value=updates,
            )
            await db.commit()
            await db.refresh(row)
            return {**_row_dict(row), "source": "database"}
    except HTTPException:
        raise
    except Exception:
        await db.rollback()

    item = next((row for row in _load_fallback() if row["verification_id"] == verification_id), None)
    if not item:
        raise HTTPException(404, "Verification not found")
    candidate_lat = updates.get("gps_latitude", item.get("gps_latitude"))
    candidate_lon = updates.get("gps_longitude", item.get("gps_longitude"))
    if (candidate_lat is None) != (candidate_lon is None):
        raise HTTPException(422, "Latitude and longitude must be supplied together.")
    if updates.get("status") == "completed":
        updates["completed_date"] = str(date.today())
    item.update(updates)
    _save_fallback()
    return {**item, "source": "json_fallback"}


@router.get("/field-verifications/checklist/templates")
def verification_checklist_templates() -> dict:
    return {
        "items": [
            {
                "template_id": "larval_source_inspection",
                "name": "Larval Source Inspection",
                "description": "Verify and quantify potential Aedes breeding sources.",
                "items": [
                    "Confirm GPS and site identity",
                    "Photograph the source with consent",
                    "Record inspected and positive containers",
                    "Collect and label larvae when present",
                    "Record source type, water condition and action",
                ],
                "status": "pilot_data_pending",
            },
            {
                "template_id": "aedes_adult_trap",
                "name": "Aedes Adult Trap Check",
                "description": "Retrieve an adult trap with complete effort and specimen records.",
                "items": [
                    "Record deployment and retrieval times",
                    "Confirm BG-Sentinel or aspirator method",
                    "Record trap-hours and adults collected",
                    "Preserve and label specimens",
                    "Record identification and laboratory transfer",
                ],
                "status": "pilot_data_pending",
            },
            {
                "template_id": "community_source_report",
                "name": "Community Breeding-Source Report",
                "description": "Review a consented community observation without collecting clinical data.",
                "items": [
                    "Confirm consent",
                    "Record source and water presence",
                    "Record larvae observed without clinical diagnosis",
                    "Document source-reduction action",
                    "Refer the report for technical review",
                ],
                "status": "pilot_data_pending",
            },
        ],
        "governance": "Pilot templates guide prospective collection and do not represent completed results.",
    }
