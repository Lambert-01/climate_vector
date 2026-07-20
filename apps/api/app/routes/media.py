from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import Principal, get_current_principal, require_roles
from app.models import MediaAsset
from app.services.audit import add_audit_event

router = APIRouter(prefix="/media", tags=["managed media"])
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/community-photo", status_code=201)
async def upload_community_photo(
    photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(require_roles("admin", "field_officer", "data_manager")),
) -> dict:
    if photo.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(415, "Only JPEG, PNG and WebP images are accepted.")
    content = await photo.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if not content:
        raise HTTPException(422, "The uploaded image is empty.")
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f"Image exceeds the {settings.max_upload_mb} MB limit.")
    asset = MediaAsset(
        asset_id=str(uuid.uuid4()), purpose="community_breeding_site",
        original_name=(photo.filename or "community-photo")[:255], content_type=photo.content_type,
        size_bytes=len(content), sha256=hashlib.sha256(content).hexdigest(), content=content,
        uploaded_at=datetime.now(timezone.utc).replace(tzinfo=None), uploaded_by=principal.user_id if principal.auth_method == "jwt" else None,
    )
    db.add(asset)
    add_audit_event(db, action="upload", table_name="media_assets", record_id=asset.asset_id, user_id=asset.uploaded_by, new_value={"content_type": asset.content_type, "size_bytes": asset.size_bytes, "sha256": asset.sha256})
    await db.commit()
    return {"asset_id": asset.asset_id, "url": f"/api/media/{asset.asset_id}", "content_type": asset.content_type, "size_bytes": asset.size_bytes, "sha256": asset.sha256}


@router.get("/{asset_id}")
async def get_media(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    _principal: Principal = Depends(get_current_principal),
) -> Response:
    asset = await db.get(MediaAsset, asset_id)
    if not asset:
        raise HTTPException(404, "Media asset not found.")
    return Response(content=asset.content, media_type=asset.content_type, headers={"Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff"})
