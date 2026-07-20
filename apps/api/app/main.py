from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import alerts, arboviral, auth, climate, dashboard, dengue, field_verification, live_weather, media, modeling, mosquito, operations, public_data, readiness, resistance, sites, source_registry, summaries

logger = logging.getLogger("dengueew.api")

_sentry_dsn = str(settings.sentry_dsn or "").strip().strip("'\"")
if _sentry_dsn:
    try:
        import sentry_sdk

        sentry_sdk.init(dsn=_sentry_dsn, environment=settings.project_env, traces_sample_rate=0.1)
    except Exception:
        logging.getLogger("dengueew.api").warning("Sentry disabled because SENTRY_DSN is not valid.", exc_info=True)

app = FastAPI(
    title=settings.project_name,
    version="1.0.0",
    description="Climate-informed Aedes surveillance and dengue early-warning proof-of-concept API for Rwanda, with African Great Lakes regional context.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):\d+|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled API error request_id=%s path=%s", request_id, request.url.path)
        raise
    response.headers["X-Request-ID"] = request_id
    return response

for router in [
    dashboard.router,
    sites.router,
    mosquito.router,
    resistance.router,
    alerts.router,
    dengue.router,
    arboviral.router,
    climate.router,
    live_weather.router,
    modeling.router,
    public_data.router,
    readiness.router,
    summaries.router,
    source_registry.router,
    field_verification.router,
    auth.router,
    operations.router,
    media.router,
]:
    app.include_router(router, prefix="/api")


@app.get("/api/health")
async def health() -> dict[str, str]:
    from sqlalchemy import text
    from app.core.database import AsyncSessionLocal

    db_status = "unavailable"
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "unreachable"

    return {"status": "ok", "env": settings.project_env, "database": db_status}
