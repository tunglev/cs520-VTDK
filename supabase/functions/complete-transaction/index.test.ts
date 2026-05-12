/**
 * Integration tests for complete-transaction
 *
 * Prerequisites:
 *   - `supabase start` running
 *   - `supabase functions serve --env-file=.env` running
 *
 * Run:
 *   deno test supabase/functions/complete-transaction/index.test.ts --allow-net --allow-env --env-file=.env
 */

import { assertEquals, assertExists } from "jsr:@std/assert";

const BASE_URL = "http://localhost:54321/functions/v1/complete-transaction";
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

async function createTransaction(
  customerId: string,
  freelancerId: string,
  categoryId: string,
  completedAt: string | null = null,
): Promise<string> {
  const listing = await servicePost("listings", {
    freelancer_id: freelancerId,
    category_id: categoryId,
    title: "CT Test Listing",
    description: "For complete-transaction tests",
    is_active: true,
  });
  assertExists(listing.id);

  const offer = await servicePost("offers", {
    customer_id: customerId,
    freelancer_id: freelancerId,
    listing_id: listing.id,
    amount: 100,
    status: "active",
    proposed_by: "customer",
  });
  assertExists(offer.id);

  const tx = await servicePost("transactions", {
    offer_id: offer.id,
    customer_id: customerId,
    freelancer_id: freelancerId,
    listing_id: listing.id,
    category_id: categoryId,
    final_price: 100,
    completed_at: completedAt,
  });
  assertExists(tx.id, "Failed to create transaction");
  return tx.id;
}

// ── Test Data Setup ───────────────────────────────────────────────────────────

const ts = Date.now();

const category = await servicePost("categories", {
  name: `CT Category ${ts}`,
  slug: `ct-cat-${ts}`,
});
assertExists(category.id, "Failed to create test category");
const CATEGORY_ID: string = category.id;

// ── Tests ─────────────────────────────────────────────────────────────────────

Deno.test("complete-transaction — GET returns 405 Method Not Allowed", async () => {
  const { jwt } = await signUp(`ct_get_${ts}@example.com`);
  const res = await fetch(BASE_URL, { method: "GET", headers: { Authorization: `Bearer ${jwt}` } });
  assertEquals(res.status, 405);
  await res.body?.cancel();
});

Deno.test("complete-transaction — missing Authorization header returns 401", async () => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction_id: "anything" }),
  });
  assertEquals(res.status, 401);
  await res.body?.cancel();
});

Deno.test("complete-transaction — missing transaction_id returns 400", async () => {
  const { jwt } = await signUp(`ct_missing_${ts}@example.com`);
  const res = await post(jwt, {});
  assertEquals(res.status, 400);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("complete-transaction — non-existent transaction returns 404", async () => {
  const { jwt } = await signUp(`ct_notfound_${ts}@example.com`);
  const res = await post(jwt, { transaction_id: "00000000-0000-0000-0000-000000000000" });
  assertEquals(res.status, 404);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("complete-transaction — freelancer cannot mark transaction complete (403)", async () => {
  const { userId: customerId } = await signUp(`ct_403_c_${ts}@example.com`);
  const { jwt: freelancerJwt, userId: freelancerId } = await signUp(`ct_403_f_${ts}@example.com`);
  const txId = await createTransaction(customerId, freelancerId, CATEGORY_ID);

  const res = await post(freelancerJwt, { transaction_id: txId });
  assertEquals(res.status, 403);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("complete-transaction — already-completed transaction returns 409", async () => {
  const { jwt: customerJwt, userId: customerId } = await signUp(`ct_409_c_${ts}@example.com`);
  const { userId: freelancerId } = await signUp(`ct_409_f_${ts}@example.com`);
  const txId = await createTransaction(
    customerId,
    freelancerId,
    CATEGORY_ID,
    new Date().toISOString(),
  );

  const res = await post(customerJwt, { transaction_id: txId });
  assertEquals(res.status, 409);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("complete-transaction — customer successfully marks transaction complete", async () => {
  const { jwt: customerJwt, userId: customerId } = await signUp(`ct_happy_c_${ts}@example.com`);
  const { userId: freelancerId } = await signUp(`ct_happy_f_${ts}@example.com`);
  const txId = await createTransaction(customerId, freelancerId, CATEGORY_ID);

  const res = await post(customerJwt, { transaction_id: txId });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertExists(body.transaction);
  assertExists(body.transaction.completed_at);
  assertEquals(body.transaction.id, txId);
});

Deno.test("complete-transaction — response transaction has correct customer and freelancer ids", async () => {
  const { jwt: customerJwt, userId: customerId } = await signUp(
    `ct_verify_c_${ts}@example.com`,
  );
  const { userId: freelancerId } = await signUp(`ct_verify_f_${ts}@example.com`);
  const txId = await createTransaction(customerId, freelancerId, CATEGORY_ID);

  const res = await post(customerJwt, { transaction_id: txId });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.transaction.customer_id, customerId);
  assertEquals(body.transaction.freelancer_id, freelancerId);
});
