# Build

This project has three services. Each has its own build process; they are independent of each other.

## Prerequisites

| Tool | Required by | Install |
|---|---|---|
| Node.js v18+ | Frontend | [nodejs.org](https://nodejs.org) |
| Python 3.11 | ML service | `pyenv install 3.11.9` |
| Docker Desktop | ML service (Docker build), Supabase | [docker.com](https://www.docker.com/products/docker-desktop) |
| Supabase CLI | Supabase | `brew install supabase/tap/supabase` |

Set up the root `.env` once before building any service:

```bash
cp .env.example .env   # fill in your values
```

---

## Frontend — Vite

The frontend is a React + TypeScript SPA bundled by Vite. The build reads environment variables from the root `.env` via `vite.config.ts` and inlines them at compile time.

### Development server

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:3000`.

### Production build

```bash
cd frontend
npm install
npm run build
```

Output is written to `frontend/dist/`. The `dist/` directory is what gets deployed to Vercel.

### Type-check (no emit)

```bash
cd frontend
npm run lint
```

Runs `tsc --noEmit` to catch type errors without producing output files.

### Preview the production build locally

```bash
cd frontend
npm run preview
```

Serves the `dist/` output locally so you can verify the production bundle before deploying.

### Clean

```bash
cd frontend
npm run clean
```

Removes `frontend/dist/`.

---

## ML Service — Python / Docker

The ML service is a FastAPI application. It can be run directly with Python for local development or built as a Docker image for production.

### Local development (Python)

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> **Python version:** The pinned version is 3.11.9. If using pyenv, `ml-service/.python-version` sets it automatically. Run `python --version` to confirm before installing.

Interactive API docs are available at `http://localhost:8000/docs`.

### Docker image

Build and run the production Docker image locally:

```bash
cd ml-service
docker build -t fairlance-ml .
docker run --env-file ../.env -p 8000:8000 fairlance-ml
```

The `Dockerfile` uses `python:3.11-slim`, installs `requirements.txt`, and starts the server with `uvicorn` on port 8000. Railway builds this image automatically on push to `main`.

### Train the price prediction model

On first deploy (or when enough new transaction data has accumulated), train and serialize the model:

```bash
cd ml-service
source .venv/bin/activate
python -m app.models.price_predictor --train
```

The trained model is saved to `app/trained_models/price_predictor.pkl`. This directory is gitignored — Railway re-trains on deploy or loads from a mounted volume. The service falls back to a heuristic if no trained model is present.

### Seed demo pricing data

If the database has no transaction data (e.g., a fresh local environment), seed it so the Market Comparator works from day one:

```bash
cd ml-service
source .venv/bin/activate
python -m app.data.seed_loader
```

---

## Supabase — Database + Edge Functions

The Supabase service has no compilation step. "Building" it means applying migrations to the database and deploying Edge Functions.

### Local stack

```bash
supabase start           # starts PostgreSQL, Auth, Storage, Edge Functions via Docker
supabase db reset        # wipes and re-applies all migrations (use for a clean slate)
supabase functions serve --env-file=.env   # serves Edge Functions locally
```

The local API is available at `http://localhost:54321`. Run `supabase status` to see all local endpoints and retrieve the local `anon` and `service_role` keys.

### Apply migrations incrementally (without wiping data)

```bash
supabase db push
```

### Deploy to production

**Database migrations:**
```bash
supabase db push
```

**Edge Functions** (deploy each individually):
```bash
supabase functions deploy generate-pricing-report
supabase functions deploy accept-reject-offer
supabase functions deploy counter-offer
supabase functions deploy complete-transaction
supabase functions deploy submit-review
supabase functions deploy manage-listing
```

**Production secrets** (set once in the Supabase dashboard or via CLI):
```bash
supabase secrets set ML_SERVICE_URL=https://your-railway-url.railway.app
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Regenerate TypeScript types after schema changes

```bash
npx supabase gen types typescript --project-id your-ref > frontend/src/types/database.types.ts
```

Run this from the repo root after any migration that changes the public schema, then commit the updated types file.

---

## Deployment summary

| Service | Platform | How it deploys |
|---|---|---|
| Frontend | Vercel | Auto-deploys on push to `main` |
| ML service | Railway | Auto-deploys on push to `main` (builds from `Dockerfile`) |
| DB migrations | Supabase | Manual: `supabase db push` |
| Edge Functions | Supabase | Manual: `supabase functions deploy <name>` |
