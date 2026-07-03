from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import alerts, climate, dashboard, modeling, mosquito, readiness, resistance, sites, summaries

app = FastAPI(
    title=settings.project_name,
    version="1.0.0",
    description="Climate-informed mosquito risk surveillance API for Rwanda.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
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
    climate.router,
    modeling.router,
    readiness.router,
    summaries.router,
]:
    app.include_router(router, prefix="/api")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.project_env}
