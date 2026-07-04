# Render + Vercel Deployment Plan

## Target Architecture

```text
Vercel
  React/Vite dashboard
  https://your-frontend.vercel.app
        |
        | VITE_API_BASE=https://your-api.onrender.com/api
        v
Render
  FastAPI backend
  https://your-api.onrender.com
        |
        v
Neon PostgreSQL when migrated and seeded
CSV current-data fallback if database is empty
```

## What Goes Where

### Render

Render hosts the FastAPI backend.

Backend source:

```text
apps/api/
```

Backend command:

```bash
cd apps/api && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The Render docs for FastAPI use a Python web service with `pip install -r requirements.txt` and `uvicorn ... --host 0.0.0.0 --port $PORT`. This repo uses the same pattern, adjusted for the monorepo path.

### Vercel

Vercel hosts the React/Vite frontend.

Frontend source:

```text
apps/web/
```

Build command:

```bash
cd apps/web && npm install && npm run build
```

Output directory:

```text
apps/web/dist
```

Vercel environment variables are configured per project/environment. For Vite, public build-time variables must use the `VITE_` prefix.

## Required GitHub Files

Do not commit:

- `.env`
- raw PI Excel files
- large rasters
- local virtual environments
- node modules

Do commit:

- source code
- `render.yaml`
- `vercel.json`
- `data/processed/*.csv`
- `data/sites/*.csv`
- `outputs/tables/*.csv`
- small public context files that are not ignored

The raw Excel files remain private. The deployed MVP uses sanitized processed CSV extracts.

## Render Setup

1. Push the repository to GitHub.
2. In Render, create a new Blueprint from the repository, or create a Web Service manually.
3. If using manual setup:

```text
Name: rcvis-api
Runtime: Python
Root Directory: leave blank
Build Command: pip install -r apps/api/requirements.txt
Start Command: cd apps/api && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

4. Add environment variables:

```text
PROJECT_ENV=production
PROJECT_NAME=Rwanda Climate-Vector Intelligence System
API_CORS_ORIGINS=https://YOUR-VERCEL-PROJECT.vercel.app
```

Optional if using Neon/PostgreSQL immediately:

```text
DATABASE_URL=postgresql://...
DATABASE_SYNC_URL=postgresql://...
```

Use the Neon connection strings already prepared locally, but keep them only in Render environment variables. Never commit `.env`.

For the MVP, the API can operate from the committed CSV extracts even before database seeding. For the stronger production demo, migrate and seed Neon before connecting Vercel.

5. After deployment, test:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
https://YOUR-RENDER-SERVICE.onrender.com/api/dashboard/stats
```

## Vercel Setup

1. In Vercel, import the same GitHub repository.
2. Keep the repo root as the Vercel root. The included `vercel.json` sets the monorepo build:

```text
Framework Preset: Vite
Root Directory: leave blank
Build Command: cd apps/web && npm install && npm run build
Output Directory: apps/web/dist
```

3. Add the frontend environment variable:

```text
VITE_API_BASE=https://YOUR-RENDER-SERVICE.onrender.com/api
```

4. Deploy.

5. Open the Vercel URL and check:

- Overview loads stats
- Sites shows 30 mapped sites
- Mosquito rows load
- Resistance rows load
- Climate charts load
- Alerts show current-data review signals

## Important Production Notes

- Render free services may sleep after inactivity, so first API load can be slow.
- Vercel environment variable changes require a redeploy.
- CORS must include the exact Vercel domain in `API_CORS_ORIGINS`.
- If Vercel gives preview domains, add them to `API_CORS_ORIGINS` too, separated by commas.
- Do not upload raw PI Excel files to public GitHub.
- Do not claim validated malaria prediction; this is a current-data MVP ready for pilot validation.

## Neon Migration And Seed

Run this locally before or after Render deployment when you want the API to use the database instead of CSV fallback:

```bash
cd /Users/apple/climate_vector_project
source .venv/bin/activate
alembic upgrade head
python3 scripts/pipelines/04_seed_neon.py
```

Then restart the API and check:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/dashboard/stats
```

If the database is unavailable, the API should still serve the current-data CSV extracts.

## Later Upgrade

After the MVP demo works:

1. Add authentication.
2. Add action logging and user roles.
3. Add field verification forms.
4. Add real GPS/date/effort/protocol data from the pilot.
5. Refit the modelling layer with validated outcome fields.
