import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createUserClient, corsHeaders } from "../_shared/supabase.ts";

const serviceClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const userClient = createUserClient(req);

  const { data: { user }, error: authError } = await userClient.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (authError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const { offer_id, action } = await req.json() as { offer_id: string; action: "accept" | "reject" };

  if (!offer_id || !["accept", "reject"].includes(action)) {
    return new Response(JSON.stringify({ error: "offer_id and action (accept|reject) are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch the offer and verify the caller is either the customer or the freelancer.
  const { data: offer, error: offerError } = await userClient
    .from("offers")
    .select("*")
    .eq("id", offer_id)
    .single();

  if (offerError || !offer) {
    return new Response(JSON.stringify({ error: "Offer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // The caller must be a participant in the offer
  if (offer.freelancer_id !== user.id && offer.customer_id !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden: Not a participant", debug: { freelancer: offer.freelancer_id, customer: offer.customer_id, user: user.id } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // The caller cannot accept/reject their own proposal
  let role = offer.freelancer_id === user.id ? 'freelancer' : 'customer';
  
  // If the user is testing on their own listing (they are both customer and freelancer),
  // assume they are acting as the role that DID NOT propose the current amount.
  if (offer.freelancer_id === offer.customer_id && offer.customer_id === user.id) {
    role = offer.proposed_by === 'freelancer' ? 'customer' : 'freelancer';
  }

  if (offer.proposed_by === role) {
    return new Response(JSON.stringify({ error: "Forbidden: Cannot respond to your own proposal", debug: { role, proposed_by: offer.proposed_by } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (offer.status !== "pending") {
    return new Response(JSON.stringify({ error: `Offer is already ${offer.status}` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const newStatus = action === "accept" ? "active" : "rejected";

  // Update offer status.
  const { error: updateError } = await userClient
    .from("offers")
    .update({ status: newStatus })
    .eq("id", offer_id);
  
  if (updateError) {
    return new Response(JSON.stringify({ error: "Update fails", details: updateError }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

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
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});