from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import alerts, arboviral, climate, dashboard, dengue, live_weather, modeling, mosquito, public_data, readiness, resistance, sites, summaries, source_registry, field_verification

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
