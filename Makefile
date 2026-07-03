.PHONY: pipeline ingest process dashboard api web install install-api install-web migrate db-revision dev

# ─── Data pipeline ────────────────────────────────────────────────────────────
pipeline: ingest process dashboard

ingest:
	python3 scripts/pipelines/01_ingest_raw_excel.py

process:
	python3 scripts/pipelines/02_build_processed_tables.py

dashboard:
	python3 scripts/pipelines/03_build_static_dashboard.py

# ─── Install ──────────────────────────────────────────────────────────────────
install: install-api install-web

install-api:
	.venv/bin/pip install -r apps/api/requirements.txt

install-web:
	cd apps/web && npm install

# ─── Run servers ──────────────────────────────────────────────────────────────
api:
	cd apps/api && ../../.venv/bin/uvicorn app.main:app --reload --port 8000

web:
	cd apps/web && npm run dev

dev:
	@echo "Start API:  make api"
	@echo "Start Web:  make web"

# ─── Database (Neon) ──────────────────────────────────────────────────────────
migrate:
	.venv/bin/alembic upgrade head

db-revision:
	.venv/bin/alembic revision --autogenerate -m "$(msg)"

db-downgrade:
	.venv/bin/alembic downgrade -1
