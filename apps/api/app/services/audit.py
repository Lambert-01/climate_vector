from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog


def add_audit_event(
    db: AsyncSession,
    *,
    action: str,
    table_name: str,
    record_id: str,
    user_id: str | None = None,
    old_value=None,
    new_value=None,
) -> None:
    db.add(
        AuditLog(
            audit_id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            table_name=table_name,
            record_id=record_id,
            timestamp=datetime.now(timezone.utc).replace(tzinfo=None),
            old_value=json.dumps(old_value, default=str) if old_value is not None else None,
            new_value=json.dumps(new_value, default=str) if new_value is not None else None,
        )
    )
