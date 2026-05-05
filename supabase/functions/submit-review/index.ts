import "@supabase/functions-js/edge-runtime.d.ts";
import { createUserClient } from "../_shared/supabase.ts";

// Simple profanity list — expand as needed.
const BANNED_WORDS = ["spam", "scam"];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some((w) => lower.includes(w));
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const supabase = createUserClient(req);

  const { error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (authError) return new Response("Unauthorized", { status: 401 });

  const { transaction_id, ratings, body } = await req.json() as {
    transaction_id: string;
    ratings: Record<string, number>;
    body: string;
  };

  // Validate inputs.
  if (!transaction_id || !ratings || !body) {
    return new Response(JSON.stringify({ error: "transaction_id, ratings, and body are required" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const ratingValues = Object.values(ratings);
  if (ratingValues.some((v) => v < 1 || v > 5)) {
    return new Response(JSON.stringify({ error: "All ratings must be between 1 and 5" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  if (containsProfanity(body)) {
    return new Response(JSON.stringify({ error: "Review body contains disallowed content" }), {
      status: 422, headers: { "Content-Type": "application/json" },
    });
  }

  // Confirm the transaction is completed and belongs to this customer.
  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("id, completed_at")
    .eq("id", transaction_id)
    .single();

  if (txError || !tx) {
    return new Response(JSON.stringify({ error: "Transaction not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  if (!tx.completed_at) {
    return new Response(JSON.stringify({ error: "Transaction is not yet completed" }), { status: 409, headers: { "Content-Type": "application/json" } });
  }

  // Insert review (unique constraint prevents duplicates).
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .insert({ transaction_id, ratings, body })
    .select()
    .single();

  if (reviewError) {
    if (reviewError.code === "23505") {
      return new Response(JSON.stringify({ error: "You have already reviewed this transaction" }), {
        status: 409, headers: { "Content-Type": "application/json" },
      });
    }
    throw reviewError;
  }

  return new Response(JSON.stringify({ success: true, review }), {
    headers: { "Content-Type": "application/json" },
  });
});