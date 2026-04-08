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
├── .env.example       # All required environment variables (copy per service)
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
cp .env.example .env.example   # read the file and create per-service .env files
# See .env.example for which variables go where
```

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

Each service has its own `.env` file. See `.env.example` for the full reference.

| File | Gitignored | Purpose |
|---|---|---|
| `frontend/.env.local` | yes | Supabase URL/anon key, ML service URL |
| `supabase/.env` | yes | CLI access token, service role key, ML service URL |
| `ml-service/.env` | yes | Supabase URL + service role key for DB reads |

> **Never commit any `.env` file.** The `.env.example` file is the only env file that belongs in the repo.

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

