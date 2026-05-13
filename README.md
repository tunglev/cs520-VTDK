# Fairlance: A Freelance Marketplace

A localized freelance marketplace for the Five College community with transparent pricing reports, market comparisons, and real-time offers.

## Summary

The modern gig economy suffers from a significant lack of price transparency, creating a guessing game for both service providers and consumers. Freelancers often struggle to value their labor accurately due to lack of competitive data, while customers frequently face hidden costs without a benchmark for fairness. This system addresses these inefficiencies by integrating a robust market comparator and anonymous pricing reports into a standard marketplace. By aggregating real-time transaction data and visual analytics, the platform eliminates information asymmetry, ensuring that every handshake is backed by market-validated data rather than guesswork.

The primary stakeholders for this system include independent contractors across various sectors, ranging from digital service like web development to physical trades like landscaping, and the diverse client base seeking their expertise. For the Five College community, this platform serves as a vital economic bridge. It allows students to monetize their flourishing skills at fair campus rates while providing local residents and departments with a transparent way to hire student talent. The system fosters a localized micro-economy, ensuring that the wealth of talent within the Five Colleges is accessible, fairly compensated, and driven by community-specific pricing trends.

## Why this system is needed

**For Freelancers:** without market data, they either underprice themselves to stay competitive (leading to burnout) or overprice and lose leads.
**For Customers:** price variance across similar services creates distrust. A pricing report acts as a neutral third party that validates the investment.
**For the local economy:** standard platforms are globalized, often suppressing local wages. A localized tool keeps commerce within the community by reflecting local cost-of-living and skill levels.

## What this is

A three-service monorepo:

| Service | Stack | Intended platform |
|---|---|---|
| `frontend/` | React + TypeScript, Recharts | Vercel |
| `supabase/` | PostgreSQL, Auth, Realtime, Edge Functions | Supabase (AWS) |
| `ml-service/` | Python, FastAPI, scikit-learn, Hugging Face | Railway |

The core differentiator is the **Market Comparator** — an analytics tool that aggregates anonymized transaction data to show freelancers and customers real pricing benchmarks for any service category.

## Features

### Implemented

| Feature | Description |
|---|---|
| **Auth + roles** | Email/password sign-up and sign-in via Supabase Auth. Users are assigned a `customer` or `freelancer` role; admins have a separate elevated role. |
| **Listings marketplace** | Freelancers create, edit, and deactivate service listings with one or more pricing models (fixed, hourly, project-based). Customers browse and filter listings by category. |
| **Offers + counter-offers** | Customers send offers on listings; freelancers accept, reject, or counter. Either party can counter until one side accepts, creating a negotiation cycle. |
| **Transactions** | Accepting an offer creates a transaction. The customer marks it complete when the work is done, locking in the final price. |
| **Reviews** | Customers submit star-rated reviews (communication, quality, speed) after completing a transaction. Freelancers can post a one-time response. |
| **Market Comparator** | ML-powered pricing reports show market min, median, max, a price distribution chart, and a scatter plot of listings — giving both parties a neutral benchmark before negotiating. |
| **Price prediction** | The ML service predicts a suggested price range for any category + location + rating combination using a trained GradientBoostingRegressor (falls back to category heuristics). |
| **Anomaly detection** | Transaction prices are screened for outliers via Isolation Forest, surfaced in the pricing report. |
| **Service categorization** | When a freelancer creates a listing, the description is semantically validated against the chosen category using a sentence-transformer model. |
| **Real-time chat** | Customers and freelancers can message each other in per-pair conversations. Messages sync in real time via Supabase Realtime. |
| **Inactivity logout** | Users are automatically signed out after 15 minutes of inactivity. |
| **Freelancer profiles** | Public freelancer profile pages show bio, service area, listings, and aggregated review ratings. |

### Planned (not yet implemented)

| Feature | Priority |
|---|---|
| Demand forecasting | P2 — Prophet-based weekly demand predictions per category (stub exists in ML service) |
| Recommendation algorithm | P2 — personalized listing recommendations based on browse history |

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

> A root `Makefile` wraps all common workflows. Run `make help` to see every available target, or `make setup` to install all dependencies in one step.

### Prerequisites

- Node.js v18+
- Python 3.11 (specifically 3.11.x — 3.12+ is not compatible with the pinned ML dependencies)
- Docker Desktop (for local Supabase)
- Supabase CLI: `brew install supabase/tap/supabase`
- Deno: `brew install deno` (for running Supabase Edge Function tests)

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

Each service needs its own terminal. The Makefile has a shortcut for each:

```bash
# Terminal 1
make dev-supabase   # starts Supabase stack + applies migrations + serves Edge Functions

# Terminal 2
make dev-ml         # starts ML service on port 8000

# Terminal 3
make dev-frontend   # starts frontend dev server on port 3000
```

Run `make dev` for a reminder of the above with the exact URLs printed out.

<details>
<summary>Manual commands (without Make)</summary>

**Terminal 1 — Supabase:**
```bash
supabase start
supabase db reset
supabase functions serve --env-file=.env
```

**Terminal 2 — ML service:**
```bash
cd ml-service && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 — Frontend:**
```bash
cd frontend && npm run dev
```
</details>

The app will be running at `http://localhost:3000`.

## Environment variables

A single root `.env` file (copied from `.env.example`) configures all three services. No per-service env files are needed.

| Variable | Used by | Purpose |
|---|---|---|
| `SUPABASE_URL` | frontend, ml-service, Edge Functions | Supabase project URL |
| `SUPABASE_ANON_KEY` | frontend, supabase tests | Publishable key — safe to expose to the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | ml-service, supabase tests, Edge Functions | Bypasses RLS — never expose to the browser |
| `ML_SERVICE_URL` | frontend (as `VITE_ML_SERVICE_URL`), supabase Edge Functions | ML microservice endpoint — called directly by the frontend for price prediction/anomaly detection, and by Edge Functions for pricing reports |
| `PORT` | ml-service | Server port (Railway sets this automatically in production) |
| `ALLOWED_ORIGINS` | ml-service | Comma-separated CORS origins; defaults to localhost for local dev, set to your Vercel URL in production |

> **Never commit `.env`.** The only env file that belongs in the repo is `.env.example`.

## Deployment

> **This project has not yet been deployed to production.** The instructions below describe the intended production setup for when deployment is configured.

| Service | Intended platform | Trigger |
|---|---|---|
| Frontend | Vercel | Auto-deploy on push to `main` |
| ML service | Railway | Auto-deploy on push to `main` (builds from `ml-service/Dockerfile`) |
| DB migrations | Supabase | Manual: `supabase db push` |
| Edge Functions | Supabase | Manual: `supabase functions deploy <name>` |

Use `make deploy` to push DB migrations and deploy all Edge Functions in one step. See [`BUILD.md`](./BUILD.md) for the full deploy reference.

### Building the ML service Docker image locally

The ML service ships as a Docker image. To build and run it locally:

```bash
make build-docker                          # builds image tagged fairlance-ml
docker run --env-file .env -p 8000:8000 fairlance-ml
```

This mirrors exactly what Railway runs in production.

## Testing

Each service has its own test suite. Run them independently. For the full test reference — prerequisites, commands, coverage tables, and troubleshooting notes — see [`TEST.md`](./TEST.md).

### Frontend (Vitest + Testing Library)

```bash
cd frontend
npm test
```

Tests cover: domain models, pricing strategies, React hooks (auth, inactivity logout), UI components (Navbar, Footer, ListingCard, OfferCard, OfferModal, PriceScatterPlot, ConfirmDeleteModal, Spinner), and service/repository layer. Supabase is fully mocked. See [`frontend/README.md`](./frontend/README.md) for details.

### ML service (pytest)

```bash
cd ml-service
source .venv/bin/activate
python -m pytest tests/ -v
```

Tests cover: `PricePredictor` heuristic + singleton, `AnomalyDetector` threshold and outlier logic, `ServiceCategorizer` semantic matching, Pydantic schema validation, and the `ForecastingService` P2 stub contract. See [`ml-service/README.md`](./ml-service/README.md) for details.

### Supabase Edge Functions (Deno)

Edge function tests are **integration tests** that require the local Supabase stack to be running. Start it first:

```bash
supabase start
supabase db reset
supabase functions serve --env-file=.env
```

Then run individual function tests:

```bash
# accept-reject-offer
deno test supabase/functions/accept-reject-offer/index.test.ts --allow-net --allow-env --env-file=.env

# generate-pricing-report (also requires ml-service running on port 8000)
deno test supabase/functions/generate-pricing-report/index.test.ts --allow-net --allow-env --env-file=.env

# submit-review
deno test supabase/functions/submit-review/index.test.ts --allow-net --allow-env --env-file=.env

# manage-listing
deno test supabase/functions/manage-listing/index.test.ts --allow-net --allow-env --env-file=.env

# counter-offer
deno test supabase/functions/counter-offer/index.test.ts --allow-net --allow-env --env-file=.env

# complete-transaction
deno test supabase/functions/complete-transaction/index.test.ts --allow-net --allow-env --env-file=.env

```

Each test file is self-contained: it seeds its own test data and uses timestamped emails to avoid collisions across parallel runs.

## Contributing

See each service's README for service-specific setup, conventions, and testing instructions.

- [`frontend/README.md`](./frontend/README.md)
- [`supabase/README.md`](./supabase/README.md)
- [`ml-service/README.md`](./ml-service/README.md)
- [`BUILD.md`](./BUILD.md) — build and deploy reference for all three services
- [`TEST.md`](./TEST.md) — test commands, coverage tables, and setup notes
- [`API.md`](./API.md) — full API reference: ML service endpoints, Edge Functions, and PostgREST schema

## Backend setup

The ml-service backend requires Python 3.11.x. The pinned ML dependencies (`scikit-learn`, `prophet`, `sentence-transformers`) are not compatible with Python 3.12 or 3.13, so create the virtual environment with Python 3.11 before running `pip install -r requirements.txt`.

If you use pyenv, the repository includes [ml-service/.python-version](ml-service/.python-version) to point tools at the supported interpreter.

```bash
cd ml-service
pyenv install 3.11.9
pyenv local 3.11.9
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

