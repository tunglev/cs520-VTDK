# Frontend

React + TypeScript client. Talks to Supabase for all data operations and to the FastAPI ML service for pricing intelligence.

## Prerequisites

- Node.js v18+

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
| `ML_SERVICE_URL` | `import.meta.env.VITE_ML_SERVICE_URL` | ML microservice base URL — used directly by `mlServiceClient` for price prediction, anomaly detection, and service categorization |

The remapping from canonical names to `VITE_` names happens in [vite.config.ts](vite.config.ts) via `define`.

## Testing

Tests are written with [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/). The test environment is `jsdom` (browser-like DOM). Supabase is mocked globally via `src/test/setup.ts`.

### Run all tests

```bash
cd frontend
npm test
```

### Watch mode (during development)

```bash
npm run test:watch
```

### Coverage areas

| Layer | Test files | What is tested |
|---|---|---|
| **Models** | `src/models/**/*.test.ts` | `BaseUser`, `FreelancerUser`, `CustomerUser`, `AdminUser`, `Category`, `ServiceListing`, `Offer`, `Transaction` — hydration, business logic, edge cases |
| **Pricing strategies** | `src/models/pricing/PricingStrategy.test.ts` | `FixedPrice`, `Hourly`, `Project` — price calculation correctness |
| **Reviews & messaging** | `src/models/reviews/ReviewsAndMessaging.test.ts` | `Review`, `ReviewResponse`, `Conversation`, `Message` hydration |
| **Hooks** | `src/hooks/useAuth.test.ts`, `src/hooks/useInactivityLogout.test.ts` | Auth state, user hydration, 15-min inactivity timeout, throttling |
| **Services** | `src/services/repositories/*.test.ts` | `UserRepository.hydrateUser`, `ReportFactory` for customer/freelancer reports |
| **Components** | `src/components/*.test.tsx` | `Spinner`, `ConfirmDeleteModal`, `ListingCard`, `OfferCard`, `OfferModal`, `Navbar`, `Footer`, `PriceScatterPlot` |
| **Data** | `src/data/mockData.test.ts` | Pricing report generation, scatter data, category fallback |

### Adding new tests

- Place test files alongside source files: `src/components/Foo.tsx` → `src/components/Foo.test.tsx`
- Use `vi.mock(...)` to mock Supabase calls or external dependencies
- Wrap components that use routing in `<MemoryRouter>`
- Mock `motion/react` in component tests to avoid animation overhead