from __future__ import annotations

import csv
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "data" / "processed"
TABLES = ROOT / "outputs" / "tables"
OUT = ROOT / "outputs" / "reports" / "static_dashboard.html"


def read(path: Path, limit: int = 12) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))[:limit]


def read_all(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def table(title: str, path: Path) -> str:
    rows = read(path)
    if not rows:
        return f"<section><h2>{title}</h2><p>No data yet.</p></section>"
    headers = list(rows[0].keys())
    th = "".join(f"<th>{escape(h)}</th>" for h in headers)
    tr = "".join(
        "<tr>" + "".join(f"<td>{escape(str(row.get(h, '')))}</td>" for h in headers) + "</tr>"
        for row in rows
    )
    return f"<section><h2>{title}</h2><table><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></section>"


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    mosquito = read_all(PROCESSED / "mosquito_ecology_preliminary.csv")
    resistance = read_all(PROCESSED / "resistance_test_replicates_preliminary.csv")
    sources = read_all(PROCESSED / "current_data_source_inventory.csv")
    public_sources = read_all(TABLES / "public_data_sources_inventory.csv")
    sites = {row.get("site_raw", "").strip().lower() for row in mosquito if row.get("site_raw")}
    districts = {row.get("district_raw", "").strip().lower() for row in mosquito if row.get("district_raw")}
    ready_items = [row for row in read_all(PROCESSED / "data_readiness_summary.csv") if row.get("ready") == "True"]
    public_available = [row for row in public_sources if row.get("file_count") not in ("", "0")]
    html = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Rwanda Climate-Vector Intelligence Prototype</title>
<style>
body {{ margin:0; font-family: Arial, sans-serif; background:#f5f7f4; color:#172427; }}
header {{ background:#153f3a; color:white; padding:30px 42px; border-bottom:6px solid #d5a642; }}
main {{ max-width:1220px; margin:auto; padding:26px 36px 46px; }}
.grid {{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }}
.card, section {{ background:white; border:1px solid #d9e4de; border-radius:6px; padding:16px; }}
.value {{ font-size:30px; font-weight:700; color:#0f655b; }}
.label {{ color:#50605b; font-size:13px; margin:6px 0 0; }}
.note {{ background:#fff8e8; border:1px solid #ead7a3; padding:14px 16px; border-radius:6px; margin-top:18px; }}
table {{ width:100%; border-collapse:collapse; font-size:13px; }}
th, td {{ border-bottom:1px solid #e6eeee; padding:8px; text-align:left; }}
th {{ background:#eef5f5; }}
section {{ margin-top:18px; }}
@media (max-width:900px) {{ .grid {{ grid-template-columns:repeat(2,1fr); }} }}
</style>
</head>
<body>
<header>
<h1>Rwanda Climate-Vector Intelligence Prototype</h1>
<p>Current-data proof-of-concept using the two PI datasets plus public climate and environmental covariates.</p>
</header>
<main>
<div class="note">
<strong>Scientific position:</strong> this build supports descriptive mosquito ecology, insecticide-exposure summaries, climate suitability screening, and surveillance prioritization. It is not yet a validated mosquito-abundance, resistance, or malaria prediction engine.
</div>
<div class="grid">
<div class="card"><div class="value">{len(mosquito):,}</div><p class="label">Mosquito ecology rows</p></div>
<div class="card"><div class="value">{len(resistance):,}</div><p class="label">Resistance rows</p></div>
<div class="card"><div class="value">{len(sites):,}</div><p class="label">Named sites in PI data</p></div>
<div class="card"><div class="value">{len(districts):,}</div><p class="label">Districts in PI data</p></div>
<div class="card"><div class="value">{len(sources):,}</div><p class="label">Current data sources</p></div>
<div class="card"><div class="value">{len(public_available):,}</div><p class="label">Public covariate layers available</p></div>
<div class="card"><div class="value">{len(ready_items):,}</div><p class="label">Ready evidence groups</p></div>
<div class="card"><div class="value">PoC</div><p class="label">Funding prototype maturity</p></div>
</div>
{table("Current data source inventory", PROCESSED / "current_data_source_inventory.csv")}
{table("Data readiness", PROCESSED / "data_readiness_summary.csv")}
{table("Public covariate inventory", TABLES / "public_data_sources_inventory.csv")}
{table("Mosquito districts", TABLES / "mosquito_district_raw_frequency.csv")}
{table("Breeding-site types", TABLES / "mosquito_breeding_site_type_raw_frequency.csv")}
{table("Anopheles species context", TABLES / "mosquito_anopheles_species_raw_frequency.csv")}
{table("Resistance tests", TABLES / "resistance_insecticide_tested_raw_frequency.csv")}
{table("Deaths after 24h by insecticide", TABLES / "resistance_death_summary_by_insecticide.csv")}
</main>
</body>
</html>
"""
    OUT.write_text(html, encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
