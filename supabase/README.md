# Supabase


Database schema, RLS policies, and Edge Functions for the marketplace backend.


## What lives here


```
supabase/
├── config.toml        # Local dev configuration
├── .env.local         # Local secrets — gitignored, never commit
├── migrations/        # Numbered SQL migration files
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
│   ├── get-listings/
│   └── manage-listing/
└── .vscode/           # Deno LSP settings — required for IntelliSense (committed)
```


## Setup


### Prerequisites


- Docker Desktop running
- Supabase CLI: `brew install supabase/tap/supabase`


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


## Environment files


### `supabase/.env.local` (required for local development)


This file is **gitignored — never commit it**. Create it manually after cloning:


```bash
touch supabase/.env.local
```


It must contain the following variables:


```
# URL of the locally running ML microservice.
# Cannot use localhost here — the Edge Functions runtime runs inside Docker
# and localhost resolves to the container, not your machine.
# Find your LAN IP with: ipconfig getifaddr en0
ML_SERVICE_URL=http://172.x.x.x:8000


# These are automatically available in the local Supabase runtime and do NOT
# need to be set here. They are listed for reference only.
# SUPABASE_URL=http://127.0.0.1:54321
# SUPABASE_ANON_KEY=<from supabase status>
# SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
```


Run `supabase status` at any time to see your local `anon key` (listed as `Publishable`) and `service_role key` (listed as `Secret`).


> **Note:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the Edge Functions runtime — you only need `ML_SERVICE_URL` in `.env.local`. If you add any variable with a `SUPABASE_` prefix it will be skipped with a warning.


### Cloud secrets (production)


Edge Functions on Railway/Supabase cloud read secrets set via the CLI:


```bash
supabase secrets set ML_SERVICE_URL=https://your-railway-url.railway.app
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```


## Migrations


Files in `migrations/` are applied in numerical order. Always create new migrations with the CLI — never edit existing ones after they've been applied to a shared environment.


```bash
supabase migration new your_migration_name
```


### Migration order


| File | Purpose |
|---|---|
| `001_create_users` | users table + role enum |
| `002_create_categories` | service categories |
| `003_create_listings` | freelancer listings |
| `004_create_pricing_models` | pricing strategy options per listing |
| `005_create_offers` | offer state machine |
| `006_create_transactions` | completed sales |
| `007_create_reviews` | customer reviews |
| `008_create_review_responses` | freelancer replies to reviews |
| `009_create_conversations` | chat conversation groups |
| `010_create_messages` | individual chat messages |
| `011_enable_rls_policies` | all Row Level Security policies |
| `012_seed_data` | demo pricing data for Market Comparator |


## Edge Functions


Edge Functions run on the Deno runtime. They handle business logic that requires atomicity or server-side trust — things like accepting an offer and creating a transaction in one step.


### Serve locally


```bash
supabase functions serve --env-file supabase/.env.local
```


Functions are available at `http://localhost:54321/functions/v1/<function-name>`.


### Deploy to cloud


```bash
supabase functions deploy generate-pricing-report
supabase functions deploy accept-reject-offer
supabase functions deploy submit-review
```


## Testing Edge Functions


Tests are written with Deno's built-in test runner and live alongside each function as `index.test.ts`. They are integration tests — they run against a live local Supabase stack and create their own data dynamically.


### Prerequisites


All three services must be running before you run the tests:


```bash
# Terminal 1 — Supabase local stack
supabase start


# Terminal 2 — Edge Functions runtime
supabase functions serve --env-file supabase/.env.local


# Terminal 3 — ML microservice (required for generate-pricing-report)
cd ml-service
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```


### Run all Edge Function tests


```bash
deno test supabase/functions/ --allow-net --allow-env --ignore=supabase/functions/_shared
```


### Run tests for a single function


```bash
# Pricing report
deno test supabase/functions/generate-pricing-report/index.test.ts --allow-net --allow-env


# Offer lifecycle
deno test supabase/functions/accept-reject-offer/index.test.ts --allow-net --allow-env


# Review submission
deno test supabase/functions/submit-review/index.test.ts --allow-net --allow-env
```


### What is tested


| Function | Test cases |
|---|---|
| `generate-pricing-report` | Happy path report shape, field ordering (min ≤ median ≤ max), missing `category_id`, non-existent category, optional params, wrong HTTP method |
| `accept-reject-offer` | Freelancer accept (+ transaction created), freelancer reject, customer forbidden, missing fields, invalid action, non-existent offer, double-accept (409), double-reject (409), wrong HTTP method |
| `submit-review` | Happy path, duplicate review (409), rating out of range (low + high), profanity in body, incomplete transaction (409), cross-customer forbidden, non-existent transaction, missing fields, wrong HTTP method |


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

