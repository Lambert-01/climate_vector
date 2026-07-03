from __future__ import annotations

import csv
from collections import Counter, defaultdict
from pathlib import Path


def norm(value: object) -> str:
    return " ".join(str(value or "").strip().split())


def read_records(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.reader(handle))
    if not rows:
        return []
    headers = [norm(h) for h in rows[0]]
    records = []
    for row in rows[1:]:
        padded = row + [""] * (len(headers) - len(row))
        records.append({headers[i]: norm(padded[i]) for i in range(len(headers))})
    return records


def write_records(path: Path, rows: list[dict[str, object]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def frequency(records: list[dict[str, object]], field: str) -> list[dict[str, object]]:
    counts = Counter(norm(row.get(field, "")) for row in records if norm(row.get(field, "")))
    return [{"value": value, "count": count} for value, count in counts.most_common()]


def numeric_summary(records: list[dict[str, object]], group_field: str, value_field: str) -> list[dict[str, object]]:
    grouped: dict[str, list[float]] = defaultdict(list)
    for row in records:
        group = norm(row.get(group_field, ""))
        try:
            value = float(norm(row.get(value_field, "")))
        except ValueError:
            continue
        if group:
            grouped[group].append(value)
    return [
        {
            group_field: group,
            "records": len(values),
            "mean": round(sum(values) / len(values), 3),
            "min": min(values),
            "max": max(values),
        }
        for group, values in sorted(grouped.items())
    ]

