"""dengue pilot operations

Revision ID: a4d9c7e21b6f
Revises: 6277d4b58047
Create Date: 2026-07-20
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a4d9c7e21b6f"
down_revision: Union[str, None] = "6277d4b58047"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "community_reports",
        sa.Column("report_id", sa.Text(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=False),
        sa.Column("reporter_role", sa.Text(), nullable=False),
        sa.Column("district", sa.Text(), nullable=False),
        sa.Column("site_name", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Double(), nullable=True),
        sa.Column("longitude", sa.Double(), nullable=True),
        sa.Column("breeding_source", sa.Text(), nullable=False),
        sa.Column("water_present", sa.Boolean(), nullable=True),
        sa.Column("larvae_seen", sa.Boolean(), nullable=True),
        sa.Column("mosquito_level", sa.Text(), nullable=True),
        sa.Column("action_taken", sa.Text(), nullable=True),
        sa.Column("photo_reference", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("consent_confirmed", sa.Boolean(), nullable=False),
        sa.Column("review_status", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("report_id"),
    )
    op.create_table(
        "aedes_surveillance_records",
        sa.Column("record_id", sa.Text(), nullable=False),
        sa.Column("site_id", sa.Text(), nullable=True),
        sa.Column("district", sa.Text(), nullable=False),
        sa.Column("collection_date", sa.Date(), nullable=False),
        sa.Column("trap_type", sa.Text(), nullable=False),
        sa.Column("trap_hours", sa.Double(), nullable=True),
        sa.Column("traps_deployed", sa.Integer(), nullable=True),
        sa.Column("containers_inspected", sa.Integer(), nullable=True),
        sa.Column("containers_positive", sa.Integer(), nullable=True),
        sa.Column("eggs_count", sa.Integer(), nullable=True),
        sa.Column("larvae_count", sa.Integer(), nullable=True),
        sa.Column("adults_count", sa.Integer(), nullable=True),
        sa.Column("species", sa.Text(), nullable=True),
        sa.Column("identification_method", sa.Text(), nullable=True),
        sa.Column("collector_code", sa.Text(), nullable=True),
        sa.Column("quality_status", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["site_id"], ["sites.site_id"]),
        sa.PrimaryKeyConstraint("record_id"),
    )
    op.create_table(
        "genomic_samples",
        sa.Column("sample_id", sa.Text(), nullable=False),
        sa.Column("surveillance_record_id", sa.Text(), nullable=True),
        sa.Column("district", sa.Text(), nullable=False),
        sa.Column("collection_date", sa.Date(), nullable=False),
        sa.Column("mosquito_species", sa.Text(), nullable=True),
        sa.Column("pool_size", sa.Integer(), nullable=False),
        sa.Column("extraction_status", sa.Text(), nullable=False),
        sa.Column("sequencing_platform", sa.Text(), nullable=True),
        sa.Column("sequencing_status", sa.Text(), nullable=False),
        sa.Column("dengue_result", sa.Text(), nullable=False),
        sa.Column("dengue_serotype", sa.Text(), nullable=True),
        sa.Column("genome_accession", sa.Text(), nullable=True),
        sa.Column("qc_status", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["surveillance_record_id"], ["aedes_surveillance_records.record_id"]),
        sa.PrimaryKeyConstraint("sample_id"),
    )
    op.create_table(
        "model_evaluations",
        sa.Column("evaluation_id", sa.Text(), nullable=False),
        sa.Column("model_name", sa.Text(), nullable=False),
        sa.Column("model_version", sa.Text(), nullable=False),
        sa.Column("evaluation_date", sa.Date(), nullable=False),
        sa.Column("validation_design", sa.Text(), nullable=False),
        sa.Column("sensitivity", sa.Double(), nullable=True),
        sa.Column("specificity", sa.Double(), nullable=True),
        sa.Column("precision", sa.Double(), nullable=True),
        sa.Column("recall", sa.Double(), nullable=True),
        sa.Column("f1_score", sa.Double(), nullable=True),
        sa.Column("roc_auc", sa.Double(), nullable=True),
        sa.Column("pr_auc", sa.Double(), nullable=True),
        sa.Column("brier_score", sa.Double(), nullable=True),
        sa.Column("lead_time_days", sa.Double(), nullable=True),
        sa.Column("outcome_definition", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("evaluation_id"),
    )
    op.create_table(
        "mel_observations",
        sa.Column("observation_id", sa.Text(), nullable=False),
        sa.Column("indicator_code", sa.Text(), nullable=False),
        sa.Column("observation_date", sa.Date(), nullable=False),
        sa.Column("value", sa.Double(), nullable=False),
        sa.Column("unit", sa.Text(), nullable=False),
        sa.Column("district", sa.Text(), nullable=True),
        sa.Column("data_source", sa.Text(), nullable=False),
        sa.Column("verification_status", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("observation_id"),
    )


def downgrade() -> None:
    op.drop_table("mel_observations")
    op.drop_table("model_evaluations")
    op.drop_table("genomic_samples")
    op.drop_table("aedes_surveillance_records")
    op.drop_table("community_reports")
