from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages" / "climate_vector" / "src"))

from climate_vector.data.xls_biff import write_xls_sheets


RAW_FILES = [
    ROOT / "data" / "raw" / "mosquito_behavior_raw.xls",
    ROOT / "data" / "raw" / "IR_data.xls",
]
OUT_DIR = ROOT / "data" / "interim" / "raw_excel_exports"


def main() -> None:
    for raw in RAW_FILES:
        if raw.exists():
            for path in write_xls_sheets(raw, OUT_DIR):
                print(path)
        else:
            print(f"Missing: {raw}")


if __name__ == "__main__":
    main()

