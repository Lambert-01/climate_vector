from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import alerts, arboviral, climate, dashboard, live_weather, modeling, mosquito, public_data, readiness, resistance, sites, summaries

app = FastAPI(
    title=settings.project_name,
    version="1.0.0",
    description="Climate-informed arboviral and vector preparedness API for the African Great Lakes region.",
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
    arboviral.router,
    climate.router,
    live_weather.router,
    modeling.router,
    public_data.router,
    readiness.router,
    summaries.router,
]:
    app.include_router(router, prefix="/api")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.project_env}
