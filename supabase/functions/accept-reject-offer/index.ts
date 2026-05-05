import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createUserClient } from "../_shared/supabase.ts";

const serviceClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const userClient = createUserClient(req);

  const { data: { user }, error: authError } = await userClient.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (authError || !user) return new Response("Unauthorized", { status: 401 });

  const { offer_id, action } = await req.json() as { offer_id: string; action: "accept" | "reject" };

  if (!offer_id || !["accept", "reject"].includes(action)) {
    return new Response(JSON.stringify({ error: "offer_id and action (accept|reject) are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch the offer and verify the caller is the freelancer.
  const { data: offer, error: offerError } = await userClient
    .from("offers")
    .select("*")
    .eq("id", offer_id)
    .single();

  if (offerError || !offer) {
    return new Response(JSON.stringify({ error: "Offer not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  if (offer.freelancer_id !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  if (offer.status !== "pending") {
    return new Response(JSON.stringify({ error: `Offer is already ${offer.status}` }), { status: 409, headers: { "Content-Type": "application/json" } });
  }

  const newStatus = action === "accept" ? "active" : "rejected";

  // Update offer status.
  const { error: updateError } = await userClient
    .from("offers")
    .update({ status: newStatus })
    .eq("id", offer_id);
  if (updateError) throw updateError;

  // If accepted, create the transaction record atomically.
  let transaction = null;
  if (action === "accept") {
    const { data: tx, error: txError } = await serviceClient
      .from("transactions")
      .insert({ offer_id, final_price: offer.amount })
      .select()
      .single();
    if (txError) throw txError;
    transaction = tx;
  }

  return new Response(
    JSON.stringify({ success: true, status: newStatus, transaction }),
    { headers: { "Content-Type": "application/json" } },
  );
});