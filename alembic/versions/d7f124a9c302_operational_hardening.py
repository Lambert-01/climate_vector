"""Operational authentication, managed media and genomic artifacts.

Revision ID: d7f124a9c302
Revises: c5e807db8a10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d7f124a9c302"
down_revision: str | None = "c5e807db8a10"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "media_assets",
        sa.Column("asset_id", sa.Text(), primary_key=True),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("original_name", sa.Text(), nullable=False),
        sa.Column("content_type", sa.Text(), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.Text(), nullable=False),
        sa.Column("content", sa.LargeBinary(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(), nullable=False),
        sa.Column("uploaded_by", sa.Text(), sa.ForeignKey("users.user_id"), nullable=True),
    )
    op.add_column("community_reports", sa.Column("photo_asset_id", sa.Text(), nullable=True))
    op.create_foreign_key("fk_community_photo_asset", "community_reports", "media_assets", ["photo_asset_id"], ["asset_id"])
    op.create_table(
        "genomic_artifacts",
        sa.Column("artifact_id", sa.Text(), primary_key=True),
        sa.Column("sample_id", sa.Text(), sa.ForeignKey("genomic_samples.sample_id"), nullable=True),
        sa.Column("artifact_type", sa.Text(), nullable=False),
        sa.Column("method", sa.Text(), nullable=True),
        sa.Column("software_version", sa.Text(), nullable=True),
        sa.Column("result_value", sa.Text(), nullable=True),
        sa.Column("external_url", sa.Text(), nullable=True),
        sa.Column("file_checksum", sa.Text(), nullable=True),
        sa.Column("review_status", sa.Text(), nullable=False, server_default="pending_review"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("created_by", sa.Text(), sa.ForeignKey("users.user_id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("genomic_artifacts")
    op.drop_constraint("fk_community_photo_asset", "community_reports", type_="foreignkey")
    op.drop_column("community_reports", "photo_asset_id")
    op.drop_table("media_assets")
