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
CSV current-data MVP files now
PostgreSQL/Neon later when persistent user data is needed
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
npm run build
```

Output directory:

```text
dist
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

For the MVP, the API can operate from the committed CSV extracts even before database seeding.

5. After deployment, test:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
https://YOUR-RENDER-SERVICE.onrender.com/api/dashboard/stats
```

## Vercel Setup

1. In Vercel, import the same GitHub repository.
2. Set:

```text
Framework Preset: Vite
Root Directory: apps/web
Build Command: npm run build
Output Directory: dist
Install Command: npm install
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
- Do not upload raw PI Excel files to public GitHub.
- Do not claim validated malaria prediction; this is a current-data MVP ready for pilot validation.

## Later Upgrade

After the MVP demo works:

1. Add Neon/PostgreSQL.
2. Run Alembic migrations.
3. Seed processed CSVs into database tables.
4. Add authentication.
5. Add action logging and user roles.
6. Add real GPS/date/effort/protocol data from the pilot.
