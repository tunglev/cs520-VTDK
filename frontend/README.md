# Frontend

React + TypeScript client. Talks to Supabase for all data operations and to the FastAPI ML service for pricing intelligence.

## Stack

- **React 18** + TypeScript
- **Vite** — dev server and bundler
- **Supabase JS client** — auth, PostgREST queries, Realtime subscriptions
- **Recharts** — pricing report visualizations
- **React Router** — client-side routing

## Environment variables

Copy `.env.example` to `.env` at the repo root and fill in your values — no per-service file needed. Vite reads the root `.env` directly.

| Variable (in root `.env`) | Exposed as | Purpose |
|---|---|---|
| `SUPABASE_URL` | `import.meta.env.VITE_SUPABASE_URL` | Supabase project URL (auth, PostgREST, Realtime) |
| `SUPABASE_ANON_KEY` | `import.meta.env.VITE_SUPABASE_ANON_KEY` | Publishable key — safe to expose to the browser |

The remapping from canonical names to `VITE_` names happens in [vite.config.ts](vite.config.ts) via `define`. The frontend calls the Supabase Edge Function for ML features — it never contacts the ML service directly.