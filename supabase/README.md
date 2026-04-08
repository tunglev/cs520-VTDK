# Supabase

Database schema, RLS policies, and Edge Functions for the marketplace backend.

## What lives here

```
supabase/
├── config.toml        # Local dev configuration
├── migrations/        # Numbered SQL migration files
├── functions/         # Edge Functions (TypeScript, Deno runtime)
│   ├── generate-pricing-report/
│   ├── accept-reject-offer/
│   └── submit-review/
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
supabase functions serve
```

Functions are available at `http://localhost:54321/functions/v1/<function-name>`.

### Deploy to cloud

```bash
supabase functions deploy generate-pricing-report
supabase functions deploy accept-reject-offer
supabase functions deploy submit-review
```

### Secrets

Edge Functions read secrets via `Deno.env.get()`. Set them with:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
supabase secrets set ML_SERVICE_URL=https://your-railway-url.railway.app
```

For local development, secrets are read from `supabase/.env`.

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
