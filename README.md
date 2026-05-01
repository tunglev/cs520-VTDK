# Fairlance: A Freelance Marketplace

A localized freelance marketplace for the Five College community with transparent pricing reports, market comparisons, and real-time offers.

## Summary

The modern gig economy suffers from a significant lack of price transparency, creating a guessing game for both service providers and consumers. Freelancers often struggle to value their labor accurately due to lack of competitive data, while customers frequently face hidden costs without a benchmark for fairness. This system addresses these inefficiencies by integrating a robust market comparator and anonymous pricing reports into a standard marketplace. By aggregating real-time transaction data and visual analytics, the platform eliminates information asymmetry, ensuring that every handshake is backed by market-validated data rather than guesswork.

The primary stakeholders for this system include independent contractors across various sectors, ranging from digital service like web development to physical trades like landscaping, and the diverse client base seeking their expertise. For the Five College community, this platform serves as a vital economic bridge. It allows students to monetize their flourishing skills at fair campus rates while providing local residents and departments with a transparent way to hire student talent. The system fosters a localized micro-economy, ensuring that the wealth of talent within the Five Colleges is accessible, fairly compensated, and driven by community-specific pricing trends.

## Why this system is needed:

**For Freelancers**: without data, they often underprice themselves to remain competitive and leading to burnout, or overpriced and lost lead.
**For Customers**: Price variance across similar services creates distrust. A pricing report acts as a neutral third party that validates the investment.
For the local economy: standard platforms are globalized, often suppressing local wages. A localized tool keeps commerce within the community by reflecting local cost-of-living and skill levels

## What this is

A three-service monorepo:

| Service | Stack | Hosted on |
|---|---|---|
| `frontend/` | React + TypeScript, Recharts | Vercel |
| `supabase/` | PostgreSQL, Auth, Realtime, Edge Functions | Supabase (AWS) |
| `ml-service/` | Python, FastAPI, scikit-learn, Hugging Face | Railway |

The core differentiator is the **Market Comparator** — an analytics tool that aggregates anonymized transaction data to show freelancers and customers real pricing benchmarks for any service category.

## Project structure

```
freelance-marketplace/
├── frontend/          # React + TypeScript client
├── supabase/          # DB migrations, RLS policies, Edge Functions
├── ml-service/        # FastAPI ML microservice
├── .env.example       # All required environment variables — copy to .env and fill in
└── README.md
```

## Quick start

### Prerequisites

- Node.js v18+
- Python 3.11+
- Docker Desktop (for local Supabase)
- Supabase CLI: `brew install supabase/tap/supabase`

### 1. Clone and install

```bash
git clone https://github.com/your-org/freelance-marketplace
cd freelance-marketplace
```

### 2. Set up environment variables

```bash
cp .env.example .env   # then fill in your values
```

That's it — one file, all three services read from it. See `.env.example` for what each variable does and where to find it.

### 3. Start all three services

**Terminal 1 — Supabase:**
```bash
cd supabase
supabase start
supabase db reset        # applies all migrations + seed data
supabase functions serve # serves Edge Functions locally
```

**Terminal 2 — ML service:**
```bash
cd ml-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:5173`.

## Environment variables

A single root `.env` file (copied from `.env.example`) configures all three services. No per-service env files are needed.

| Variable | Used by | Purpose |
|---|---|---|
| `SUPABASE_URL` | frontend, ml-service, Edge Functions | Supabase project URL |
| `SUPABASE_ANON_KEY` | frontend, supabase tests | Publishable key — safe to expose to the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | ml-service, supabase tests, Edge Functions | Bypasses RLS — never expose to the browser |
| `ML_SERVICE_URL` | supabase Edge Functions | ML microservice endpoint (called server-side only) |
| `PORT` | ml-service | Server port (Railway sets this automatically in production) |
| `ALLOWED_ORIGINS` | ml-service | Comma-separated CORS origins; defaults to localhost for local dev, set to your Vercel URL in production |

> **Never commit `.env`.** The only env file that belongs in the repo is `.env.example`.

## Feature priorities

| Priority | Features |
|---|---|
| P0 | Auth + roles, listings marketplace, transactions, pricing reports |
| P1 | Real-time chat, counteroffering, geographic filtering, reviews |
| P2 | Demand forecasting, recommendation algorithm |

## Deployment

| Service | Platform | Trigger |
|---|---|---|
| Frontend | Vercel | Auto-deploy on push to `main` |
| ML service | Railway | Auto-deploy on push to `main` |
| DB migrations | Supabase | Manual: `supabase db push` |
| Edge Functions | Supabase | Manual: `supabase functions deploy <name>` |

## Contributing

See each service's README for service-specific setup, conventions, and testing instructions.

- [`frontend/README.md`](./frontend/README.md)
- [`supabase/README.md`](./supabase/README.md)
- [`ml-service/README.md`](./ml-service/README.md)

## Backend setup

The ml-service backend is intended to run on Python 3.11. The pinned machine-learning dependencies in [ml-service/requirements.txt](ml-service/requirements.txt) are not a good match for Python 3.13, so create the virtual environment with Python 3.11 before running `pip install -r requirements.txt`.

If you use pyenv, the repository includes [ml-service/.python-version](ml-service/.python-version) to point tools at the supported interpreter.

```bash
cd ml-service
pyenv install 3.11.9
pyenv local 3.11.9
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

