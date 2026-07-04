# CDS ERA5-Land Setup

This project is configured to use Copernicus Climate Data Store credentials from environment variables.

## Environment

Add these to `.env`:

```text
CDS_API_URL=https://cds.climate.copernicus.eu/api
CDS_API_KEY=your-personal-access-token
CDS_ERA5_YEAR=2024
CDS_ERA5_MONTH=01
CDS_ERA5_VARIABLES=2m_temperature,2m_dewpoint_temperature,total_precipitation,volumetric_soil_water_layer_1,runoff
```

Keep the real key private. Do not commit `.env`.

## Check Request

Preview the exact request without downloading:

```bash
python3 scripts/pipelines/10_download_era5_land_cds.py --dry-run
```

This writes:

```text
outputs/reports/era5_land_cds_request_preview.json
```

## Download

After accepting the ERA5-Land terms on the CDS website and adding the key:

```bash
python3 scripts/pipelines/10_download_era5_land_cds.py --year 2024 --month 01
```

Output:

```text
data/external/era5_land/raw/era5_land_rwanda_2024_01.nc
```

Use monthly Rwanda-only downloads first. Avoid broad multi-year global downloads until the processing pipeline is ready.

## Full Current Project Range

For this project, the configured range is 2020 through the available part of 2026:

```bash
bash scripts/run_era5_full_download.sh
```

The script is resumable. Existing monthly `.nc` files are skipped automatically.

Expected combined output:

```text
data/external/era5_land/processed/era5_land_rwanda_2020_2026_daily_summary.csv
```

The full range can take hours because CDS queues and generates each request before download.
