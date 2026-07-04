from __future__ import annotations

import csv
import math
from functools import lru_cache
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException


router = APIRouter(tags=["live-weather"])

ROOT = Path(__file__).resolve().parents[4]
DISTRICT_COORDS = ROOT / "data" / "external" / "nasa_power" / "rwanda_district_centroids_simple.csv"
SITES = ROOT / "data" / "sites" / "sites.csv"
PUBLIC_FEATURES = ROOT / "data" / "processed" / "public_data_district_features.csv"
OPEN_METEO = "https://api.open-meteo.com/v1/forecast"

CURRENT_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "precipitation",
    "rain",
    "weather_code",
    "wind_speed_10m",
]
HOURLY_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "dew_point_2m",
    "precipitation",
    "rain",
    "soil_moisture_0_to_1cm",
    "et0_fao_evapotranspiration",
]
DAILY_VARS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "rain_sum",
    "et0_fao_evapotranspiration",
]


def _read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def _float(value: str | int | float | None) -> float | None:
    try:
        if value in {None, ""}:
            return None
        result = float(value)
        if math.isnan(result):
            return None
        return result
    except (TypeError, ValueError):
        return None


def _slug(value: str) -> str:
    return value.strip().lower().replace(" ", "_").replace("-", "_")


def _label(value: str) -> str:
    return " ".join(part[:1].upper() + part[1:].lower() for part in value.replace("_", " ").split())


@lru_cache(maxsize=1)
def district_locations() -> list[dict[str, object]]:
    rows = []
    for row in _read_csv(DISTRICT_COORDS):
        lat = _float(row.get("latitude"))
        lon = _float(row.get("longitude"))
        district = row.get("district", "").strip()
        if district and lat is not None and lon is not None:
            rows.append({"id": _slug(district), "name": district, "latitude": lat, "longitude": lon})
    return rows


@lru_cache(maxsize=1)
def site_locations() -> list[dict[str, object]]:
    rows = []
    for row in _read_csv(SITES):
        lat = _float(row.get("latitude"))
        lon = _float(row.get("longitude"))
        site_id = row.get("site_id", "").strip()
        if site_id and lat is not None and lon is not None:
            rows.append(
                {
                    "id": site_id,
                    "name": row.get("site_name") or _label(site_id),
                    "district": row.get("district"),
                    "latitude": lat,
                    "longitude": lon,
                    "coordinate_quality": row.get("coordinate_quality"),
                }
            )
    return rows


@lru_cache(maxsize=1)
def public_features() -> dict[str, dict[str, str]]:
    return {_slug(row.get("district", "")): row for row in _read_csv(PUBLIC_FEATURES)}


def _weather_label(code: int | None) -> str:
    labels = {
        0: "Clear",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Cloudy",
        45: "Fog",
        48: "Fog",
        51: "Drizzle",
        53: "Drizzle",
        55: "Drizzle",
        61: "Rain",
        63: "Rain",
        65: "Heavy rain",
        80: "Showers",
        81: "Showers",
        82: "Heavy showers",
        95: "Storm",
        96: "Storm",
        99: "Storm",
    }
    return labels.get(code or -1, "Variable")


def _nowcast_score(current: dict, daily: dict | None = None) -> float:
    temp = _float(current.get("temperature_2m")) or 0
    rh = _float(current.get("relative_humidity_2m")) or 0
    rain = _float(current.get("precipitation")) or 0
    seven_day_rain = 0.0
    if daily:
        seven_day_rain = sum(_float(v) or 0 for v in daily.get("precipitation_sum", [])[:7])

    temp_score = max(0, 1 - abs(temp - 26) / 12)
    humidity_score = min(1, max(0, (rh - 45) / 40))
    rain_score = min(1, (rain * 0.35) + (seven_day_rain / 65))
    return round(max(0, min(1, 0.45 * temp_score + 0.25 * humidity_score + 0.30 * rain_score)), 3)


def _risk_level(score: float) -> str:
    if score >= 0.68:
        return "high"
    if score >= 0.45:
        return "medium"
    return "low"


def _open_meteo(params: dict[str, object]) -> dict:
    try:
        response = httpx.get(OPEN_METEO, params=params, timeout=20)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Open-Meteo request failed: {exc}") from exc


def _fallback_payload(location: dict, days: int = 7) -> dict:
    feature = public_features().get(_slug(str(location.get("district") or location["name"])), {})
    temp = _float(feature.get("tmean_c_mean")) or 21.0
    rainfall_daily = _float(feature.get("rainfall_mean_daily_mm")) or 2.5
    humidity = 68.0
    hours = [f"offline+{hour:02d}:00" for hour in range(max(24, days * 24))]
    hourly_rain = round(rainfall_daily / 24, 4)
    return {
        "current": {
            "time": "offline-fallback",
            "temperature_2m": round(temp, 2),
            "relative_humidity_2m": humidity,
            "precipitation": hourly_rain,
            "rain": hourly_rain,
            "weather_code": 3,
            "wind_speed_10m": 6.0,
        },
        "hourly": {
            "time": hours,
            "temperature_2m": [round(temp + math.sin(i / 4) * 1.5, 2) for i in range(len(hours))],
            "relative_humidity_2m": [humidity for _ in hours],
            "dew_point_2m": [round(temp - 5.0, 2) for _ in hours],
            "precipitation": [hourly_rain for _ in hours],
            "rain": [hourly_rain for _ in hours],
            "soil_moisture_0_to_1cm": [0.32 for _ in hours],
            "et0_fao_evapotranspiration": [0.08 for _ in hours],
        },
        "daily": {
            "time": [f"day+{index}" for index in range(days)],
            "temperature_2m_max": [round(temp + 4.0, 2) for _ in range(days)],
            "temperature_2m_min": [round(temp - 4.0, 2) for _ in range(days)],
            "precipitation_sum": [round(rainfall_daily, 2) for _ in range(days)],
            "rain_sum": [round(rainfall_daily, 2) for _ in range(days)],
            "et0_fao_evapotranspiration": [2.1 for _ in range(days)],
        },
        "source_status": "offline_fallback",
    }


def _current_row(location: dict, payload: dict) -> dict:
    current = payload.get("current", {})
    score = _nowcast_score(current, payload.get("daily"))
    return {
        "id": location["id"],
        "name": location["name"],
        "district": location.get("district") or location["name"],
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "time": current.get("time"),
        "temperature_c": current.get("temperature_2m"),
        "humidity_pct": current.get("relative_humidity_2m"),
        "precipitation_mm": current.get("precipitation"),
        "rain_mm": current.get("rain"),
        "wind_kmh": current.get("wind_speed_10m"),
        "weather_code": current.get("weather_code"),
        "condition": _weather_label(current.get("weather_code")),
        "nowcast_score": score,
        "risk_level": _risk_level(score),
    }


@router.get("/live-weather/districts")
def live_weather_districts(limit: int = 30) -> dict:
    locations = district_locations()[: max(1, min(limit, 30))]
    if not locations:
        raise HTTPException(status_code=404, detail="No district coordinates available.")

    params = {
        "latitude": ",".join(str(loc["latitude"]) for loc in locations),
        "longitude": ",".join(str(loc["longitude"]) for loc in locations),
        "current": ",".join(CURRENT_VARS),
        "daily": ",".join(DAILY_VARS),
        "timezone": "Africa/Kigali",
        "forecast_days": 7,
    }
    source_status = "live"
    try:
        payload = _open_meteo(params)
    except HTTPException:
        source_status = "offline_fallback"
        payload = [_fallback_payload(location, days=7) for location in locations]
    payloads = payload if isinstance(payload, list) else [payload]
    items = [_current_row(location, item) for location, item in zip(locations, payloads)]
    items.sort(key=lambda row: row["nowcast_score"], reverse=True)
    return {
        "source": "Open-Meteo",
        "source_status": source_status,
        "source_url": "https://open-meteo.com/",
        "items": items,
    }


@router.get("/live-weather/district/{district}")
def live_weather_district(district: str, days: int = 7) -> dict:
    wanted = _slug(district)
    location = next((loc for loc in district_locations() if loc["id"] == wanted), None)
    if not location:
        raise HTTPException(status_code=404, detail=f"No district coordinates for {district}.")

    params = {
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "current": ",".join(CURRENT_VARS),
        "hourly": ",".join(HOURLY_VARS),
        "daily": ",".join(DAILY_VARS),
        "timezone": "Africa/Kigali",
        "forecast_days": max(1, min(days, 16)),
    }
    source_status = "live"
    try:
        payload = _open_meteo(params)
    except HTTPException:
        source_status = "offline_fallback"
        payload = _fallback_payload(location, days=max(1, min(days, 16)))
    return {
        "source": "Open-Meteo",
        "source_status": source_status,
        "location": location,
        "current": _current_row(location, payload),
        "hourly": payload.get("hourly", {}),
        "daily": payload.get("daily", {}),
    }


@router.get("/live-weather/site/{site_id}")
def live_weather_site(site_id: str, days: int = 7) -> dict:
    location = next((loc for loc in site_locations() if loc["id"] == site_id), None)
    if not location:
        raise HTTPException(status_code=404, detail=f"No site coordinates for {site_id}.")

    params = {
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "current": ",".join(CURRENT_VARS),
        "hourly": ",".join(HOURLY_VARS),
        "daily": ",".join(DAILY_VARS),
        "timezone": "Africa/Kigali",
        "forecast_days": max(1, min(days, 16)),
    }
    source_status = "live"
    try:
        payload = _open_meteo(params)
    except HTTPException:
        source_status = "offline_fallback"
        payload = _fallback_payload(location, days=max(1, min(days, 16)))
    return {
        "source": "Open-Meteo",
        "source_status": source_status,
        "location": location,
        "current": _current_row(location, payload),
        "hourly": payload.get("hourly", {}),
        "daily": payload.get("daily", {}),
    }
