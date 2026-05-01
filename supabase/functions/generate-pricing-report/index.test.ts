/**
* Integration tests for generate-pricing-report
*
* Prerequisites:
*   - `supabase start` running
*   - `supabase functions serve --env-file=.env` running
*   - ML service running: `uvicorn app.main:app --reload --port 8000 --host 0.0.0.0`
*
* Run:
*   deno test supabase/functions/generate-pricing-report/index.test.ts --allow-net --allow-env --env-file=.env
*/


import { assertEquals, assertExists } from "jsr:@std/assert";


// ── Config ────────────────────────────────────────────────────────────────────


const BASE_URL = "http://localhost:54321/functions/v1/generate-pricing-report";
const AUTH_URL = "http://localhost:54321/auth/v1";
const REST_URL = "http://localhost:54321/rest/v1";


const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");


if (!ANON_KEY || !SERVICE_KEY) {
 throw new Error("SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY must be set. Run tests with: deno test ... --env-file=.env");
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
   headers: {
     Authorization: `Bearer ${jwt}`,
     "Content-Type": "application/json",
   },
   body: JSON.stringify(body),
 });
}


// ── Test Data Setup ───────────────────────────────────────────────────────────


const ts = Date.now();
let CATEGORY_ID: string;
let customerJwt: string;


// Seed a category, two users, and 3 completed transactions before tests run.
// This makes the tests fully self-contained regardless of DB state.
async function setupTestData() {
 // Create a unique category for this test run so results are isolated
 const category = await servicePost("categories", {
   name: `Test Category ${ts}`,
   slug: `test-category-${ts}`,
 });
 assertExists(category.id, "Failed to create test category");
 CATEGORY_ID = category.id;


 // Sign up a customer and a freelancer
 const customer = await signUp(`pr_customer_${ts}@example.com`);
 const freelancer = await signUp(`pr_freelancer_${ts}@example.com`);
 customerJwt = customer.jwt;


 // Create a listing
 const listing = await servicePost("listings", {
   freelancer_id: freelancer.userId,
   category_id: CATEGORY_ID,
   title: "Test Service",
   description: "For pricing report tests",
   is_active: true,
 });


 // Create 3 offers and 3 completed transactions at different prices
 const prices = [100, 150, 200];
 for (const price of prices) {
   const offer = await servicePost("offers", {
     customer_id: customer.userId,
     freelancer_id: freelancer.userId,
     listing_id: listing.id,
     amount: price,
     status: "active",
   });


   await servicePost("transactions", {
     offer_id: offer.id,
     customer_id: customer.userId,
     freelancer_id: freelancer.userId,
     listing_id: listing.id,
     category_id: CATEGORY_ID,
     final_price: price,
     completed_at: new Date().toISOString(),
   });
 }
}


await setupTestData();


// ── Tests ─────────────────────────────────────────────────────────────────────


Deno.test("generate-pricing-report — rejects GET with 405", async () => {
 const res = await fetch(BASE_URL, {
   method: "GET",
   headers: { Authorization: `Bearer ${customerJwt}` },
 });
 assertEquals(res.status, 405);
 await res.body?.cancel();
});


Deno.test("generate-pricing-report — rejects missing category_id", async () => {
 const res = await post(customerJwt, {});
 assertEquals(res.status, 400);
 const body = await res.json();
 assertExists(body.error);
});


Deno.test("generate-pricing-report — returns 404 for category with no data", async () => {
 const res = await post(customerJwt, {
   category_id: "00000000-0000-0000-0000-000000000000",
 });
 assertEquals(res.status, 404);
 const body = await res.json();
 assertExists(body.error);
});


Deno.test("generate-pricing-report — happy path returns full report shape", async () => {
 const res = await post(customerJwt, { category_id: CATEGORY_ID });
 assertEquals(res.status, 200);


 const body = await res.json();
 assertExists(body.categoryId, "Missing categoryId");
 assertExists(body.marketMin, "Missing marketMin");
 assertExists(body.marketMax, "Missing marketMax");
 assertExists(body.marketAvg, "Missing marketAvg");
 assertExists(body.marketMedian, "Missing marketMedian");
 assertExists(body.transactionCount, "Missing transactionCount");
 assertExists(body.prediction, "Missing prediction");
 assertExists(body.anomalies, "Missing anomalies");
});


Deno.test("generate-pricing-report — marketMin <= marketMedian <= marketMax", async () => {
 const res = await post(customerJwt, { category_id: CATEGORY_ID });
 assertEquals(res.status, 200);


 const body = await res.json();
 assertEquals(
   body.marketMin <= body.marketMedian,
   true,
   `marketMin (${body.marketMin}) should be <= marketMedian (${body.marketMedian})`,
 );
 assertEquals(
   body.marketMedian <= body.marketMax,
   true,
   `marketMedian (${body.marketMedian}) should be <= marketMax (${body.marketMax})`,
 );
});


Deno.test("generate-pricing-report — transactionCount matches seeded data", async () => {
 const res = await post(customerJwt, { category_id: CATEGORY_ID });
 assertEquals(res.status, 200);


 const body = await res.json();
 assertEquals(body.transactionCount, 3, "Expected exactly 3 seeded transactions");
});


Deno.test("generate-pricing-report — accepts optional location and rating params", async () => {
 const res = await post(customerJwt, {
   category_id: CATEGORY_ID,
   location: "01003",
   rating: 4.0,
 });
 assertEquals(res.status, 200);
 await res.json();
});

