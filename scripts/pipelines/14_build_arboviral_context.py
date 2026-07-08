from __future__ import annotations

import csv
from collections import Counter
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
POINTS = ROOT / "data" / "processed" / "context" / "great_lakes_points.csv"
NASA_DIR = ROOT / "data" / "external" / "climate" / "nasa_power"
GBIF_DIR = ROOT / "data" / "external" / "vector_occurrence" / "gbif"
OUTDIR = ROOT / "data" / "processed" / "context"


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def read_nasa(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8-sig").splitlines()
    for index, line in enumerate(lines):
        if line.strip() == "-END HEADER-":
            return list(csv.DictReader(lines[index + 1 :]))
    return list(csv.DictReader(lines))


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        return
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def as_float(value: str | None) -> float:
    try:
        parsed = float(str(value).strip())
        return 0.0 if parsed <= -900 else parsed
    except (TypeError, ValueError):
        return 0.0


def as_date(row: dict[str, str]) -> str:
    year = int(float(row.get("YEAR") or 0))
    doy = int(float(row.get("DOY") or 0))
    if not year or not doy:
        return ""
    return str(date(year, 1, 1) + timedelta(days=doy - 1))


def climate_signal(rain_30d: float, tmean: float, rh: float) -> str:
    if rain_30d >= 120 and 20 <= tmean <= 30 and rh >= 65:
        return "high_mosquito_emergence_context"
    if rain_30d >= 60 and 18 <= tmean <= 32:
        return "moderate_mosquito_emergence_context"
    return "routine_monitoring_context"


def build_climate() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for point in read_csv(POINTS):
        path = NASA_DIR / f"{point['point_id']}_daily_climate_2021_2025.csv"
        data = read_nasa(path)
        if not data:
            rows.append(
                {
                    **point,
                    "records": 0,
                    "date_start": "",
                    "date_end": "",
                    "rainfall_mean_daily_mm": "",
                    "rainfall_latest_30d_mm": "",
                    "tmean_mean_c": "",
                    "humidity_mean_pct": "",
                    "climate_signal": "not_downloaded",
                }
            )
            continue
        dates = [as_date(row) for row in data if as_date(row)]
        rainfall = [as_float(row.get("PRECTOTCORR")) for row in data]
        temps = [as_float(row.get("T2M")) for row in data]
        humidity = [as_float(row.get("RH2M")) for row in data]
        rain_30d = sum(rainfall[-30:])
        tmean = sum(temps) / len(temps)
        rh = sum(humidity) / len(humidity)
        rows.append(
            {
                **point,
                "records": len(data),
                "date_start": min(dates),
                "date_end": max(dates),
                "rainfall_mean_daily_mm": round(sum(rainfall) / len(rainfall), 2),
                "rainfall_latest_30d_mm": round(rain_30d, 2),
                "tmean_mean_c": round(tmean, 2),
                "humidity_mean_pct": round(rh, 2),
                "climate_signal": climate_signal(rain_30d, tmean, rh),
            }
        )
    return rows


def vector_group(species: str) -> str:
    text = species.lower()
    if text.startswith("aedes"):
        return "Aedes-borne preparedness"
    if text.startswith("culex"):
        return "Culex/RVF and West Nile context"
    if text.startswith("anopheles"):
        return "Anopheles field-infrastructure context"
    return "Other vector context"


def build_vector_summary() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for path in sorted(GBIF_DIR.glob("*_great_lakes_gbif.csv")):
        data = read_csv(path)
        species = data[0]["species_requested"] if data else path.name.replace("_great_lakes_gbif.csv", "").replace("_", " ").title()
        countries = Counter(row.get("country") or "Unknown" for row in data)
        years = [int(float(row["year"])) for row in data if str(row.get("year", "")).strip()]
        rows.append(
            {
                "species": species,
                "vector_group": vector_group(species),
                "records": len(data),
                "countries": len(countries),
                "top_country": countries.most_common(1)[0][0] if countries else "",
                "year_start": min(years) if years else "",
                "year_end": max(years) if years else "",
                "source": "GBIF public occurrence context",
                "use_boundary": "presence-only context; not local surveillance proof",
            }
        )
    return rows


def build_disease_profiles(climate_rows: list[dict[str, object]], vector_rows: list[dict[str, object]]) -> list[dict[str, object]]:
    aedes_records = sum(int(row["records"]) for row in vector_rows if str(row["species"]).lower().startswith("aedes"))
    culex_records = sum(int(row["records"]) for row in vector_rows if str(row["species"]).lower().startswith("culex"))
    high_climate = sum(1 for row in climate_rows if str(row["climate_signal"]).startswith("high"))
    moderate_climate = sum(1 for row in climate_rows if "moderate" in str(row["climate_signal"]))
    return [
        {
            "disease_group": "Dengue / Chikungunya / Zika",
            "primary_vector": "Aedes aegypti / Aedes albopictus",
            "current_evidence": f"{aedes_records} regional GBIF Aedes records; {high_climate + moderate_climate} climate points with moderate/high mosquito-emergence context",
            "dashboard_claim": "Aedes-borne preparedness context",
            "missing_for_validation": "confirmed cases, ovitrap/container surveys, Aedes infection testing, urban water-storage data",
            "policy_use": "prioritize urban/peri-urban surveillance and community source-reduction planning",
        },
        {
            "disease_group": "Yellow fever",
            "primary_vector": "Aedes vectors",
            "current_evidence": f"{aedes_records} regional Aedes occurrence-context records plus climate/environment layers",
            "dashboard_claim": "preparedness and vaccination-readiness context",
            "missing_for_validation": "vaccination coverage, confirmed yellow-fever surveillance, sylvatic exposure data",
            "policy_use": "support preparedness discussion, not vaccination targeting without official data",
        },
        {
            "disease_group": "Rift Valley fever",
            "primary_vector": "Aedes / Culex vectors",
            "current_evidence": f"{culex_records} regional Culex records; rainfall, land-cover, water-context layers available/planned",
            "dashboard_claim": "One Health rainfall/wetness and livestock-interface watch",
            "missing_for_validation": "livestock density, animal abortion/mortality events, RVF lab confirmation, flood/water extraction",
            "policy_use": "prioritize One Health coordination when heavy rainfall and wetness signals rise",
        },
    ]


def build_readiness() -> list[dict[str, object]]:
    return [
        {
            "layer": "Project entomology infrastructure",
            "status": "available",
            "evidence": "PI mosquito and IR datasets are loaded in the operational database",
            "policy_note": "Useful as Rwanda proof-of-concept vector surveillance infrastructure",
        },
        {
            "layer": "Great Lakes climate points",
            "status": "available",
            "evidence": "NASA POWER daily rainfall, temperature, and humidity for 7 regional points",
            "policy_note": "Regional climate context, not sentinel-site microclimate",
        },
        {
            "layer": "Regional vector occurrence",
            "status": "available_context",
            "evidence": "GBIF Aedes/Culex/Anopheles occurrence records in the Great Lakes bounding box",
            "policy_note": "Presence-only context; not surveillance proof",
        },
        {
            "layer": "Land cover and elevation",
            "status": "available",
            "evidence": "ESA WorldCover and WorldClim elevation files exist locally",
            "policy_note": "Environmental suitability context",
        },
        {
            "layer": "JRC surface water",
            "status": "planned",
            "evidence": "Requires Google Earth Engine export",
            "policy_note": "Do not block MVP; use land-cover water classes and rainfall now",
        },
        {
            "layer": "RBC/MoH arboviral data",
            "status": "formal_access_required",
            "evidence": "No fake case dashboard should be built",
            "policy_note": "Access through approval/data-sharing during PoC",
        },
    ]


def main() -> None:
    climate = build_climate()
    vectors = build_vector_summary()
    diseases = build_disease_profiles(climate, vectors)
    readiness = build_readiness()
    write_csv(OUTDIR / "great_lakes_climate_summary.csv", climate)
    write_csv(OUTDIR / "great_lakes_vector_occurrence_summary.csv", vectors)
    write_csv(OUTDIR / "arboviral_disease_profiles.csv", diseases)
    write_csv(OUTDIR / "arboviral_readiness_layers.csv", readiness)
    print(f"climate_points={len(climate)}")
    print(f"vector_species={len(vectors)}")
    print(f"disease_profiles={len(diseases)}")
    print(f"readiness_layers={len(readiness)}")


if __name__ == "__main__":
    main()
