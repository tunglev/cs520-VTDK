# Supabase


Database schema, RLS policies, and Edge Functions for the marketplace backend.


## What lives here


```
supabase/
├── config.toml        # Local dev configuration
├── migrations/        # SQL migration files (timestamp-prefixed, applied in order)
├── functions/         # Edge Functions (TypeScript, Deno runtime)
│   ├── _shared/       # Shared helpers (supabase client, cors headers)
│   ├── generate-pricing-report/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── accept-reject-offer/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── submit-review/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── counter-offer/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── complete-transaction/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── get-listings/
│   └── manage-listing/
└── .vscode/           # Deno LSP settings — required for IntelliSense (committed)
```


## Setup


### Prerequisites


- Docker Desktop running
- Supabase CLI: `brew install supabase/tap/supabase`
- Deno: `brew install deno` (required for running Edge Function tests)


### Link to your cloud project


```bash
supabase login
supabase link --project-ref your-project-ref
```


### Start the local stack


```bash
supabase start
```


This starts a full local Supabase environment (PostgreSQL, Auth, Storage, Edge Functions runtime) via Docker.


### Apply migrations


```bash
supabase db reset   # wipe and re-apply all migrations (includes seed data)
```


To apply incrementally without wiping:


```bash
supabase db push
```


## Environment variables


Copy `.env.example` to `.env` at the repo root and fill in your values — no per-service file needed. Pass `--env-file=.env` when serving or testing Edge Functions (run all commands from the repo root).


```bash
cp .env.example .env   # repo root — fill in your values
```


Run `supabase status` at any time to retrieve your local `anon key` (listed as `Publishable`) and `service_role key` (listed as `Secret`).


> **Note:** When running `supabase functions serve`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the runtime (any `SUPABASE_*` variable you add will be skipped with a warning). However, integration tests run via `deno test` outside this runtime, so those variables must be present in `.env` and loaded with `--env-file=.env`.

> **Docker / localhost:** Edge Functions run inside Docker, so `ML_SERVICE_URL` cannot be `localhost` — it resolves to the container, not your machine. Use `host.docker.internal` instead, which Docker Desktop resolves to the host on Mac and Windows:
> ```
> ML_SERVICE_URL=http://host.docker.internal:8000
> ```


### Cloud secrets (production)


Edge Functions on Railway/Supabase cloud read secrets set via the CLI:


```bash
supabase secrets set ML_SERVICE_URL=https://your-railway-url.railway.app
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```


## Migrations


Files in `migrations/` are applied in ascending timestamp order. Always create new migrations with the CLI — never edit existing ones after they've been applied to a shared environment.


```bash
supabase migration new your_migration_name
```


### Migration order

Migration files are timestamp-prefixed and applied in ascending order. The foundational schema:

| File | Purpose |
|---|---|
| `20250101000001_create_categories` | service category taxonomy |
| `20250101000002_create_users` | users table + role enum (`customer`, `freelancer`, `admin`) |
| `20250101000003_create_listings` | freelancer service listings |
| `20250101000004_create_pricing_models` | pricing strategy options per listing |
| `20250101000005_create_offers` | offer state machine |
| `20250101000006_create_transactions` | completed sales |
| `20250101000007_create_reviews` | customer reviews |
| `20250101000008_create_review_responses` | freelancer replies to reviews |
| `20250101000009_create_conversations` | chat conversation groups |
| `20250101000010_create_messages` | individual chat messages |
| `20250101000011_admin` | admin role setup + all Row Level Security policies |
| `20250101000013_fix_rls_role_checks` | corrects RLS role-check expressions |

Later migrations (prefixed `20260…`) apply incremental fixes (nullable FK columns, additional RLS policies, `proposed_by` column on offers). These run automatically via `supabase db reset` or `supabase db push`.


## Edge Functions


Edge Functions run on the Deno runtime. They handle business logic that requires atomicity or server-side trust — things like accepting an offer and creating a transaction in one step.


### Serve locally


```bash
supabase functions serve --env-file=.env
```


Functions are available at `http://localhost:54321/functions/v1/<function-name>`.


### Deploy to cloud


```bash
supabase functions deploy generate-pricing-report
supabase functions deploy accept-reject-offer
supabase functions deploy submit-review
supabase functions deploy counter-offer
supabase functions deploy complete-transaction
supabase functions deploy manage-listing
```


## Testing Edge Functions


Tests are written with Deno's built-in test runner and live alongside each function as `index.test.ts`. They are integration tests — they run against a live local Supabase stack and create their own data dynamically.


### Prerequisites


All three services must be running before you run the tests:


```bash
# Terminal 1 — Supabase local stack
supabase start


# Terminal 2 — Edge Functions runtime
supabase functions serve --env-file=.env


# Terminal 3 — ML microservice (required for generate-pricing-report)
cd ml-service
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```


### Run all Edge Function tests


```bash
deno test supabase/functions/ --allow-net --allow-env --env-file=.env --ignore=supabase/functions/_shared
```


### Run tests for a single function


```bash
# Pricing report
deno test supabase/functions/generate-pricing-report/index.test.ts --allow-net --allow-env --env-file=.env


# Offer lifecycle
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


### What is tested


| Function | Test cases |
|---|---|
| `generate-pricing-report` | Happy path report shape, field ordering (min ≤ median ≤ max), missing `category_id`, non-existent category, optional params, wrong HTTP method |
| `accept-reject-offer` | Freelancer accept (+ transaction created), freelancer reject, customer forbidden, missing fields, invalid action, non-existent offer, double-accept (409), double-reject (409), wrong HTTP method |
| `submit-review` | Happy path, duplicate review (409), rating out of range (low + high), profanity in body, incomplete transaction (409), cross-customer forbidden, non-existent transaction, missing fields, wrong HTTP method |
| `counter-offer` | Happy path (freelancer and customer sides), non-participant forbidden, zero/negative amount (400), non-existent offer (404), counter on already-active offer (409), missing fields, wrong HTTP method |
| `complete-transaction` | Customer successfully marks complete (+ response shape), freelancer forbidden (403), already-completed (409), non-existent transaction (404), missing `transaction_id`, missing auth header, wrong HTTP method |
| `manage-listing` | CORS preflight (200), create listing (happy path + with pricing models), update listing fields, replace pricing models on PUT, delete listing, missing fields (400), missing auth (401), wrong HTTP method (405) |


### Notes


- Each test file creates its own category and users at module load time using timestamped emails, so tests are fully isolated and can be re-run without conflicts.
- New signups always receive `role: "customer"` from the auth trigger. Tests that need a freelancer call `setRole()` via the service key immediately after signup.
- Tests do **not** clean up created rows. Run `supabase db reset` to wipe the local database between full test runs if needed.


## Row Level Security


All tables have RLS enabled. The general policy structure:


| Role | Can read | Can write |
|---|---|---|
| Customer | Own rows + public freelancer profiles + active listings | Own offers, reviews |
| Freelancer | Own rows + their listings' offers | Own listings, pricing models, review responses |
| Admin | All rows | All rows |
| Unauthenticated | Public freelancer profiles + active listings | Nothing |


Aggregate reads for pricing reports bypass RLS — they go through Edge Functions that use the service role key.


## Realtime


The `messages` and `offers` tables are added to the `supabase_realtime` publication:


```sql
alter publication supabase_realtime add table messages, offers;
```


The frontend subscribes to these tables filtered by `conversation_id` or `freelancer_id`.


## Pushing schema changes


1. Write a new migration file: `supabase migration new your_change`
2. Test locally: `supabase db reset`
3. Regenerate frontend types: `npx supabase gen types typescript --project-id your-ref > ../frontend/src/types/database.types.ts`
4. Push to cloud: `supabase db push`
5. Redeploy any affected Edge Functions

