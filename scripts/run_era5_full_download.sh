#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LOG_DIR="logs"
mkdir -p "$LOG_DIR"

PYTHON_BIN="${PYTHON_BIN:-.venv/bin/python}"

"$PYTHON_BIN" scripts/pipelines/10_download_era5_land_cds.py --start-year 2020 --end-year 2026 2>&1 | tee "$LOG_DIR/era5_land_2020_2026_download.log"
