# API Reference

Fairlance exposes three API surfaces:

| Surface | Local base URL | Auth |
|---|---|---|
| [ML Service](#ml-service) | `http://localhost:8000` | None |
| [Edge Functions](#supabase-edge-functions) | `http://localhost:54321/functions/v1` | Supabase JWT (where noted) |
| [PostgREST](#supabase-postgrest) | `http://localhost:54321/rest/v1` | Supabase JWT (RLS enforced) |

**Authentication:** Protected endpoints require an `Authorization: Bearer <jwt>` header. The JWT is issued by Supabase Auth on sign-in and available from the JS client via `supabase.auth.getSession()`.

**CORS:** The ML service allows requests from `http://localhost:5173` and `http://localhost:3000`. Edge Functions allow any origin (`*`) and support OPTIONS preflight.

Interactive ML service docs are available at `http://localhost:8000/docs` when the service is running.

---

## ML Service

FastAPI microservice for pricing intelligence. No authentication required on any endpoint.

---

### `POST /predict-price`

Returns a fair price range for a given service category and freelancer rating.

**Request**

```json
{
  "category": "string",
  "location": "string",
  "rating": 4.5
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `category` | string | yes | Category slug (e.g. `"web-development"`) |
| `location` | string | no | ZIP code or city name; defaults to `""` |
| `rating` | float | no | Freelancer average rating 1.0–5.0; defaults to `4.5` |

**Response `200`**

```json
{
  "minPrice": 65.0,
  "maxPrice": 105.0,
  "suggestedPrice": 85.0
}
```

Uses a trained GradientBoostingRegressor. Falls back to heuristic base prices if no model is trained yet (see `/docs` for the full category list).

---

### `POST /detect-anomalies`

Flags outlier prices in a dataset using Isolation Forest.

**Request**

```json
{
  "prices": [30.0, 85.0, 90.0, 500.0, 75.0]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `prices` | float[] | yes | List of transaction prices; minimum 1 element |

**Response `200`**

```json
{
  "outlierIndices": [3],
  "scores": [-0.12, 0.08, 0.09, -0.45, 0.07]
}
```

Returns empty `outlierIndices` and zero scores when fewer than 5 prices are provided (not enough data to model a distribution).

---

### `POST /categorize-service`

Validates that a service description semantically matches its claimed category using sentence-transformer cosine similarity.

**Request**

```json
{
  "description": "I build responsive React and TypeScript web apps",
  "claimedCategory": "web-development"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `description` | string | yes | The freelancer's service description |
| `claimedCategory` | string | yes | Category slug the freelancer selected |

**Response `200`**

```json
{
  "match": true,
  "confidence": 0.7831
}
```

`match` is `true` when cosine similarity ≥ 0.35. Uses the `all-MiniLM-L6-v2` model.

---

### `GET /health`

Liveness check.

**Response `200`**

```json
{ "status": "ok", "service": "fairlance-ml" }
```

---

## Supabase Edge Functions

Server-side business logic that requires atomicity or elevated trust (service role). All functions are served from the Supabase project URL.

**Auth pattern:** Pass the user's JWT as `Authorization: Bearer <token>`. Endpoints marked *auth required* return `401` if the header is missing or invalid.

---

### `POST /generate-pricing-report`

Aggregates transaction data for a category and returns market benchmarks plus ML predictions. No auth required — uses the service role internally.

**Request**

```json
{
  "category_id": "uuid",
  "location": "string",
  "rating": 4.5
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `category_id` | UUID | no | If omitted, returns market-wide data |
| `location` | string | no | Passed to the ML prediction |
| `rating` | number | no | Passed to the ML prediction; defaults to `4.5` |

**Response `200`**

```json
{
  "categoryId": "uuid",
  "marketMin": 40.0,
  "marketMax": 200.0,
  "marketAvg": 95.0,
  "marketMedian": 90.0,
  "transactionCount": 42,
  "priceDistribution": [
    { "range": "$40–$80", "count": 10, "avg": 62.5 }
  ],
  "scatterData": [
    { "name": "Full-stack web app", "price": 120.0, "rating": 4.8, "reviews": 7 }
  ],
  "prediction": {
    "minPrice": 65.0,
    "maxPrice": 105.0,
    "suggestedPrice": 85.0
  },
  "anomalies": {
    "outlierIndices": [2],
    "scores": [0.08, 0.09, -0.45]
  }
}
```

**Errors**

| Status | Body | When |
|---|---|---|
| 404 | `{ "error": "Not enough data for this category yet." }` | `category_id` provided but no aggregate data exists |

---

### `POST /accept-reject-offer`

Accepts or rejects a pending offer. Auth required. Only the non-proposing participant may respond (a party cannot accept their own proposal).

**Request**

```json
{
  "offer_id": "uuid",
  "action": "accept"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `offer_id` | UUID | yes | |
| `action` | string | yes | `"accept"` or `"reject"` |

**Response `200`**

```json
{
  "success": true,
  "status": "active",
  "transaction": {
    "id": "uuid",
    "offer_id": "uuid",
    "customer_id": "uuid",
    "freelancer_id": "uuid",
    "listing_id": "uuid",
    "category_id": "uuid",
    "final_price": 85.0,
    "completed_at": null
  }
}
```

`transaction` is `null` when `action` is `"reject"`. Accepting creates a transaction record (via service role, bypassing RLS).

**Errors**

| Status | Body | When |
|---|---|---|
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid JWT |
| 400 | `{ "error": "offer_id and action (accept\|reject) are required" }` | Missing fields |
| 404 | `{ "error": "Offer not found" }` | Invalid `offer_id` |
| 400 | `{ "error": "Forbidden: Not a participant" }` | Caller not involved in the offer |
| 200 | `{ "error": "Forbidden: Cannot respond to your own proposal" }` | Caller proposed the current amount |
| 200 | `{ "error": "Offer is already <status>" }` | Offer not in `pending` status |

---

### `POST /counter-offer`

Proposes a new amount on a pending offer. Auth required. The party who proposed the current amount cannot counter — they must wait for the other party to respond.

**Request**

```json
{
  "offer_id": "uuid",
  "amount": 95.0
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `offer_id` | UUID | yes | |
| `amount` | number | yes | Must be > 0 |

**Response `200`**

```json
{
  "success": true,
  "amount": 95.0,
  "proposed_by": "freelancer"
}
```

Updates the offer's `amount` and toggles `proposed_by` to the responding party. Status remains `"pending"`.

**Errors**

| Status | Body | When |
|---|---|---|
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid JWT |
| 400 | `{ "error": "offer_id and a valid positive amount are required" }` | Missing or invalid fields |
| 404 | `{ "error": "Offer not found" }` | Invalid `offer_id` |
| 400 | `{ "error": "Forbidden: Not a participant" }` | Caller not involved in the offer |
| 409 | `{ "error": "Cannot counter an offer that is already <status>" }` | Offer not in `pending` status |
| 200 | `{ "error": "Forbidden: Cannot counter your own proposal. Wait for the other party to respond." }` | Caller proposed the current amount |

---

### `POST /complete-transaction`

Marks a transaction as complete. Auth required. Only the customer on the transaction may call this.

**Request**

```json
{
  "transaction_id": "uuid"
}
```

**Response `200`**

```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "offer_id": "uuid",
    "customer_id": "uuid",
    "freelancer_id": "uuid",
    "listing_id": "uuid",
    "category_id": "uuid",
    "final_price": 85.0,
    "completed_at": "2026-05-13T14:30:00.000Z"
  }
}
```

Sets `completed_at` to the current timestamp via service role (bypasses RLS).

**Errors**

| Status | Body | When |
|---|---|---|
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid JWT |
| 400 | `{ "error": "transaction_id is required" }` | Missing field |
| 404 | `{ "error": "Transaction not found" }` | Invalid `transaction_id` |
| 403 | `{ "error": "Only the customer may mark a transaction complete" }` | Caller is not the customer |
| 409 | `{ "error": "Transaction is already completed" }` | `completed_at` already set |

---

### `POST /submit-review`

Submits a review for a completed transaction. Auth required. One review per transaction; only the customer who owns the transaction may submit.

**Request**

```json
{
  "transaction_id": "uuid",
  "ratings": {
    "communication": 5,
    "quality": 4,
    "speed": 4
  },
  "body": "Great work, delivered on time."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `transaction_id` | UUID | yes | |
| `ratings` | object | yes | Each value must be an integer 1–5 |
| `body` | string | yes | Must not contain disallowed words (e.g. "spam", "scam") |

**Response `200`**

```json
{
  "success": true,
  "review": {
    "id": "uuid",
    "transaction_id": "uuid",
    "customer_id": "uuid",
    "freelancer_id": "uuid",
    "ratings": { "communication": 5, "quality": 4, "speed": 4 },
    "body": "Great work, delivered on time.",
    "created_at": "2026-05-13T14:35:00.000Z"
  }
}
```

`customer_id` and `freelancer_id` are auto-populated from the transaction record.

**Errors**

| Status | Body | When |
|---|---|---|
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid JWT |
| 400 | `{ "error": "transaction_id, ratings, and body are required" }` | Missing fields |
| 400 | `{ "error": "All ratings must be between 1 and 5" }` | Rating value out of range |
| 422 | `{ "error": "Review body contains disallowed content" }` | Body contains banned words |
| 404 | `{ "error": "Transaction not found" }` | Invalid `transaction_id` |
| 409 | `{ "error": "Transaction is not yet completed" }` | `completed_at` is null |
| 409 | `{ "error": "You have already reviewed this transaction" }` | Unique constraint on `transaction_id` |

---

### `POST /manage-listing` — Create

Creates a new listing for the authenticated freelancer.

**Request**

```json
{
  "category_id": "uuid",
  "title": "Full-stack web development",
  "description": "React, TypeScript, Node.js apps from scratch.",
  "pricing_models": [
    { "strategy_type": "hourly", "base_price": 85.0, "unit": "per hour" }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `category_id` | UUID | yes | |
| `title` | string | yes | |
| `description` | string | yes | |
| `pricing_models` | array | no | Defaults to `[]`; each item needs `strategy_type` (`"fixed"` \| `"hourly"` \| `"project"`) and `base_price` (≥ 0) |

**Response `201`** — the created listing with all fields and pricing models.

**Errors**

| Status | Body | When |
|---|---|---|
| 401 | `{ "error": "Unauthorized" }` | Not authenticated |
| 400 | `{ "error": "category_id, title, and description are required." }` | Missing required fields |
| 403 | `{ "error": "<message>" }` | RLS or FK violation |

---

### `PUT /manage-listing` — Update

Updates an existing listing owned by the authenticated freelancer. If `pricing_models` is provided it replaces all existing models.

**Request**

```json
{
  "id": "uuid",
  "title": "Updated title",
  "is_active": false,
  "pricing_models": [
    { "strategy_type": "fixed", "base_price": 500.0, "unit": null }
  ]
}
```

All fields except `id` are optional.

**Response `200`** — the updated listing with all fields and current pricing models.

**Errors**

| Status | Body | When |
|---|---|---|
| 400 | `{ "error": "Listing id is required." }` | Missing `id` |
| 403 | `{ "error": "<message>" }` | Caller does not own the listing |
| 404 | `{ "error": "<message>" }` | Listing not found |

---

### `DELETE /manage-listing` — Delete

Deletes a listing owned by the authenticated freelancer. Cascades to all associated pricing models.

**Request**

```json
{ "id": "uuid" }
```

**Response `200`**

```json
{ "message": "Listing deleted successfully." }
```

**Errors**

| Status | Body | When |
|---|---|---|
| 400 | `{ "error": "Listing id is required." }` | Missing `id` |
| 403 | `{ "error": "<message>" }` | Caller does not own the listing |

---

### `GET /get-listings`

Returns listings with joined category and freelancer profile data. No auth required.

**Query parameters**

| Parameter | Type | Notes |
|---|---|---|
| `id` | UUID | Returns a single listing |
| `freelancer_id` | UUID | Filter by freelancer |
| `category_id` | UUID | Filter by category |
| `include_inactive` | string | Set to `"true"` to include inactive listings; default returns active only |

**Response `200`**

```json
[
  {
    "id": "uuid",
    "freelancer_id": "uuid",
    "category_id": "uuid",
    "title": "Full-stack web development",
    "description": "...",
    "is_active": true,
    "created_at": "2026-05-01T10:00:00.000Z",
    "pricing_models": [
      { "id": "uuid", "listing_id": "uuid", "strategy_type": "hourly", "base_price": 85.0, "unit": "per hour" }
    ],
    "categories": { "name": "Web Development", "slug": "web-development" },
    "users": {
      "business_name": "Dev Studio",
      "avatar_url": "https://...",
      "summary": "10 years building web apps",
      "service_area": "Amherst, MA",
      "zip_code": "01002",
      "created_at": "2026-01-15T00:00:00.000Z"
    }
  }
]
```

When `id` is provided, returns a single object instead of an array. Results are ordered newest-first.

**Errors**

| Status | Body | When |
|---|---|---|
| 404 | `{ "error": "<message>" }` | `id` provided but listing not found |

---

## Supabase PostgREST

The Supabase REST API auto-generates CRUD endpoints for every table at `/rest/v1/<table>`. All requests require the `apikey` header (anon key for browser clients) plus `Authorization: Bearer <jwt>`. Row Level Security enforces access control automatically.

Full PostgREST query syntax (filters, ordering, pagination, joins) is documented at [supabase.com/docs/guides/api](https://supabase.com/docs/guides/api).

### Schema

| Table | Key columns | Notes |
|---|---|---|
| `categories` | `id`, `name`, `slug` | Read by all; written by admin only |
| `users` | `id`, `email`, `role` (`customer`\|`freelancer`\|`admin`), `is_banned`, `business_name`, `summary`, `service_area`, `zip_code`, `avatar_url` | Users see own row + public freelancer fields |
| `listings` | `id`, `freelancer_id`, `category_id`, `title`, `description`, `is_active` | Prefer the `get-listings` Edge Function — it joins categories and user profiles in one call |
| `pricing_models` | `id`, `listing_id`, `strategy_type` (`fixed`\|`hourly`\|`project`), `base_price`, `unit` | Managed via `manage-listing` Edge Function |
| `offers` | `id`, `customer_id`, `freelancer_id`, `listing_id`, `amount`, `scope`, `status` (`pending`\|`active`\|`rejected`\|`expired`), `proposed_by` | Status transitions via `accept-reject-offer` and `counter-offer` |
| `transactions` | `id`, `offer_id`, `customer_id`, `freelancer_id`, `listing_id`, `category_id`, `final_price`, `completed_at` | Inserted by `accept-reject-offer`; completed by `complete-transaction` |
| `reviews` | `id`, `transaction_id`, `customer_id`, `freelancer_id`, `ratings` (jsonb), `body` | One per transaction; submitted via `submit-review` |
| `review_responses` | `id`, `review_id`, `freelancer_id`, `body` (max 500 chars) | Freelancer reply to a review |
| `conversations` | `id`, `customer_id`, `freelancer_id` | Unique per pair |
| `messages` | `id`, `conversation_id`, `sender_id`, `body` | Subscribed to via Supabase Realtime |

### Read-only views

| View | Purpose |
|---|---|
| `pricing_report_aggregates` | Per-category price stats (min, max, avg, p25, median, p75) across completed transactions — used by `generate-pricing-report` |
| `freelancer_rating_aggregates` | Per-freelancer averages for communication, quality, and speed ratings |

### RLS summary

| Table | Customer can | Freelancer can | Unauthenticated can |
|---|---|---|---|
| `users` | Read own + public freelancer fields | Read own + public freelancer fields | Read public freelancer fields |
| `listings` | Read active listings | Read active + own; write/delete own | Read active listings |
| `offers` | Insert + read own | Read their offers; update status | Nothing |
| `transactions` | Read own | Read own | Nothing |
| `reviews` | Insert one per completed transaction; read all | Read all | Read all |
| `review_responses` | Read all | Insert one per review on own profile; read all | Read all |
| `messages` | Read + send in own conversations | Read + send in own conversations | Nothing |

Admins bypass all RLS policies. Aggregate reads for pricing reports go through Edge Functions that use the service role key and never expose raw transaction data.
