from __future__ import annotations

from collections.abc import Iterable


def _number(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def summarize_aedes_surveillance(records: Iterable[dict]) -> dict:
    rows = list(records)
    inspected = sum(_number(row.get("containers_inspected")) for row in rows)
    positive = sum(_number(row.get("containers_positive")) for row in rows)
    trap_hours = sum(_number(row.get("trap_hours")) for row in rows)
    traps = sum(_number(row.get("traps_deployed")) for row in rows)
    eggs = sum(_number(row.get("eggs_count")) for row in rows)
    larvae = sum(_number(row.get("larvae_count")) for row in rows)
    adults = sum(_number(row.get("adults_count")) for row in rows)
    effort_rows = sum(
        row.get("trap_hours") is not None or row.get("containers_inspected") is not None
        for row in rows
    )
    validated = sum(row.get("quality_status") == "validated" for row in rows)
    dates = sorted(str(row.get("collection_date")) for row in rows if row.get("collection_date"))

    return {
        "records": len(rows),
        "validated_records": validated,
        "districts": len({row.get("district") for row in rows if row.get("district")}),
        "date_start": dates[0] if dates else None,
        "date_end": dates[-1] if dates else None,
        "counts": {"eggs": int(eggs), "larvae": int(larvae), "adults": int(adults)},
        "effort": {
            "traps_deployed": int(traps),
            "trap_hours": round(trap_hours, 2),
            "containers_inspected": int(inspected),
            "containers_positive": int(positive),
            "coverage_pct": round((effort_rows / len(rows)) * 100, 1) if rows else 0.0,
        },
        "indices": {
            "container_index_pct": round((positive / inspected) * 100, 2) if inspected else None,
            "eggs_per_trap": round(eggs / traps, 2) if traps else None,
            "adults_per_24_trap_hours": round((adults / trap_hours) * 24, 2) if trap_hours else None,
        },
        "interpretation": "Descriptive pilot entomological indices. Epidemiological association requires approved dengue outcomes and prospective validation.",
    }
