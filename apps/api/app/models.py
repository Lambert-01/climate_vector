from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Double, ForeignKey, Integer, LargeBinary, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Organization(Base):
    __tablename__ = "organizations"
    organization_id: Mapped[str] = mapped_column(Text, primary_key=True)
    organization_name: Mapped[str] = mapped_column(Text, nullable=False)
    organization_type: Mapped[str | None] = mapped_column(Text)


class User(Base):
    __tablename__ = "users"
    user_id: Mapped[str] = mapped_column(Text, primary_key=True)
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str | None] = mapped_column(Text, unique=True)
    hashed_password: Mapped[str | None] = mapped_column(Text)
    organization_id: Mapped[str | None] = mapped_column(ForeignKey("organizations.organization_id"))
    role: Mapped[str] = mapped_column(Text, nullable=False)
    active_status: Mapped[str] = mapped_column(Text, default="active")


class Site(Base):
    __tablename__ = "sites"
    site_id: Mapped[str] = mapped_column(Text, primary_key=True)
    site_name: Mapped[str] = mapped_column(Text, nullable=False)
    district: Mapped[str | None] = mapped_column(Text)
    province: Mapped[str | None] = mapped_column(Text)
    latitude: Mapped[float | None] = mapped_column(Double)
    longitude: Mapped[float | None] = mapped_column(Double)
    coordinate_source: Mapped[str | None] = mapped_column(Text)
    coordinate_quality: Mapped[str | None] = mapped_column(Text)
    visits: Mapped[list[FieldVisit]] = relationship(back_populates="site")


class FieldVisit(Base):
    __tablename__ = "field_visits"
    visit_id: Mapped[str] = mapped_column(Text, primary_key=True)
    site_id: Mapped[str | None] = mapped_column(ForeignKey("sites.site_id"))
    visit_date: Mapped[date | None] = mapped_column(Date)
    habitat_type: Mapped[str | None] = mapped_column(Text)
    habitat_positive: Mapped[bool | None] = mapped_column(Boolean)
    sampling_effort_type: Mapped[str | None] = mapped_column(Text)
    sampling_effort_value: Mapped[float | None] = mapped_column(Double)
    quality_flag: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    site: Mapped[Site | None] = relationship(back_populates="visits")
    observations: Mapped[list[MosquitoObservation]] = relationship(back_populates="visit")


class MosquitoObservation(Base):
    __tablename__ = "mosquito_observations"
    observation_id: Mapped[str] = mapped_column(Text, primary_key=True)
    visit_id: Mapped[str | None] = mapped_column(ForeignKey("field_visits.visit_id"))
    life_stage: Mapped[str | None] = mapped_column(Text)
    count: Mapped[int | None] = mapped_column(Integer)
    species_raw: Mapped[str | None] = mapped_column(Text)
    species_clean: Mapped[str | None] = mapped_column(Text)
    identification_method: Mapped[str | None] = mapped_column(Text)
    visit: Mapped[FieldVisit | None] = relationship(back_populates="observations")


class ResistanceTestReplicate(Base):
    __tablename__ = "resistance_test_replicates"
    replicate_id: Mapped[str] = mapped_column(Text, primary_key=True)
    source_row_id: Mapped[int | None] = mapped_column(Integer)
    site_id: Mapped[str | None] = mapped_column(ForeignKey("sites.site_id"))
    district: Mapped[str | None] = mapped_column(Text)
    test_date: Mapped[date | None] = mapped_column(Date)
    test_month: Mapped[int | None] = mapped_column(Integer)
    test_year: Mapped[int | None] = mapped_column(Integer)
    species_raw: Mapped[str | None] = mapped_column(Text)
    species_clean: Mapped[str | None] = mapped_column(Text)
    insecticide_tested: Mapped[str | None] = mapped_column(Text)
    concentration_label: Mapped[str | None] = mapped_column(Text)
    number_exposed: Mapped[int | None] = mapped_column(Integer)
    number_dead_24h: Mapped[int | None] = mapped_column(Integer)
    mortality_rate: Mapped[float | None] = mapped_column(Double)
    control_mortality: Mapped[float | None] = mapped_column(Double)
    resistance_status: Mapped[str | None] = mapped_column(Text)
    quality_flag: Mapped[str | None] = mapped_column(Text)


class ClimateDaily(Base):
    __tablename__ = "climate_daily"
    location_id: Mapped[str] = mapped_column(Text, primary_key=True)
    date: Mapped[date] = mapped_column(Date, primary_key=True)
    rainfall_mm: Mapped[float | None] = mapped_column(Double)
    tmean_c: Mapped[float | None] = mapped_column(Double)
    tmin_c: Mapped[float | None] = mapped_column(Double)
    tmax_c: Mapped[float | None] = mapped_column(Double)
    relative_humidity: Mapped[float | None] = mapped_column(Double)


class Alert(Base):
    __tablename__ = "alerts"
    alert_id: Mapped[str] = mapped_column(Text, primary_key=True)
    alert_date: Mapped[date] = mapped_column(Date, nullable=False)
    district: Mapped[str | None] = mapped_column(Text)
    risk_level: Mapped[str | None] = mapped_column(Text)
    risk_reason: Mapped[str | None] = mapped_column(Text)
    rule_or_model_version: Mapped[str | None] = mapped_column(Text)
    uncertainty_level: Mapped[str | None] = mapped_column(Text)
    issued_by: Mapped[str | None] = mapped_column(ForeignKey("users.user_id"))
    approved_by: Mapped[str | None] = mapped_column(ForeignKey("users.user_id"))
    status: Mapped[str | None] = mapped_column(Text)
    alert_expiry_date: Mapped[date | None] = mapped_column(Date)
    recommended_action: Mapped[str | None] = mapped_column(Text)
    actions: Mapped[list[ResponseAction]] = relationship(back_populates="alert")


class ResponseAction(Base):
    __tablename__ = "response_actions"
    action_id: Mapped[str] = mapped_column(Text, primary_key=True)
    alert_id: Mapped[str | None] = mapped_column(ForeignKey("alerts.alert_id"))
    responsible_organization: Mapped[str | None] = mapped_column(Text)
    responsible_user: Mapped[str | None] = mapped_column(ForeignKey("users.user_id"))
    action_due_date: Mapped[date | None] = mapped_column(Date)
    action_date: Mapped[date | None] = mapped_column(Date)
    action_status: Mapped[str | None] = mapped_column(Text)
    action_type: Mapped[str | None] = mapped_column(Text)
    follow_up_result: Mapped[str | None] = mapped_column(Text)
    alert: Mapped[Alert | None] = relationship(back_populates="actions")


class DatasetRegistry(Base):
    __tablename__ = "dataset_registry"
    dataset_id: Mapped[str] = mapped_column(Text, primary_key=True)
    dataset_name: Mapped[str] = mapped_column(Text, nullable=False)
    source_organization: Mapped[str | None] = mapped_column(Text)
    source_url: Mapped[str | None] = mapped_column(Text)
    license: Mapped[str | None] = mapped_column(Text)
    download_date: Mapped[date | None] = mapped_column(Date)
    coverage_period: Mapped[str | None] = mapped_column(Text)
    file_checksum: Mapped[str | None] = mapped_column(Text)
    responsible_person: Mapped[str | None] = mapped_column(Text)


class AuditLog(Base):
    __tablename__ = "audit_log"
    audit_id: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.user_id"))
    action: Mapped[str | None] = mapped_column(Text)
    table_name: Mapped[str | None] = mapped_column(Text)
    record_id: Mapped[str | None] = mapped_column(Text)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime)
    old_value: Mapped[str | None] = mapped_column(Text)
    new_value: Mapped[str | None] = mapped_column(Text)


class CommunityReport(Base):
    __tablename__ = "community_reports"
    report_id: Mapped[str] = mapped_column(Text, primary_key=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    reporter_role: Mapped[str] = mapped_column(Text, nullable=False)
    district: Mapped[str] = mapped_column(Text, nullable=False)
    site_name: Mapped[str | None] = mapped_column(Text)
    latitude: Mapped[float | None] = mapped_column(Double)
    longitude: Mapped[float | None] = mapped_column(Double)
    breeding_source: Mapped[str] = mapped_column(Text, nullable=False)
    water_present: Mapped[bool | None] = mapped_column(Boolean)
    larvae_seen: Mapped[bool | None] = mapped_column(Boolean)
    mosquito_level: Mapped[str | None] = mapped_column(Text)
    action_taken: Mapped[str | None] = mapped_column(Text)
    photo_reference: Mapped[str | None] = mapped_column(Text)
    photo_asset_id: Mapped[str | None] = mapped_column(ForeignKey("media_assets.asset_id"))
    notes: Mapped[str | None] = mapped_column(Text)
    consent_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    review_status: Mapped[str] = mapped_column(Text, nullable=False, default="pending_review")


class AedesSurveillanceRecord(Base):
    __tablename__ = "aedes_surveillance_records"
    record_id: Mapped[str] = mapped_column(Text, primary_key=True)
    site_id: Mapped[str | None] = mapped_column(ForeignKey("sites.site_id"))
    district: Mapped[str] = mapped_column(Text, nullable=False)
    collection_date: Mapped[date] = mapped_column(Date, nullable=False)
    trap_type: Mapped[str] = mapped_column(Text, nullable=False)
    trap_hours: Mapped[float | None] = mapped_column(Double)
    traps_deployed: Mapped[int | None] = mapped_column(Integer)
    containers_inspected: Mapped[int | None] = mapped_column(Integer)
    containers_positive: Mapped[int | None] = mapped_column(Integer)
    eggs_count: Mapped[int | None] = mapped_column(Integer)
    larvae_count: Mapped[int | None] = mapped_column(Integer)
    adults_count: Mapped[int | None] = mapped_column(Integer)
    species: Mapped[str | None] = mapped_column(Text)
    identification_method: Mapped[str | None] = mapped_column(Text)
    collector_code: Mapped[str | None] = mapped_column(Text)
    quality_status: Mapped[str] = mapped_column(Text, nullable=False, default="pending_review")
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class GenomicSample(Base):
    __tablename__ = "genomic_samples"
    sample_id: Mapped[str] = mapped_column(Text, primary_key=True)
    surveillance_record_id: Mapped[str | None] = mapped_column(
        ForeignKey("aedes_surveillance_records.record_id")
    )
    district: Mapped[str] = mapped_column(Text, nullable=False)
    collection_date: Mapped[date] = mapped_column(Date, nullable=False)
    mosquito_species: Mapped[str | None] = mapped_column(Text)
    pool_size: Mapped[int] = mapped_column(Integer, nullable=False)
    extraction_status: Mapped[str] = mapped_column(Text, nullable=False, default="registered")
    sequencing_platform: Mapped[str | None] = mapped_column(Text)
    sequencing_status: Mapped[str] = mapped_column(Text, nullable=False, default="not_started")
    dengue_result: Mapped[str] = mapped_column(Text, nullable=False, default="not_tested")
    dengue_serotype: Mapped[str | None] = mapped_column(Text)
    genome_accession: Mapped[str | None] = mapped_column(Text)
    qc_status: Mapped[str] = mapped_column(Text, nullable=False, default="pending")
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class MediaAsset(Base):
    __tablename__ = "media_assets"
    asset_id: Mapped[str] = mapped_column(Text, primary_key=True)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    original_name: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    uploaded_by: Mapped[str | None] = mapped_column(ForeignKey("users.user_id"))


class GenomicArtifact(Base):
    __tablename__ = "genomic_artifacts"
    artifact_id: Mapped[str] = mapped_column(Text, primary_key=True)
    sample_id: Mapped[str | None] = mapped_column(ForeignKey("genomic_samples.sample_id"))
    artifact_type: Mapped[str] = mapped_column(Text, nullable=False)
    method: Mapped[str | None] = mapped_column(Text)
    software_version: Mapped[str | None] = mapped_column(Text)
    result_value: Mapped[str | None] = mapped_column(Text)
    external_url: Mapped[str | None] = mapped_column(Text)
    file_checksum: Mapped[str | None] = mapped_column(Text)
    review_status: Mapped[str] = mapped_column(Text, nullable=False, default="pending_review")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_by: Mapped[str | None] = mapped_column(ForeignKey("users.user_id"))


class ModelEvaluation(Base):
    __tablename__ = "model_evaluations"
    evaluation_id: Mapped[str] = mapped_column(Text, primary_key=True)
    model_name: Mapped[str] = mapped_column(Text, nullable=False)
    model_version: Mapped[str] = mapped_column(Text, nullable=False)
    evaluation_date: Mapped[date] = mapped_column(Date, nullable=False)
    validation_design: Mapped[str] = mapped_column(Text, nullable=False)
    sensitivity: Mapped[float | None] = mapped_column(Double)
    specificity: Mapped[float | None] = mapped_column(Double)
    precision: Mapped[float | None] = mapped_column(Double)
    recall: Mapped[float | None] = mapped_column(Double)
    f1_score: Mapped[float | None] = mapped_column(Double)
    roc_auc: Mapped[float | None] = mapped_column(Double)
    pr_auc: Mapped[float | None] = mapped_column(Double)
    brier_score: Mapped[float | None] = mapped_column(Double)
    lead_time_days: Mapped[float | None] = mapped_column(Double)
    outcome_definition: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="draft")
    notes: Mapped[str | None] = mapped_column(Text)


class MelObservation(Base):
    __tablename__ = "mel_observations"
    observation_id: Mapped[str] = mapped_column(Text, primary_key=True)
    indicator_code: Mapped[str] = mapped_column(Text, nullable=False)
    observation_date: Mapped[date] = mapped_column(Date, nullable=False)
    value: Mapped[float] = mapped_column(Double, nullable=False)
    unit: Mapped[str] = mapped_column(Text, nullable=False)
    district: Mapped[str | None] = mapped_column(Text)
    data_source: Mapped[str] = mapped_column(Text, nullable=False)
    verification_status: Mapped[str] = mapped_column(Text, nullable=False, default="pending")
    notes: Mapped[str | None] = mapped_column(Text)


class FieldVerificationRecord(Base):
    __tablename__ = "field_verification_records"
    verification_id: Mapped[str] = mapped_column(Text, primary_key=True)
    alert_id: Mapped[str | None] = mapped_column(ForeignKey("alerts.alert_id"))
    district: Mapped[str] = mapped_column(Text, nullable=False)
    site_name: Mapped[str | None] = mapped_column(Text)
    reason_for_visit: Mapped[str] = mapped_column(Text, nullable=False)
    climate_trigger: Mapped[str | None] = mapped_column(Text)
    suspected_vector_group: Mapped[str | None] = mapped_column(Text)
    suspected_breeding_source: Mapped[str | None] = mapped_column(Text)
    checklist_items: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="pending")
    gps_latitude: Mapped[float | None] = mapped_column(Double)
    gps_longitude: Mapped[float | None] = mapped_column(Double)
    photo_notes: Mapped[str | None] = mapped_column(Text)
    larval_inspection_result: Mapped[str | None] = mapped_column(Text)
    adult_collection_result: Mapped[str | None] = mapped_column(Text)
    community_observation: Mapped[str | None] = mapped_column(Text)
    action_taken: Mapped[str | None] = mapped_column(Text)
    final_status: Mapped[str | None] = mapped_column(Text)
    created_date: Mapped[date] = mapped_column(Date, nullable=False)
    completed_date: Mapped[date | None] = mapped_column(Date)
