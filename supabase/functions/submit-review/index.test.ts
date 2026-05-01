/**
* Integration tests for submit-review
*
* Prerequisites:
*   - `supabase start` running
*   - `supabase functions serve --env-file=.env` running
*
* Run:
*   deno test supabase/functions/submit-review/index.test.ts --allow-net --allow-env --env-file=.env
*/


import { assertEquals, assertExists } from "jsr:@std/assert";


const BASE_URL = "http://localhost:54321/functions/v1/submit-review";
const AUTH_URL = "http://localhost:54321/auth/v1";
const REST_URL = "http://localhost:54321/rest/v1";


const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");


if (!ANON_KEY || !SERVICE_KEY) {
 throw new Error("SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY must be set. Run tests with: deno test ... --env-file=.env");
}


const ts = Date.now();
let CATEGORY_ID: string;


const VALID_RATINGS = { communication: 4, quality: 5, speed: 3 };
const VALID_BODY = "Great work, very professional and delivered on time.";


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


async function setRole(userId: string, role: "customer" | "freelancer") {
 await fetch(`${REST_URL}/users?id=eq.${userId}`, {
   method: "PATCH",
   headers: {
     apikey: SERVICE_KEY,
     Authorization: `Bearer ${SERVICE_KEY}`,
     "Content-Type": "application/json",
   },
   body: JSON.stringify({ role }),
 });
}


async function signUpAsFreelancer(email: string): Promise<{ jwt: string; userId: string }> {
 const user = await signUp(email);
 await setRole(user.userId, "freelancer");
 return user;
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


async function createCompletedTransaction(customerId: string, freelancerId: string): Promise<string> {
 const listing = await servicePost("listings", {
   freelancer_id: freelancerId,
   category_id: CATEGORY_ID,
   title: "Review Test Listing",
   description: "For submit-review tests",
   is_active: true,
 });
 assertExists(listing.id, "Failed to create listing");


 const offer = await servicePost("offers", {
   customer_id: customerId,
   freelancer_id: freelancerId,
   listing_id: listing.id,
   amount: 100,
   status: "active",
 });
 assertExists(offer.id, "Failed to create offer");


 const tx = await servicePost("transactions", {
   offer_id: offer.id,
   customer_id: customerId,
   freelancer_id: freelancerId,
   listing_id: listing.id,
   category_id: CATEGORY_ID,
   final_price: 100,
   completed_at: new Date().toISOString(),
 });
 assertExists(tx.id, "Failed to create transaction");
 return tx.id;
}


async function createIncompleteTransaction(customerId: string, freelancerId: string): Promise<string> {
 const listing = await servicePost("listings", {
   freelancer_id: freelancerId,
   category_id: CATEGORY_ID,
   title: "Incomplete Listing",
   description: "For submit-review tests",
   is_active: true,
 });


 const offer = await servicePost("offers", {
   customer_id: customerId,
   freelancer_id: freelancerId,
   listing_id: listing.id,
   amount: 100,
   status: "active",
 });


 const tx = await servicePost("transactions", {
   offer_id: offer.id,
   customer_id: customerId,
   freelancer_id: freelancerId,
   listing_id: listing.id,
   category_id: CATEGORY_ID,
   final_price: 100,
   completed_at: null,
 });
 assertExists(tx.id, "Failed to create incomplete transaction");
 return tx.id;
}


async function post(jwt: string, body: unknown) {
 return fetch(BASE_URL, {
   method: "POST",
   headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
   body: JSON.stringify(body),
 });
}


// Create a fresh category once before all tests run
const categoryRow = await servicePost("categories", { name: `SR Category ${ts}`, slug: `sr-cat-${ts}` });
assertExists(categoryRow.id, "Failed to create test category");
CATEGORY_ID = categoryRow.id;


Deno.test("submit-review — rejects GET with 405", async () => {
 const { jwt } = await signUp(`sr_get_${ts}@example.com`);
 const res = await fetch(BASE_URL, { method: "GET", headers: { Authorization: `Bearer ${jwt}` } });
 assertEquals(res.status, 405);
 await res.body?.cancel();
});


Deno.test("submit-review — rejects missing Authorization header", async () => {
 const res = await fetch(BASE_URL, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ transaction_id: "anything", ratings: {}, body: "x" }),
 });
 assertEquals(res.status, 401);
 await res.body?.cancel();
});


Deno.test("submit-review — rejects missing required fields", async () => {
 const { jwt } = await signUp(`sr_missing_${ts}@example.com`);
 const res = await post(jwt, { transaction_id: "some-id" });
 assertEquals(res.status, 400);
 const data = await res.json();
 assertExists(data.error);
});


Deno.test("submit-review — rejects rating below 1", async () => {
 const { jwt } = await signUp(`sr_lowrating_${ts}@example.com`);
 const res = await post(jwt, {
   transaction_id: "00000000-0000-0000-0000-000000000000",
   ratings: { communication: 0, quality: 5 },
   body: VALID_BODY,
 });
 assertEquals(res.status, 400);
 const data = await res.json();
 assertExists(data.error);
});


Deno.test("submit-review — rejects rating above 5", async () => {
 const { jwt } = await signUp(`sr_highrating_${ts}@example.com`);
 const res = await post(jwt, {
   transaction_id: "00000000-0000-0000-0000-000000000000",
   ratings: { communication: 6, quality: 5 },
   body: VALID_BODY,
 });
 assertEquals(res.status, 400);
 const data = await res.json();
 assertExists(data.error);
});


Deno.test("submit-review — rejects body containing profanity (scam)", async () => {
 const { jwt } = await signUp(`sr_profanity_${ts}@example.com`);
 const res = await post(jwt, {
   transaction_id: "00000000-0000-0000-0000-000000000000",
   ratings: VALID_RATINGS,
   body: "This whole thing is a scam",
 });
 assertEquals(res.status, 422);
 const data = await res.json();
 assertExists(data.error);
});


Deno.test("submit-review — returns 404 for non-existent transaction", async () => {
 const { jwt } = await signUp(`sr_notfound_${ts}@example.com`);
 const res = await post(jwt, {
   transaction_id: "00000000-0000-0000-0000-000000000000",
   ratings: VALID_RATINGS,
   body: VALID_BODY,
 });
 assertEquals(res.status, 404);
 const data = await res.json();
 assertExists(data.error);
});


Deno.test("submit-review — returns 403 when customer reviews someone else's transaction", async () => {
 const { userId: customerId } = await signUp(`sr_owner_${ts}@example.com`);
 const { jwt: otherJwt } = await signUp(`sr_other_${ts}@example.com`);
 const { userId: freelancerId } = await signUpAsFreelancer(`sr_free_${ts}@example.com`);
 const txId = await createCompletedTransaction(customerId, freelancerId);
 const res = await post(otherJwt, { transaction_id: txId, ratings: VALID_RATINGS, body: VALID_BODY });
 assertEquals(res.status, 403);
 const data = await res.json();
 assertExists(data.error);
});


Deno.test("submit-review — returns 409 for transaction that is not yet completed", async () => {
 const { jwt: customerJwt, userId: customerId } = await signUp(`sr_incomplete_${ts}@example.com`);
 const { userId: freelancerId } = await signUpAsFreelancer(`sr_free2_${ts}@example.com`);
 const txId = await createIncompleteTransaction(customerId, freelancerId);
 const res = await post(customerJwt, { transaction_id: txId, ratings: VALID_RATINGS, body: VALID_BODY });
 assertEquals(res.status, 409);
 const data = await res.json();
 assertExists(data.error);
});


Deno.test("submit-review — happy path creates review successfully", async () => {
 const { jwt: customerJwt, userId: customerId } = await signUp(`sr_happy_${ts}@example.com`);
 const { userId: freelancerId } = await signUpAsFreelancer(`sr_free3_${ts}@example.com`);
 const txId = await createCompletedTransaction(customerId, freelancerId);
 const res = await post(customerJwt, { transaction_id: txId, ratings: VALID_RATINGS, body: VALID_BODY });
 assertEquals(res.status, 200);
 const data = await res.json();
 assertEquals(data.success, true);
 assertExists(data.review);
 assertExists(data.review.id);
 assertEquals(data.review.transaction_id, txId);
 assertEquals(data.review.body, VALID_BODY);
});


Deno.test("submit-review — prevents duplicate review on same transaction (409)", async () => {
 const { jwt: customerJwt, userId: customerId } = await signUp(`sr_dup_${ts}@example.com`);
 const { userId: freelancerId } = await signUpAsFreelancer(`sr_free4_${ts}@example.com`);
 const txId = await createCompletedTransaction(customerId, freelancerId);
 const reviewPayload = { transaction_id: txId, ratings: VALID_RATINGS, body: VALID_BODY };


 const first = await post(customerJwt, reviewPayload);
 assertEquals(first.status, 200);
 await first.json();


 const second = await post(customerJwt, reviewPayload);
 assertEquals(second.status, 409);
 const data = await second.json();
 assertExists(data.error);
});

