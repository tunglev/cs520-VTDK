/**
 * Integration tests for manage-listing
 *
 * Prerequisites:
 *   - `supabase start` running
 *   - `supabase functions serve --env-file=.env` running
 *
 * Run:
 *   deno test supabase/functions/manage-listing/index.test.ts --allow-net --allow-env --env-file=.env
 */

import { assertEquals, assertExists } from "jsr:@std/assert";

const BASE_URL = "http://localhost:54321/functions/v1/manage-listing";
const AUTH_URL = "http://localhost:54321/auth/v1";
const REST_URL = "http://localhost:54321/rest/v1";

const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!ANON_KEY || !SERVICE_KEY) {
  throw new Error(
    "SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY must be set. Run with: deno test ... --env-file=.env",
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function signUp(email: string): Promise<{ jwt: string; userId: string }> {
  const res = await fetch(`${AUTH_URL}/signup`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "testpassword123" }),
  });
  const data = await res.json();
  assertExists(data.access_token, `Failed to sign up ${email}: ${JSON.stringify(data)}`);
  return { jwt: data.access_token, userId: data.user.id };
}

async function servicePost(table: string, body: unknown) {
  const res = await fetch(`${REST_URL}/${table}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function post(jwt: string, body: unknown) {
  return fetch(BASE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function put(jwt: string, body: unknown) {
  return fetch(BASE_URL, {
    method: "PUT",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function del(jwt: string, body: unknown) {
  return fetch(BASE_URL, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Test Data Setup ───────────────────────────────────────────────────────────

const ts = Date.now();
let CATEGORY_ID: string;
let freelancerJwt: string;

const category = await servicePost("categories", {
  name: `ML Category ${ts}`,
  slug: `ml-cat-${ts}`,
});
assertExists(category.id, "Failed to create test category");
CATEGORY_ID = category.id;

const freelancer = await signUp(`ml_freelancer_${ts}@example.com`);
freelancerJwt = freelancer.jwt;

// ── Tests ─────────────────────────────────────────────────────────────────────

Deno.test("manage-listing — OPTIONS returns 200 for CORS preflight", async () => {
  const res = await fetch(BASE_URL, { method: "OPTIONS" });
  assertEquals(res.status, 200);
  await res.body?.cancel();
});

Deno.test("manage-listing — GET returns 405 Method Not Allowed", async () => {
  const res = await fetch(BASE_URL, {
    method: "GET",
    headers: { Authorization: `Bearer ${freelancerJwt}` },
  });
  assertEquals(res.status, 405);
  await res.body?.cancel();
});

Deno.test("manage-listing — POST without auth returns 401", async () => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category_id: CATEGORY_ID, title: "Test", description: "Desc" }),
  });
  assertEquals(res.status, 401);
  await res.body?.cancel();
});

Deno.test("manage-listing — POST missing required fields returns 400", async () => {
  const res = await post(freelancerJwt, { title: "Missing category and description" });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("manage-listing — POST creates a listing successfully (happy path)", async () => {
  const res = await post(freelancerJwt, {
    category_id: CATEGORY_ID,
    title: `Test Listing ${ts}`,
    description: "A test service listing",
  });
  assertEquals(res.status, 201);
  const body = await res.json();
  assertExists(body.id);
  assertEquals(body.title, `Test Listing ${ts}`);
  assertEquals(body.category_id, CATEGORY_ID);
});

Deno.test("manage-listing — POST creates a listing with pricing models", async () => {
  const res = await post(freelancerJwt, {
    category_id: CATEGORY_ID,
    title: `Priced Listing ${ts}`,
    description: "Listing with pricing",
    pricing_models: [
      { strategy_type: "hourly", base_price: 75.0, unit: "per hour" },
      { strategy_type: "fixed", base_price: 500.0, unit: "flat" },
    ],
  });
  assertEquals(res.status, 201);
  const body = await res.json();
  assertEquals(body.pricing_models.length, 2);
});

Deno.test("manage-listing — PUT without listing id returns 400", async () => {
  const res = await put(freelancerJwt, { title: "No ID provided" });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("manage-listing — PUT updates listing fields successfully", async () => {
  // Create a listing to update
  const createRes = await post(freelancerJwt, {
    category_id: CATEGORY_ID,
    title: `Original Title ${ts}`,
    description: "Original description",
  });
  assertEquals(createRes.status, 201);
  const listing = await createRes.json();

  const res = await put(freelancerJwt, {
    id: listing.id,
    title: `Updated Title ${ts}`,
    is_active: false,
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.title, `Updated Title ${ts}`);
  assertEquals(body.is_active, false);
});

Deno.test("manage-listing — PUT replaces pricing models when provided", async () => {
  const createRes = await post(freelancerJwt, {
    category_id: CATEGORY_ID,
    title: `Pricing Replace ${ts}`,
    description: "For pricing model replacement test",
    pricing_models: [{ strategy_type: "fixed", base_price: 100.0 }],
  });
  assertEquals(createRes.status, 201);
  const listing = await createRes.json();

  const res = await put(freelancerJwt, {
    id: listing.id,
    pricing_models: [
      { strategy_type: "hourly", base_price: 80.0 },
      { strategy_type: "project", base_price: 1200.0 },
    ],
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.pricing_models.length, 2);
  assertEquals(body.pricing_models[0].strategy_type, "hourly");
});

Deno.test("manage-listing — DELETE without id returns 400", async () => {
  const res = await del(freelancerJwt, {});
  assertEquals(res.status, 400);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("manage-listing — DELETE removes listing successfully", async () => {
  const createRes = await post(freelancerJwt, {
    category_id: CATEGORY_ID,
    title: `To Delete ${ts}`,
    description: "This listing will be deleted",
  });
  assertEquals(createRes.status, 201);
  const listing = await createRes.json();

  const deleteRes = await del(freelancerJwt, { id: listing.id });
  assertEquals(deleteRes.status, 200);
  const body = await deleteRes.json();
  assertExists(body.message);
});
