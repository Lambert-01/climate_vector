from __future__ import annotations

import csv
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


def table(title: str, path: Path) -> str:
    rows = read(path)
    if not rows:
        return f"<section><h2>{title}</h2><p>No data yet.</p></section>"
    headers = list(rows[0].keys())
    th = "".join(f"<th>{h}</th>" for h in headers)
    tr = "".join("<tr>" + "".join(f"<td>{row.get(h, '')}</td>" for h in headers) + "</tr>" for row in rows)
    return f"<section><h2>{title}</h2><table><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></section>"


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    html = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Climate Vector Prototype</title>
<style>
body {{ margin:0; font-family: Arial, sans-serif; background:#f4f7f6; color:#172427; }}
header {{ background:#123944; color:white; padding:28px 40px; }}
main {{ max-width:1180px; margin:auto; padding:24px 36px; }}
.grid {{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }}
.card, section {{ background:white; border:1px solid #dbe5e3; border-radius:6px; padding:16px; }}
.value {{ font-size:30px; font-weight:700; color:#0d6673; }}
table {{ width:100%; border-collapse:collapse; font-size:13px; }}
th, td {{ border-bottom:1px solid #e6eeee; padding:8px; text-align:left; }}
th {{ background:#eef5f5; }}
section {{ margin-top:18px; }}
</style>
</head>
<body>
<header>
<h1>Climate-Informed Mosquito Risk Surveillance Prototype</h1>
<p>Descriptive implementation build. Not a validated prediction engine.</p>
</header>
<main>
<div class="grid">
<div class="card"><div class="value">3,547</div><p>Mosquito ecology records</p></div>
<div class="card"><div class="value">3,547</div><p>Resistance-test records</p></div>
<div class="card"><div class="value">PoC</div><p>Current system maturity</p></div>
</div>
{table("Data readiness", PROCESSED / "data_readiness_summary.csv")}
{table("Mosquito districts", TABLES / "mosquito_district_raw_frequency.csv")}
{table("Breeding-site types", TABLES / "mosquito_breeding_site_type_raw_frequency.csv")}
{table("Raw Anopheles species", TABLES / "mosquito_anopheles_species_raw_frequency.csv")}
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

