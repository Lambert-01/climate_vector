from __future__ import annotations

import collections
import csv
import struct
from pathlib import Path
from typing import Any


def _read_workbook_stream(path: Path) -> bytes:
    data = path.read_bytes()
    if data[:8] != b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1":
        raise ValueError(f"Not an old Excel/OLE file: {path}")

    sector_size = 1 << struct.unpack_from("<H", data, 30)[0]
    mini_sector_size = 1 << struct.unpack_from("<H", data, 32)[0]
    fat_count = struct.unpack_from("<I", data, 44)[0]
    first_dir_sector = struct.unpack_from("<i", data, 48)[0]
    mini_cutoff = struct.unpack_from("<I", data, 56)[0]
    first_mini_fat_sector = struct.unpack_from("<i", data, 60)[0]

    def sector_offset(sector: int) -> int:
        return 512 + sector * sector_size

    difat = [x for x in struct.unpack_from("<109I", data, 76) if x != 0xFFFFFFFF]
    fat: list[int] = []
    for sector in difat[:fat_count]:
        fat.extend(struct.unpack_from(f"<{sector_size // 4}I", data, sector_offset(sector)))

    def chain(start: int) -> list[int]:
        sectors: list[int] = []
        sector = start
        seen: set[int] = set()
        while sector not in (0xFFFFFFFE, 0xFFFFFFFF) and sector >= 0 and sector not in seen:
            seen.add(sector)
            sectors.append(sector)
            if sector >= len(fat):
                break
            sector = fat[sector]
        return sectors

    def read_chain(start: int) -> bytes:
        return b"".join(data[sector_offset(s) : sector_offset(s) + sector_size] for s in chain(start))

    directory = read_chain(first_dir_sector)
    entries: list[tuple[str, int, int, int]] = []
    for offset in range(0, len(directory), 128):
        entry = directory[offset : offset + 128]
        if len(entry) < 128:
            continue
        name_len = struct.unpack_from("<H", entry, 64)[0]
        name = entry[: max(0, name_len - 2)].decode("utf-16le", "ignore") if name_len >= 2 else ""
        start_sector = struct.unpack_from("<i", entry, 116)[0]
        size = struct.unpack_from("<Q", entry, 120)[0]
        entries.append((name, entry[66], start_sector, size))

    root = next(e for e in entries if e[0] == "Root Entry")
    mini_stream = read_chain(root[2])[: root[3]]

    mini_fat: list[int] = []
    if first_mini_fat_sector not in (-1, 0xFFFFFFFF):
        for sector in chain(first_mini_fat_sector):
            mini_fat.extend(struct.unpack_from(f"<{sector_size // 4}I", data, sector_offset(sector)))

    def read_mini(start: int, size: int) -> bytes:
        parts: list[bytes] = []
        sector = start
        seen: set[int] = set()
        while sector not in (0xFFFFFFFE, 0xFFFFFFFF) and sector >= 0 and sector not in seen:
            seen.add(sector)
            offset = sector * mini_sector_size
            parts.append(mini_stream[offset : offset + mini_sector_size])
            if sector >= len(mini_fat):
                break
            sector = mini_fat[sector]
        return b"".join(parts)[:size]

    workbook = next(e for e in entries if e[0] in ("Workbook", "Book"))
    return read_mini(workbook[2], workbook[3]) if workbook[3] < mini_cutoff else read_chain(workbook[2])[: workbook[3]]


def _records(workbook: bytes) -> list[tuple[int, int, bytes]]:
    out = []
    pos = 0
    while pos + 4 <= len(workbook):
        record_type, length = struct.unpack_from("<HH", workbook, pos)
        payload = workbook[pos + 4 : pos + 4 + length]
        out.append((pos, record_type, payload))
        pos = pos + 4 + length
    return out


def _parse_unicode(buffer: bytes, pos: int) -> tuple[str, int]:
    count = struct.unpack_from("<H", buffer, pos)[0]
    pos += 2
    flags = buffer[pos]
    pos += 1
    rich = flags & 0x08
    ext = flags & 0x04
    utf16 = flags & 0x01
    rich_runs = 0
    ext_len = 0
    if rich:
        rich_runs = struct.unpack_from("<H", buffer, pos)[0]
        pos += 2
    if ext:
        ext_len = struct.unpack_from("<I", buffer, pos)[0]
        pos += 4
    raw_len = count * (2 if utf16 else 1)
    raw = buffer[pos : pos + raw_len]
    pos += raw_len
    text = raw.decode("utf-16le" if utf16 else "latin1", "ignore")
    pos += rich_runs * 4 + ext_len
    return text, pos


def _shared_strings(records: list[tuple[int, int, bytes]]) -> list[str]:
    payload = b""
    in_sst = False
    for _, record_type, record_payload in records:
        if record_type == 0x00FC:
            payload += record_payload
            in_sst = True
        elif in_sst and record_type == 0x003C:
            payload += record_payload
        elif in_sst:
            break
    if not payload:
        return []
    _, unique = struct.unpack_from("<II", payload, 0)
    pos = 8
    strings = []
    for _ in range(unique):
        try:
            text, pos = _parse_unicode(payload, pos)
        except Exception:
            break
        strings.append(text)
    return strings


def _sheet_offsets(records: list[tuple[int, int, bytes]]) -> list[tuple[str, int]]:
    sheets = []
    for _, record_type, payload in records:
        if record_type == 0x0085 and len(payload) >= 8:
            stream_offset = struct.unpack_from("<I", payload, 0)[0]
            name_len = payload[6]
            flags = payload[7]
            raw_len = name_len * (2 if flags & 1 else 1)
            raw = payload[8 : 8 + raw_len]
            name = raw.decode("utf-16le" if flags & 1 else "latin1", "ignore")
            sheets.append((name, stream_offset))
    return sheets


def _rk_decode(rk: int) -> float:
    divided = rk & 1
    integer = (rk >> 1) & 1
    if integer:
        value = rk >> 2
        if value & (1 << 29):
            value -= 1 << 30
    else:
        value = struct.unpack("<d", struct.pack("<II", 0, rk & 0xFFFFFFFC))[0]
    return value / 100 if divided else value


def read_xls(path: str | Path) -> dict[str, list[list[Any]]]:
    workbook = _read_workbook_stream(Path(path))
    records = _records(workbook)
    strings = _shared_strings(records)
    sheets = _sheet_offsets(records)
    starts = sorted(offset for _, offset in sheets)
    result: dict[str, list[list[Any]]] = {}

    for index, (name, start) in enumerate(sheets):
        end = starts[index + 1] if index + 1 < len(starts) else len(workbook)
        rows: dict[int, dict[int, Any]] = collections.defaultdict(dict)
        max_col = -1
        for record_pos, record_type, payload in records:
            if record_pos < start or record_pos >= end:
                continue
            if record_type == 0x00FD and len(payload) >= 10:
                row, col, _, string_index = struct.unpack_from("<HHHI", payload, 0)
                rows[row][col] = strings[string_index] if string_index < len(strings) else ""
                max_col = max(max_col, col)
            elif record_type == 0x0203 and len(payload) >= 14:
                row, col, _ = struct.unpack_from("<HHH", payload, 0)
                rows[row][col] = struct.unpack_from("<d", payload, 6)[0]
                max_col = max(max_col, col)
            elif record_type == 0x027E and len(payload) >= 10:
                row, col, _ = struct.unpack_from("<HHH", payload, 0)
                rows[row][col] = _rk_decode(struct.unpack_from("<I", payload, 6)[0])
                max_col = max(max_col, col)
            elif record_type == 0x00BD and len(payload) >= 6:
                row, first_col = struct.unpack_from("<HH", payload, 0)
                last_col = payload[-1]
                pos = 4
                for col in range(first_col, last_col + 1):
                    if pos + 6 <= len(payload) - 1:
                        rows[row][col] = _rk_decode(struct.unpack_from("<I", payload, pos + 2)[0])
                        max_col = max(max_col, col)
                        pos += 6

        result[name] = [[rows[r].get(c, "") for c in range(max_col + 1)] for r in sorted(rows)]
    return result


def write_xls_sheets(path: str | Path, out_dir: str | Path) -> list[Path]:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    written = []
    for sheet_name, rows in read_xls(path).items():
        safe = "".join(ch.lower() if ch.isalnum() else "_" for ch in sheet_name).strip("_") or "sheet"
        target = out / f"{Path(path).stem}_{safe}.csv"
        with target.open("w", newline="", encoding="utf-8") as handle:
            csv.writer(handle).writerows(rows)
        written.append(target)
    return written

