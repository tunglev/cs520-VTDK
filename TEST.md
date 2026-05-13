# Testing

This project has three independent test suites — one per service. Run them in any order; they share no state.

## Prerequisites

| Tool | Required by | Install |
|---|---|---|
| Node.js v18+ | Frontend | [nodejs.org](https://nodejs.org) |
| Python 3.11 | ML service | `pyenv install 3.11.9` |
| Docker Desktop | Supabase | [docker.com](https://www.docker.com/products/docker-desktop) |
| Supabase CLI | Supabase | `brew install supabase/tap/supabase` |
| Deno | Supabase Edge Functions | `brew install deno` |

All services read from a single root `.env` file. Copy `.env.example` to `.env` and fill in your values before running any tests.

```bash
cp .env.example .env
```

---

## Frontend — Vitest + Testing Library

Unit and component tests. No running services required — Supabase is fully mocked.

```bash
cd frontend
npm install        # first time only
npm test           # run all tests once
```

**Watch mode** (re-runs on file save):

```bash
npm run test:watch
```

### What is covered

| Layer | What is tested |
|---|---|
| **Models** | `BaseUser`, `FreelancerUser`, `CustomerUser`, `AdminUser`, `Category`, `ServiceListing`, `Offer`, `Transaction` — hydration, business logic, edge cases |
| **Pricing strategies** | `FixedPrice`, `Hourly`, `Project` — price calculation correctness |
| **Reviews & messaging** | `Review`, `ReviewResponse`, `Conversation`, `Message` hydration |
| **Hooks** | Auth state, user hydration, 15-min inactivity timeout, throttling |
| **Services** | `UserRepository.hydrateUser`, `ReportFactory` for customer/freelancer reports |
| **Components** | `Spinner`, `ConfirmDeleteModal`, `ListingCard`, `OfferCard`, `OfferModal`, `Navbar`, `Footer`, `PriceScatterPlot` |
| **Data** | Pricing report generation, scatter data, category fallback |

See [frontend/README.md](./frontend/README.md) for file locations and conventions.

---

## ML Service — pytest

Unit and API integration tests. No running database required — the predictor falls back to its heuristic when no trained model is present.

```bash
cd ml-service
python -m venv .venv          # first time only
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

python -m pytest tests/ -v
```

> **Python version:** Use Python 3.11. Run `python --version` to confirm. If using pyenv, the repo's `ml-service/.python-version` file pins the correct version automatically.

### What is covered

| File | Type | What is tested |
|---|---|---|
| `tests/test_ml_endpoints.py` | API integration | All HTTP endpoints (`/predict-price`, `/detect-anomalies`, `/categorize-service`), validation, edge cases, happy paths |
| `tests/test_price_predictor.py` | Unit | Heuristic fallback, rating multiplier math, price-range invariants, singleton, all 15 known categories |
| `tests/test_anomaly_detector.py` | Unit | Threshold (< 5 prices), extreme outlier detection, response shape, valid index bounds |
| `tests/test_service_categorizer.py` | Unit | Known matches/mismatches, confidence range, all category display names, unknown-slug humanisation |
| `tests/test_schemas.py` | Unit | Pydantic request/response schemas — required fields, boundary validation, type coercion, defaults |
| `tests/test_forecasting.py` | Unit | `ForecastingService` P2 stub contract (`NotImplementedError`), schema defaults |

**Note:** `test_service_categorizer.py` downloads the `all-MiniLM-L6-v2` sentence-transformer (~80 MB) on first run; it is cached automatically for subsequent runs.

See [ml-service/README.md](./ml-service/README.md) for details.

---

## Supabase Edge Functions — Deno

Integration tests that run against a live local Supabase stack. All three services must be running.

### 1. Start all required services

**Terminal 1 — Supabase local stack:**
```bash
supabase start
supabase db reset        # applies all migrations
```

**Terminal 2 — Edge Functions runtime:**
```bash
supabase functions serve --env-file=.env
```

**Terminal 3 — ML microservice** (required only for `generate-pricing-report`):
```bash
cd ml-service
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

### 2. Run all Edge Function tests

```bash
deno test supabase/functions/ --allow-net --allow-env --env-file=.env --ignore=supabase/functions/_shared
```

### 3. Run tests for a single function

```bash
# Pricing report (requires ML service on port 8000)
deno test supabase/functions/generate-pricing-report/index.test.ts --allow-net --allow-env --env-file=.env

# Offer lifecycle (accept / reject)
deno test supabase/functions/accept-reject-offer/index.test.ts --allow-net --allow-env --env-file=.env

# Counter-offer
deno test supabase/functions/counter-offer/index.test.ts --allow-net --allow-env --env-file=.env

# Complete transaction
deno test supabase/functions/complete-transaction/index.test.ts --allow-net --allow-env --env-file=.env

# Review submission
deno test supabase/functions/submit-review/index.test.ts --allow-net --allow-env --env-file=.env

# Manage listing (create / update / delete)
deno test supabase/functions/manage-listing/index.test.ts --allow-net --allow-env --env-file=.env
```

### What is covered

| Function | Test cases |
|---|---|
| `generate-pricing-report` | Happy path report shape, field ordering (min ≤ median ≤ max), missing `category_id`, non-existent category, optional params, wrong HTTP method |
| `accept-reject-offer` | Freelancer accept (+ transaction created), freelancer reject, customer forbidden, missing fields, invalid action, non-existent offer, double-accept (409), double-reject (409), wrong HTTP method |
| `counter-offer` | Happy path (freelancer and customer sides), non-participant forbidden, zero/negative amount (400), non-existent offer (404), counter on already-active offer (409), missing fields, wrong HTTP method |
| `complete-transaction` | Customer successfully marks complete (+ response shape), freelancer forbidden (403), already-completed (409), non-existent transaction (404), missing `transaction_id`, missing auth header, wrong HTTP method |
| `submit-review` | Happy path, duplicate review (409), rating out of range (low + high), profanity in body, incomplete transaction (409), cross-customer forbidden, non-existent transaction, missing fields, wrong HTTP method |
| `manage-listing` | CORS preflight (200), create listing (happy path + with pricing models), update listing fields, replace pricing models on PUT, delete listing, missing fields (400), missing auth (401), wrong HTTP method (405) |

### Notes

- Each test file creates its own users and data at module load time using timestamped emails — tests are fully isolated and can be re-run without conflicts.
- New signups always receive `role: "customer"` from the auth trigger. Tests that need a freelancer promote the user immediately after signup using the service role key.
- Tests do **not** clean up created rows. Run `supabase db reset` to wipe the local database between full test runs if needed.
- The `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` variables must be in `.env` and passed via `--env-file=.env` when running `deno test` (the Supabase runtime injects them automatically for `supabase functions serve`, but not for `deno test`).

See [supabase/README.md](./supabase/README.md) for the full Edge Functions reference.
