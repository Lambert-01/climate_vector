"""Persist field verification workflow.

Revision ID: c5e807db8a10
Revises: a4d9c7e21b6f
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "c5e807db8a10"
down_revision: str | None = "a4d9c7e21b6f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "field_verification_records",
        sa.Column("verification_id", sa.Text(), primary_key=True),
        sa.Column("alert_id", sa.Text(), sa.ForeignKey("alerts.alert_id"), nullable=True),
        sa.Column("district", sa.Text(), nullable=False),
        sa.Column("site_name", sa.Text(), nullable=True),
        sa.Column("reason_for_visit", sa.Text(), nullable=False),
        sa.Column("climate_trigger", sa.Text(), nullable=True),
        sa.Column("suspected_vector_group", sa.Text(), nullable=True),
        sa.Column("suspected_breeding_source", sa.Text(), nullable=True),
        sa.Column("checklist_items", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), nullable=False, server_default="pending"),
        sa.Column("gps_latitude", sa.Double(), nullable=True),
        sa.Column("gps_longitude", sa.Double(), nullable=True),
        sa.Column("photo_notes", sa.Text(), nullable=True),
        sa.Column("larval_inspection_result", sa.Text(), nullable=True),
        sa.Column("adult_collection_result", sa.Text(), nullable=True),
        sa.Column("community_observation", sa.Text(), nullable=True),
        sa.Column("action_taken", sa.Text(), nullable=True),
        sa.Column("final_status", sa.Text(), nullable=True),
        sa.Column("created_date", sa.Date(), nullable=False),
        sa.Column("completed_date", sa.Date(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("field_verification_records")
