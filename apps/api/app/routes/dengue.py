from __future__ import annotations

import json
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import (
    AedesSurveillanceRecord,
    Alert,
    CommunityReport,
    GenomicArtifact,
    GenomicSample,
    MelObservation,
    ModelEvaluation,
    ResponseAction,
    Site,
)
from app.services.csv_store import read_csv
from app.services.dengue_metrics import summarize_aedes_surveillance
from app.services.mathematical_framework import mathematical_framework
from app.services.audit import add_audit_event
from app.core.security import Principal, require_write_access, require_roles


router = APIRouter(tags=["dengue-pilot"])
ROOT = Path(__file__).resolve().parents[4]
FALLBACK_PATH = ROOT / "data" / "processed" / "dengue_pilot_operations.json"

REPORT_STATUSES = {"pending_review", "accepted", "verification_requested", "closed", "rejected"}
SURVEILLANCE_STATUSES = {"pending_review", "validated", "needs_correction", "excluded"}
SEQUENCING_STATUSES = {"not_started", "queued", "sequencing", "analysis", "complete", "failed"}
GENOMIC_RESULTS = {"not_tested", "pending", "negative", "positive", "inconclusive"}


@router.get("/dengue/mathematical-framework")
def dengue_mathematical_framework() -> dict:
    return mathematical_framework()


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _load_fallback() -> dict[str, list[dict]]:
    empty = {
        "community_reports": [],
        "aedes_surveillance": [],
        "genomic_samples": [],
        "model_evaluations": [],
        "mel_observations": [],
    }
    if not FALLBACK_PATH.exists():
        return empty
    try:
        loaded = json.loads(FALLBACK_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return empty
    return {key: loaded.get(key, []) for key in empty}


def _save_fallback(payload: dict[str, list[dict]]) -> None:
    FALLBACK_PATH.parent.mkdir(parents=True, exist_ok=True)
    FALLBACK_PATH.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")


class CommunityReportIn(BaseModel):
    reporter_role: Literal["community_health_worker", "environmental_health_officer", "teacher", "local_leader", "farmer", "community_member", "research_team"]
    district: str = Field(min_length=2, max_length=80)
    site_name: str | None = Field(default=None, max_length=160)
    latitude: float | None = Field(default=None, ge=-12, le=6)
    longitude: float | None = Field(default=None, ge=27, le=36)
    breeding_source: str = Field(min_length=2, max_length=160)
    water_present: bool | None = None
    larvae_seen: bool | None = None
    mosquito_level: Literal["low", "moderate", "high", "unknown"] | None = "unknown"
    action_taken: str | None = Field(default=None, max_length=500)
    photo_reference: str | None = Field(default=None, max_length=500)
    photo_asset_id: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=1000)
    consent_confirmed: bool

    @model_validator(mode="after")
    def validate_report(self):
        if not self.consent_confirmed:
            raise ValueError("Consent confirmation is required.")
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Latitude and longitude must be supplied together.")
        return self


class StatusUpdate(BaseModel):
    status: str


class AedesSurveillanceIn(BaseModel):
    site_id: str | None = Field(default=None, max_length=120)
    district: str = Field(min_length=2, max_length=80)
    collection_date: date
    trap_type: Literal["BG-Sentinel", "ovitrap", "larval survey", "aspirator", "other"]
    trap_hours: float | None = Field(default=None, ge=0, le=336)
    traps_deployed: int | None = Field(default=None, ge=0, le=1000)
    containers_inspected: int | None = Field(default=None, ge=0)
    containers_positive: int | None = Field(default=None, ge=0)
    eggs_count: int | None = Field(default=None, ge=0)
    larvae_count: int | None = Field(default=None, ge=0)
    adults_count: int | None = Field(default=None, ge=0)
    species: str | None = Field(default=None, max_length=160)
    identification_method: str | None = Field(default=None, max_length=160)
    collector_code: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_surveillance(self):
        if self.collection_date > date.today():
            raise ValueError("Collection date cannot be in the future.")
        if (
            self.containers_positive is not None
            and self.containers_inspected is not None
            and self.containers_positive > self.containers_inspected
        ):
            raise ValueError("Positive containers cannot exceed inspected containers.")
        if not any(v is not None for v in (self.eggs_count, self.larvae_count, self.adults_count)):
            raise ValueError("At least one mosquito count is required.")
        return self


class GenomicSampleIn(BaseModel):
    sample_id: str | None = Field(default=None, max_length=120)
    surveillance_record_id: str | None = Field(default=None, max_length=120)
    district: str = Field(min_length=2, max_length=80)
    collection_date: date
    mosquito_species: str | None = Field(default=None, max_length=160)
    pool_size: int = Field(ge=1, le=100)
    extraction_status: Literal["registered", "extracted", "failed"] = "registered"
    sequencing_platform: str | None = Field(default=None, max_length=120)
    sequencing_status: str = "not_started"
    dengue_result: str = "not_tested"
    dengue_serotype: str | None = Field(default=None, max_length=40)
    genome_accession: str | None = Field(default=None, max_length=120)
    qc_status: Literal["pending", "passed", "failed", "review"] = "pending"
    notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_genomics(self):
        if self.collection_date > date.today():
            raise ValueError("Collection date cannot be in the future.")
        if self.sequencing_status not in SEQUENCING_STATUSES:
            raise ValueError("Invalid sequencing status.")
        if self.dengue_result not in GENOMIC_RESULTS:
            raise ValueError("Invalid dengue result.")
        if self.dengue_serotype and self.dengue_result != "positive":
            raise ValueError("A dengue serotype can only be recorded for a positive result.")
        return self


class GenomicArtifactIn(BaseModel):
    sample_id: str | None = Field(default=None, max_length=120)
    artifact_type: Literal["lineage", "consensus_fasta", "phylogeny_newick", "qc_report"]
    method: str | None = Field(default=None, max_length=160)
    software_version: str | None = Field(default=None, max_length=80)
    result_value: str | None = Field(default=None, max_length=100000)
    external_url: str | None = Field(default=None, max_length=1000)
    file_checksum: str | None = Field(default=None, max_length=128)
    review_status: Literal["pending_review", "accepted", "rejected"] = "pending_review"

    @model_validator(mode="after")
    def validate_artifact(self):
        if not self.result_value and not self.external_url:
            raise ValueError("An artifact result or external URL is required.")
        return self


class ModelEvaluationIn(BaseModel):
    model_name: str = Field(min_length=2, max_length=120)
    model_version: str = Field(min_length=1, max_length=80)
    evaluation_date: date
    validation_design: str = Field(min_length=3, max_length=500)
    sensitivity: float | None = Field(default=None, ge=0, le=1)
    specificity: float | None = Field(default=None, ge=0, le=1)
    precision: float | None = Field(default=None, ge=0, le=1)
    recall: float | None = Field(default=None, ge=0, le=1)
    f1_score: float | None = Field(default=None, ge=0, le=1)
    roc_auc: float | None = Field(default=None, ge=0, le=1)
    pr_auc: float | None = Field(default=None, ge=0, le=1)
    brier_score: float | None = Field(default=None, ge=0, le=1)
    lead_time_days: float | None = Field(default=None, ge=0)
    outcome_definition: str | None = Field(default=None, max_length=500)
    status: Literal["draft", "internal_review", "approved", "retired"] = "draft"
    notes: str | None = Field(default=None, max_length=1000)


class MelObservationIn(BaseModel):
    indicator_code: str = Field(min_length=2, max_length=120)
    observation_date: date
    value: float = Field(ge=0)
    unit: str = Field(min_length=1, max_length=80)
    district: str | None = Field(default=None, max_length=80)
    data_source: str = Field(min_length=2, max_length=160)
    verification_status: Literal["pending", "verified", "rejected"] = "pending"
    notes: str | None = Field(default=None, max_length=1000)


def _community_dict(row: CommunityReport) -> dict:
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}


def _surveillance_dict(row: AedesSurveillanceRecord) -> dict:
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}


def _genomic_dict(row: GenomicSample) -> dict:
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}


def _evaluation_dict(row: ModelEvaluation) -> dict:
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}


def _mel_dict(row: MelObservation) -> dict:
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}


async def _db_list(db: AsyncSession, model, order_column, serializer, fallback_key: str) -> tuple[list[dict], str]:
    try:
        rows = (await db.execute(select(model).order_by(order_column.desc()))).scalars().all()
        return [serializer(row) for row in rows], "database"
    except Exception:
        await db.rollback()
        return _load_fallback()[fallback_key], "json_fallback"


@router.get("/dengue/community-reports")
async def list_community_reports(db: AsyncSession = Depends(get_db)) -> dict:
    items, source = await _db_list(db, CommunityReport, CommunityReport.submitted_at, _community_dict, "community_reports")
    return {
        "items": items,
        "source": source,
        "privacy": "No names, phone numbers, household identifiers, or clinical diagnoses are collected.",
    }


@router.post("/dengue/community-reports", status_code=201)
async def create_community_report(payload: CommunityReportIn, db: AsyncSession = Depends(get_db), principal: Principal = Depends(require_roles("admin", "field_officer", "data_manager"))) -> dict:
    item = CommunityReport(
        report_id=str(uuid.uuid4()),
        submitted_at=_now(),
        review_status="pending_review",
        **payload.model_dump(),
    )
    try:
        db.add(item)
        add_audit_event(db, action="create", table_name="community_reports", record_id=item.report_id, user_id=principal.user_id if principal.auth_method == "jwt" else None, new_value=payload.model_dump())
        await db.commit()
        await db.refresh(item)
        return {**_community_dict(item), "source": "database"}
    except Exception:
        await db.rollback()
        row = _community_dict(item)
        store = _load_fallback()
        store["community_reports"].insert(0, row)
        _save_fallback(store)
        return {**row, "source": "json_fallback"}


@router.patch("/dengue/community-reports/{report_id}/status")
async def update_community_report(report_id: str, payload: StatusUpdate, db: AsyncSession = Depends(get_db), principal: Principal = Depends(require_roles("admin", "field_officer", "data_manager", "technical_reviewer"))) -> dict:
    if payload.status not in REPORT_STATUSES:
        raise HTTPException(422, f"Invalid status. Allowed: {', '.join(sorted(REPORT_STATUSES))}")
    try:
        item = await db.get(CommunityReport, report_id)
        if not item:
            raise HTTPException(404, "Community report not found")
        old_status = item.review_status
        item.review_status = payload.status
        add_audit_event(db, action="status_change", table_name="community_reports", record_id=report_id, user_id=principal.user_id if principal.auth_method == "jwt" else None, old_value={"status": old_status}, new_value={"status": payload.status})
        await db.commit()
        await db.refresh(item)
        return _community_dict(item)
    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        store = _load_fallback()
        item = next((row for row in store["community_reports"] if row["report_id"] == report_id), None)
        if not item:
            raise HTTPException(404, "Community report not found")
        item["review_status"] = payload.status
        _save_fallback(store)
        return item


@router.get("/dengue/aedes-surveillance")
async def list_aedes_surveillance(db: AsyncSession = Depends(get_db)) -> dict:
    items, source = await _db_list(
        db, AedesSurveillanceRecord, AedesSurveillanceRecord.collection_date,
        _surveillance_dict, "aedes_surveillance",
    )
    return {
        "items": items,
        "source": source,
        "governance": "Prospective pilot observations only. Legacy Anopheles records are not counted as Aedes surveillance.",
    }


@router.post("/dengue/aedes-surveillance", status_code=201)
async def create_aedes_surveillance(payload: AedesSurveillanceIn, db: AsyncSession = Depends(get_db), principal: Principal = Depends(require_roles("admin", "field_officer", "data_manager"))) -> dict:
    row = AedesSurveillanceRecord(
        record_id=str(uuid.uuid4()),
        quality_status="pending_review",
        created_at=_now(),
        **payload.model_dump(),
    )
    try:
        db.add(row)
        add_audit_event(db, action="create", table_name="aedes_surveillance_records", record_id=row.record_id, user_id=principal.user_id if principal.auth_method == "jwt" else None, new_value=payload.model_dump())
        await db.commit()
        await db.refresh(row)
        return {**_surveillance_dict(row), "source": "database"}
    except Exception:
        await db.rollback()
        item = _surveillance_dict(row)
        store = _load_fallback()
        store["aedes_surveillance"].insert(0, item)
        _save_fallback(store)
        return {**item, "source": "json_fallback"}


@router.get("/dengue/aedes-summary")
async def aedes_surveillance_summary(db: AsyncSession = Depends(get_db)) -> dict:
    items, source = await _db_list(
        db, AedesSurveillanceRecord, AedesSurveillanceRecord.collection_date,
        _surveillance_dict, "aedes_surveillance",
    )
    return {**summarize_aedes_surveillance(items), "source": source}


@router.patch("/dengue/aedes-surveillance/{record_id}/status")
async def update_aedes_status(record_id: str, payload: StatusUpdate, db: AsyncSession = Depends(get_db), principal: Principal = Depends(require_roles("admin", "data_manager", "technical_reviewer"))) -> dict:
    if payload.status not in SURVEILLANCE_STATUSES:
        raise HTTPException(422, f"Invalid status. Allowed: {', '.join(sorted(SURVEILLANCE_STATUSES))}")
    try:
        item = await db.get(AedesSurveillanceRecord, record_id)
        if not item:
            raise HTTPException(404, "Aedes surveillance record not found")
        old_status = item.quality_status
        item.quality_status = payload.status
        add_audit_event(db, action="status_change", table_name="aedes_surveillance_records", record_id=record_id, user_id=principal.user_id if principal.auth_method == "jwt" else None, old_value={"status": old_status}, new_value={"status": payload.status})
        await db.commit()
        await db.refresh(item)
        return _surveillance_dict(item)
    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        store = _load_fallback()
        item = next((row for row in store["aedes_surveillance"] if row["record_id"] == record_id), None)
        if not item:
            raise HTTPException(404, "Aedes surveillance record not found")
        item["quality_status"] = payload.status
        _save_fallback(store)
        return item


@router.get("/dengue/genomic-samples")
async def list_genomic_samples(db: AsyncSession = Depends(get_db)) -> dict:
    items, source = await _db_list(db, GenomicSample, GenomicSample.collection_date, _genomic_dict, "genomic_samples")
    return {
        "items": items,
        "source": source,
        "governance": "Registry and workflow only. No dengue genomic result is inferred from current vector or climate data.",
    }


@router.post("/dengue/genomic-samples", status_code=201)
async def create_genomic_sample(payload: GenomicSampleIn, db: AsyncSession = Depends(get_db), principal: Principal = Depends(require_roles("admin", "lab_analyst", "data_manager"))) -> dict:
    values = payload.model_dump()
    values["sample_id"] = values.get("sample_id") or f"DENV-{uuid.uuid4().hex[:10].upper()}"
    row = GenomicSample(created_at=_now(), **values)
    try:
        db.add(row)
        add_audit_event(db, action="create", table_name="genomic_samples", record_id=row.sample_id, user_id=principal.user_id if principal.auth_method == "jwt" else None, new_value=payload.model_dump())
        await db.commit()
        await db.refresh(row)
        return {**_genomic_dict(row), "source": "database"}
    except Exception:
        await db.rollback()
        item = _genomic_dict(row)
        store = _load_fallback()
        if any(existing["sample_id"] == item["sample_id"] for existing in store["genomic_samples"]):
            raise HTTPException(409, "Genomic sample ID already exists")
        store["genomic_samples"].insert(0, item)
        _save_fallback(store)
        return {**item, "source": "json_fallback"}


@router.get("/dengue/genomic-artifacts")
async def list_genomic_artifacts(sample_id: str | None = None, db: AsyncSession = Depends(get_db)) -> dict:
    query = select(GenomicArtifact).order_by(GenomicArtifact.created_at.desc())
    if sample_id:
        query = query.where(GenomicArtifact.sample_id == sample_id)
    rows = (await db.execute(query)).scalars().all()
    return {
        "items": [{column.name: getattr(row, column.name) for column in row.__table__.columns} for row in rows],
        "governance": "Only laboratory-generated artifacts are registered; no lineage or tree is inferred from climate data.",
    }


@router.post("/dengue/genomic-artifacts", status_code=201)
async def create_genomic_artifact(
    payload: GenomicArtifactIn,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles("admin", "lab_analyst", "data_manager")),
) -> dict:
    if payload.sample_id and not await db.get(GenomicSample, payload.sample_id):
        raise HTTPException(404, "Genomic sample not found.")
    row = GenomicArtifact(
        artifact_id=str(uuid.uuid4()), created_at=_now(),
        created_by=principal.user_id if principal.auth_method == "jwt" else None,
        **payload.model_dump(),
    )
    db.add(row)
    add_audit_event(db, action="create", table_name="genomic_artifacts", record_id=row.artifact_id, user_id=row.created_by, new_value=payload.model_dump())
    await db.commit()
    await db.refresh(row)
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}


@router.get("/dengue/model-evaluations")
async def list_model_evaluations(db: AsyncSession = Depends(get_db)) -> dict:
    items, source = await _db_list(db, ModelEvaluation, ModelEvaluation.evaluation_date, _evaluation_dict, "model_evaluations")
    return {"items": items, "source": source}


@router.post("/dengue/model-evaluations", status_code=201)
async def create_model_evaluation(payload: ModelEvaluationIn, db: AsyncSession = Depends(get_db), principal: Principal = Depends(require_roles("admin", "technical_reviewer", "data_manager"))) -> dict:
    row = ModelEvaluation(evaluation_id=str(uuid.uuid4()), **payload.model_dump())
    try:
        db.add(row)
        add_audit_event(db, action="create", table_name="model_evaluations", record_id=row.evaluation_id, user_id=principal.user_id if principal.auth_method == "jwt" else None, new_value=payload.model_dump())
        await db.commit()
        await db.refresh(row)
        return {**_evaluation_dict(row), "source": "database"}
    except Exception:
        await db.rollback()
        item = _evaluation_dict(row)
        store = _load_fallback()
        store["model_evaluations"].insert(0, item)
        _save_fallback(store)
        return {**item, "source": "json_fallback"}


@router.get("/dengue/mel-observations")
async def list_mel_observations(db: AsyncSession = Depends(get_db)) -> dict:
    items, source = await _db_list(db, MelObservation, MelObservation.observation_date, _mel_dict, "mel_observations")
    return {"items": items, "source": source}


@router.post("/dengue/mel-observations", status_code=201)
async def create_mel_observation(payload: MelObservationIn, db: AsyncSession = Depends(get_db), principal: Principal = Depends(require_roles("admin", "data_manager"))) -> dict:
    row = MelObservation(observation_id=str(uuid.uuid4()), **payload.model_dump())
    try:
        db.add(row)
        add_audit_event(db, action="create", table_name="mel_observations", record_id=row.observation_id, user_id=principal.user_id if principal.auth_method == "jwt" else None, new_value=payload.model_dump())
        await db.commit()
        await db.refresh(row)
        return {**_mel_dict(row), "source": "database"}
    except Exception:
        await db.rollback()
        item = _mel_dict(row)
        store = _load_fallback()
        store["mel_observations"].insert(0, item)
        _save_fallback(store)
        return {**item, "source": "json_fallback"}


@router.get("/dengue/model-readiness")
async def dengue_model_readiness(db: AsyncSession = Depends(get_db)) -> dict:
    surveillance, _ = await _db_list(
        db, AedesSurveillanceRecord, AedesSurveillanceRecord.collection_date,
        _surveillance_dict, "aedes_surveillance",
    )
    genomics, _ = await _db_list(db, GenomicSample, GenomicSample.collection_date, _genomic_dict, "genomic_samples")
    validated_surveillance = [row for row in surveillance if row.get("quality_status") == "validated"]
    positive_pools = [row for row in genomics if row.get("dengue_result") == "positive"]
    gates = [
        {"gate": "climate_history", "status": "ready", "count": 30, "requirement": "District climate history available"},
        {"gate": "aedes_surveillance", "status": "ready" if len(validated_surveillance) >= 100 else "pilot_required", "count": len(validated_surveillance), "requirement": "At least 100 validated prospective records across seasons"},
        {"gate": "dengue_outcomes", "status": "formal_access_required", "count": 0, "requirement": "Approved suspected/confirmed dengue outcome series"},
        {"gate": "genomic_results", "status": "ready" if positive_pools else "pilot_required", "count": len(positive_pools), "requirement": "Laboratory-reviewed mosquito-pool results"},
        {"gate": "sampling_effort", "status": "ready" if validated_surveillance and all(row.get("trap_hours") is not None or row.get("containers_inspected") is not None for row in validated_surveillance) else "pilot_required", "count": len(validated_surveillance), "requirement": "Effort denominator for every validated observation"},
        {"gate": "spatiotemporal_coverage", "status": "pilot_required", "count": len({row.get("district") for row in validated_surveillance}), "requirement": "Repeated district/site observations across wet and dry seasons"},
    ]
    ready = all(gate["status"] == "ready" for gate in gates)
    return {
        "training_ready": ready,
        "gates": gates,
        "allowed_now": "Descriptive climate-vector screening and field prioritization",
        "blocked_now": "Validated dengue outbreak forecasting and performance claims",
        "candidate_models_after_gates": [
            "regularized logistic baseline",
            "random forest",
            "gradient boosting",
            "Bayesian hierarchical spatiotemporal model",
        ],
        "validation_plan": [
            "rolling-origin temporal validation",
            "leave-one-district-out spatial validation",
            "calibration and Brier score",
            "sensitivity, specificity, precision, recall, F1, ROC-AUC and PR-AUC",
            "operational lead-time comparison against routine surveillance",
        ],
    }


@router.get("/dengue/executive-summary")
async def dengue_executive_summary(db: AsyncSession = Depends(get_db)) -> dict:
    """Return proposal-aligned indicators without converting absent pilot data to evidence."""
    community, community_source = await _db_list(
        db, CommunityReport, CommunityReport.submitted_at, _community_dict, "community_reports"
    )
    surveillance, surveillance_source = await _db_list(
        db,
        AedesSurveillanceRecord,
        AedesSurveillanceRecord.collection_date,
        _surveillance_dict,
        "aedes_surveillance",
    )
    genomics, genomics_source = await _db_list(
        db, GenomicSample, GenomicSample.collection_date, _genomic_dict, "genomic_samples"
    )

    database_source = "database"
    try:
        alerts = (await db.execute(select(Alert))).scalars().all()
        actions = (await db.execute(select(ResponseAction))).scalars().all()
        registered_sites = (await db.execute(select(func.count()).select_from(Site))).scalar_one()
    except Exception:
        await db.rollback()
        alerts = []
        actions = []
        registered_sites = 0
        database_source = "database_unavailable"

    sentinel = read_csv("data/processed/context/sentinel_sites_33.csv")
    candidate_sites = len(sentinel)
    candidate_gps = sum(
        bool(row.get("latitude")) and bool(row.get("longitude")) for row in sentinel
    )
    validated_site_gps = sum(
        str(row.get("coordinate_quality", "")).lower() in {"validated", "field_validated"}
        for row in sentinel
    )

    aedes_summary = summarize_aedes_surveillance(surveillance)
    ovitrap_deployments = sum(
        int(row.get("traps_deployed") or 0)
        for row in surveillance
        if "ovi" in str(row.get("trap_type", "")).lower()
    )
    bg_deployments = sum(
        int(row.get("traps_deployed") or 0)
        for row in surveillance
        if "bg" in str(row.get("trap_type", "")).lower()
    )

    analysed_results = {"positive", "negative", "inconclusive"}
    analysed_pools = [
        row for row in genomics if str(row.get("dengue_result", "")).lower() in analysed_results
    ]
    positive_pools = [
        row for row in genomics if str(row.get("dengue_result", "")).lower() == "positive"
    ]
    serotypes = sorted(
        {str(row.get("dengue_serotype")) for row in positive_pools if row.get("dengue_serotype")}
    )
    sequence_complete = sum(
        str(row.get("sequencing_status", "")).lower() == "complete" for row in genomics
    )
    lineage_ready = sum(bool(row.get("genome_accession")) for row in genomics)

    alert_statuses = [str(row.status or "pending_review").lower() for row in alerts]
    completed_action_statuses = {"completed", "resolved", "closed", "verified"}
    completed_actions = sum(
        str(row.action_status or "").lower() in completed_action_statuses for row in actions
    )

    effort_missing = sum(
        row.get("trap_hours") is None
        and row.get("containers_inspected") is None
        and row.get("traps_deployed") is None
        for row in surveillance
    )
    species_missing = sum(not row.get("species") for row in surveillance)
    genomic_result_missing = sum(
        str(row.get("dengue_result", "not_tested")).lower() in {"not_tested", "pending", ""}
        for row in genomics
    )
    community_pending = sum(
        str(row.get("review_status", "pending_review")).lower() == "pending_review"
        for row in community
    )

    metrics = [
        {"key": "study_sites", "label": "Candidate study sites", "value": candidate_sites, "state": "candidate_registry", "note": f"{candidate_gps} have lecturer-provided coordinates; field validation pending"},
        {"key": "aedes_records", "label": "Aedes records", "value": len(surveillance), "state": "observed" if surveillance else "pilot_collection_pending", "note": "Prospective observations only"},
        {"key": "ovitraps_deployed", "label": "Ovitraps deployed", "value": ovitrap_deployments, "state": "observed" if ovitrap_deployments else "pilot_collection_pending", "note": "Sum of recorded deployments"},
        {"key": "bg_sentinel_deployments", "label": "BG-Sentinel deployments", "value": bg_deployments, "state": "observed" if bg_deployments else "pilot_collection_pending", "note": "Sum of recorded deployments"},
        {"key": "pools_analysed", "label": "Mosquito pools analysed", "value": len(analysed_pools), "state": "laboratory_result" if analysed_pools else "pilot_collection_pending", "note": f"{len(genomics)} pools registered"},
        {"key": "positive_pools", "label": "Dengue-positive pools", "value": len(positive_pools), "state": "laboratory_result" if analysed_pools else "not_yet_tested", "note": "Displayed only after laboratory review"},
        {"key": "community_reports", "label": "Community reports", "value": len(community), "state": "observed" if community else "pilot_collection_pending", "note": "Consented reports received"},
        {"key": "alerts_generated", "label": "Review signals generated", "value": len(alerts), "state": "workflow_activity" if alerts else "none_generated", "note": "Human-reviewed signals, not automatic outbreak alerts"},
        {"key": "actions_completed", "label": "Response actions completed", "value": completed_actions, "state": "workflow_activity" if actions else "none_assigned", "note": f"{len(actions)} actions assigned"},
    ]

    model_gates = [
        {"key": "climate_history", "label": "Climate history", "ready": True},
        {"key": "aedes_outcome", "label": "Validated Aedes outcomes", "ready": aedes_summary["validated_records"] >= 100},
        {"key": "sampling_effort", "label": "Complete trap effort", "ready": bool(surveillance) and effort_missing == 0},
        {"key": "dengue_outcome", "label": "Governed dengue outcomes", "ready": False},
        {"key": "genomic_results", "label": "Reviewed pool results", "ready": bool(analysed_pools)},
        {"key": "spatiotemporal_coverage", "label": "Seasonal site coverage", "ready": False},
    ]
    ready_gate_count = sum(gate["ready"] for gate in model_gates)

    return {
        "project": "DengueEW-GL",
        "scope": "Rwanda proof-of-concept operations with exploratory Great Lakes context",
        "metrics": metrics,
        "sites": {
            "candidate": candidate_sites,
            "registered_database": registered_sites,
            "coordinates_available": candidate_gps,
            "field_validated_coordinates": validated_site_gps,
        },
        "aedes": aedes_summary,
        "genomics": {
            "registered_pools": len(genomics),
            "analysed_pools": len(analysed_pools),
            "positive_pools": len(positive_pools),
            "serotypes": serotypes,
            "sequencing_complete": sequence_complete,
            "lineage_records": lineage_ready,
        },
        "community": {
            "reports": len(community),
            "with_gps": sum(row.get("latitude") is not None and row.get("longitude") is not None for row in community),
            "with_photo": sum(bool(row.get("photo_reference")) for row in community),
            "validated": sum(str(row.get("review_status", "")).lower() in {"accepted", "closed"} for row in community),
            "pending_validation": community_pending,
            "with_action": sum(bool(row.get("action_taken")) for row in community),
        },
        "alerts_and_actions": {
            "generated": len(alerts),
            "draft": alert_statuses.count("pending_review"),
            "under_technical_review": sum(status in {"active", "field_verification_requested", "verified", "escalated"} for status in alert_statuses),
            "approved": sum(bool(row.approved_by) for row in alerts),
            "acknowledged": alert_statuses.count("acknowledged"),
            "assigned_actions": len(actions),
            "completed_actions": completed_actions,
        },
        "data_gaps": [
            {"key": "site_gps", "label": "Site coordinates needing field validation", "value": candidate_sites - validated_site_gps, "state": "review_required" if candidate_sites > validated_site_gps else "complete"},
            {"key": "sample_dates", "label": "Prospective records missing collection date", "value": 0, "state": "awaiting_collection" if not surveillance else "complete"},
            {"key": "trap_effort", "label": "Aedes records missing trap effort", "value": effort_missing, "state": "awaiting_collection" if not surveillance else ("review_required" if effort_missing else "complete")},
            {"key": "species", "label": "Aedes records missing species", "value": species_missing, "state": "awaiting_collection" if not surveillance else ("review_required" if species_missing else "complete")},
            {"key": "genomic_result", "label": "Pools without reviewed dengue result", "value": genomic_result_missing, "state": "awaiting_collection" if not genomics else ("review_required" if genomic_result_missing else "complete")},
            {"key": "community_validation", "label": "Community reports pending validation", "value": community_pending, "state": "awaiting_collection" if not community else ("review_required" if community_pending else "complete")},
        ],
        "model_readiness": {
            "score_pct": round((ready_gate_count / len(model_gates)) * 100),
            "ready_gates": ready_gate_count,
            "total_gates": len(model_gates),
            "gates": model_gates,
            "current_output": "Prototype climate suitability and field-priority screening",
            "blocked_output": "Validated Aedes abundance and dengue-risk forecasting",
        },
        "sources": {
            "community": community_source,
            "aedes": surveillance_source,
            "genomics": genomics_source,
            "operations": database_source,
            "sites": "lecturer_provided_candidate_registry",
        },
        "claim_boundary": "Zero means no reviewed pilot observation is currently registered; it does not mean dengue or Aedes is absent. Current risk outputs are prototype climate-suitability signals, not validated outbreak forecasts.",
    }


@router.get("/dengue/submission-readiness")
async def submission_readiness(db: AsyncSession = Depends(get_db)) -> dict:
    community, _ = await _db_list(db, CommunityReport, CommunityReport.submitted_at, _community_dict, "community_reports")
    surveillance, _ = await _db_list(db, AedesSurveillanceRecord, AedesSurveillanceRecord.collection_date, _surveillance_dict, "aedes_surveillance")
    genomics, _ = await _db_list(db, GenomicSample, GenomicSample.collection_date, _genomic_dict, "genomic_samples")
    evaluations, _ = await _db_list(db, ModelEvaluation, ModelEvaluation.evaluation_date, _evaluation_dict, "model_evaluations")
    mel, _ = await _db_list(db, MelObservation, MelObservation.observation_date, _mel_dict, "mel_observations")
    sentinel = read_csv("data/processed/context/sentinel_sites_33.csv")
    climate = read_csv("data/processed/context/great_lakes_climate_summary.csv")
    vectors = read_csv("data/processed/context/great_lakes_vector_occurrence_summary.csv")
    pillars = [
        {"pillar": "Digital platform", "status": "implemented", "evidence": "FastAPI, React, decision room, alerts and exports"},
        {"pillar": "Climate integration", "status": "implemented", "evidence": f"{len(climate)} Great Lakes reference points and 30 Rwanda district climate series"},
        {"pillar": "Sentinel mapping", "status": "implemented", "evidence": f"{len(sentinel)} lecturer-provided candidate sentinel locations"},
        {"pillar": "Aedes occurrence context", "status": "context_only", "evidence": f"{sum(int(float(row.get('records') or 0)) for row in vectors if str(row.get('species', '')).lower().startswith('aedes'))} GBIF presence-only records"},
        {"pillar": "Prospective Aedes surveillance", "status": "pilot_active" if surveillance else "grant_period_work", "evidence": f"{len(surveillance)} pilot records received"},
        {"pillar": "Community reporting", "status": "pilot_active" if community else "workflow_ready", "evidence": f"{len(community)} consented reports received"},
        {"pillar": "Genomic surveillance", "status": "pilot_active" if genomics else "workflow_ready", "evidence": f"{len(genomics)} mosquito pools registered"},
        {"pillar": "Validated dengue forecast", "status": "grant_period_work", "evidence": f"{len(evaluations)} model evaluations registered; official outcomes still required"},
        {"pillar": "Monitoring and evaluation", "status": "pilot_active" if mel else "workflow_ready", "evidence": f"{len(mel)} MEL observations registered"},
    ]
    return {
        "project": "AI-enabled community-based dengue early warning Proof of Concept",
        "submission_position": "Existing digital architecture with grant-period prospective validation",
        "pillars": pillars,
        "counts": {
            "community_reports": len(community),
            "aedes_surveillance_records": len(surveillance),
            "genomic_samples": len(genomics),
            "model_evaluations": len(evaluations),
            "mel_observations": len(mel),
        },
        "claim_boundary": "The current system supports preparedness screening and pilot operations. It does not yet provide a validated dengue outbreak forecast.",
    }


@router.get("/dengue/mel-summary")
async def mel_summary(db: AsyncSession = Depends(get_db)) -> dict:
    reports, _ = await _db_list(db, CommunityReport, CommunityReport.submitted_at, _community_dict, "community_reports")
    surveillance, _ = await _db_list(db, AedesSurveillanceRecord, AedesSurveillanceRecord.collection_date, _surveillance_dict, "aedes_surveillance")
    samples, _ = await _db_list(db, GenomicSample, GenomicSample.collection_date, _genomic_dict, "genomic_samples")
    observations, source = await _db_list(db, MelObservation, MelObservation.observation_date, _mel_dict, "mel_observations")
    try:
        alert_count = (await db.execute(select(func.count()).select_from(Alert))).scalar_one()
    except Exception:
        await db.rollback()
        alert_count = 0
    indicators = [
        {"code": "community_reports", "label": "Consented community reports", "value": len(reports), "target": "Set after pilot-site selection", "status": "active" if reports else "baseline_pending"},
        {"code": "active_reporters", "label": "Active reporter roles", "value": len({row.get("reporter_role") for row in reports}), "target": "At least three community actor groups", "status": "active" if reports else "baseline_pending"},
        {"code": "aedes_records", "label": "Prospective Aedes observations", "value": len(surveillance), "target": "Protocol-defined", "status": "active" if surveillance else "baseline_pending"},
        {"code": "validated_aedes", "label": "Validated Aedes observations", "value": sum(row.get("quality_status") == "validated" for row in surveillance), "target": ">=90% data-quality acceptance", "status": "active" if surveillance else "baseline_pending"},
        {"code": "genomic_pools", "label": "Mosquito pools registered", "value": len(samples), "target": "Protocol-defined", "status": "active" if samples else "baseline_pending"},
        {"code": "review_signals", "label": "Review signals created", "value": alert_count, "target": "Track response time and disposition", "status": "active" if alert_count else "baseline_pending"},
    ]
    return {
        "indicators": indicators,
        "observations": observations,
        "source": source,
        "evaluation_schedule": ["baseline", "monthly monitoring", "midline", "endline"],
        "governance": "Targets must be approved after pilot geography, sample size, and baseline are confirmed.",
    }
