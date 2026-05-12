/**
 * Integration tests for counter-offer
 *
 * Prerequisites:
 *   - `supabase start` running
 *   - `supabase functions serve --env-file=.env` running
 *
 * Run:
 *   deno test supabase/functions/counter-offer/index.test.ts --allow-net --allow-env --env-file=.env
 */

import { assertEquals, assertExists } from "jsr:@std/assert";

const BASE_URL = "http://localhost:54321/functions/v1/counter-offer";
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
  assertExists(data.access_token, `Failed to sign up ${email}`);
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

async function createPendingOffer(
  customerId: string,
  freelancerId: string,
  categoryId: string,
  proposedBy: "customer" | "freelancer" = "customer",
): Promise<string> {
  const listing = await servicePost("listings", {
    freelancer_id: freelancerId,
    category_id: categoryId,
    title: "Counter-offer Test Listing",
    description: "For counter-offer tests",
    is_active: true,
  });
  assertExists(listing.id, "Failed to create listing");

  const offer = await servicePost("offers", {
    customer_id: customerId,
    freelancer_id: freelancerId,
    listing_id: listing.id,
    amount: 100,
    status: "pending",
    proposed_by: proposedBy,
  });
  assertExists(offer.id, "Failed to create offer");
  return offer.id;
}

// ── Test Data Setup ───────────────────────────────────────────────────────────

const ts = Date.now();

const category = await servicePost("categories", {
  name: `CO Category ${ts}`,
  slug: `co-cat-${ts}`,
});
assertExists(category.id, "Failed to create test category");
const CATEGORY_ID: string = category.id;

// ── Tests ─────────────────────────────────────────────────────────────────────

Deno.test("counter-offer — GET returns 405 Method Not Allowed", async () => {
  const { jwt } = await signUp(`co_get_${ts}@example.com`);
  const res = await fetch(BASE_URL, { method: "GET", headers: { Authorization: `Bearer ${jwt}` } });
  assertEquals(res.status, 405);
  await res.body?.cancel();
});

Deno.test("counter-offer — missing Authorization header returns 401", async () => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offer_id: "anything", amount: 200 }),
  });
  assertEquals(res.status, 401);
  await res.body?.cancel();
});

Deno.test("counter-offer — missing offer_id returns 400", async () => {
  const { jwt } = await signUp(`co_missing_${ts}@example.com`);
  const res = await post(jwt, { amount: 200 });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("counter-offer — zero or negative amount returns 400", async () => {
  const { jwt } = await signUp(`co_negamt_${ts}@example.com`);
  const res = await post(jwt, { offer_id: "00000000-0000-0000-0000-000000000000", amount: 0 });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("counter-offer — non-existent offer returns 404", async () => {
  const { jwt } = await signUp(`co_notfound_${ts}@example.com`);
  const res = await post(jwt, {
    offer_id: "00000000-0000-0000-0000-000000000000",
    amount: 150,
  });
  assertEquals(res.status, 404);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("counter-offer — non-participant returns 400 Forbidden", async () => {
  const { userId: customerId } = await signUp(`co_owner_${ts}@example.com`);
  const { userId: freelancerId } = await signUp(`co_free_${ts}@example.com`);
  const { jwt: outsiderJwt } = await signUp(`co_outsider_${ts}@example.com`);
  const offerId = await createPendingOffer(customerId, freelancerId, CATEGORY_ID, "customer");

  const res = await post(outsiderJwt, { offer_id: offerId, amount: 150 });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("counter-offer — cannot counter an already-active offer (409)", async () => {
  const { userId: customerId } = await signUp(`co_active_c_${ts}@example.com`);
  const { userId: freelancerId } = await signUp(`co_active_f_${ts}@example.com`);

  // Create offer in 'active' status directly via service role
  const listing = await servicePost("listings", {
    freelancer_id: freelancerId,
    category_id: CATEGORY_ID,
    title: "Active listing",
    description: "For active offer test",
    is_active: true,
  });
  const offer = await servicePost("offers", {
    customer_id: customerId,
    freelancer_id: freelancerId,
    listing_id: listing.id,
    amount: 100,
    status: "active",
    proposed_by: "customer",
  });

  // Sign in as freelancer and try to counter
  const { jwt: freelancerJwt } = await signUp(`co_active_f2_${ts}@example.com`);
  const res = await post(freelancerJwt, { offer_id: offer.id, amount: 120 });
  assertEquals(res.status, 409);
});

Deno.test("counter-offer — freelancer successfully counters a customer-proposed offer", async () => {
  const { userId: customerId } = await signUp(`co_happy_c_${ts}@example.com`);
  const { jwt: freelancerJwt, userId: freelancerId } = await signUp(
    `co_happy_f_${ts}@example.com`,
  );
  const offerId = await createPendingOffer(customerId, freelancerId, CATEGORY_ID, "customer");

  const res = await post(freelancerJwt, { offer_id: offerId, amount: 120 });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertEquals(body.amount, 120);
  assertEquals(body.proposed_by, "freelancer");
});

Deno.test("counter-offer — customer successfully counters a freelancer-proposed offer", async () => {
  const { jwt: customerJwt, userId: customerId } = await signUp(`co_cust_c_${ts}@example.com`);
  const { userId: freelancerId } = await signUp(`co_cust_f_${ts}@example.com`);
  const offerId = await createPendingOffer(customerId, freelancerId, CATEGORY_ID, "freelancer");

  const res = await post(customerJwt, { offer_id: offerId, amount: 90 });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertEquals(body.amount, 90);
  assertEquals(body.proposed_by, "customer");
});
