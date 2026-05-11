import "@supabase/functions-js/edge-runtime.d.ts";
import { createUserClient, corsHeaders } from "../_shared/supabase.ts";

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

  const { offer_id, amount } = await req.json() as { offer_id: string; amount: number };

  if (!offer_id || typeof amount !== 'number' || amount <= 0) {
    return new Response(JSON.stringify({ error: "offer_id and a valid positive amount are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch the offer
  const { data: offer, error: offerError } = await userClient
    .from("offers")
    .select("*")
    .eq("id", offer_id)
    .single();

  if (offerError || !offer) {
    return new Response(JSON.stringify({ error: "Offer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Caller must be participant
  if (offer.freelancer_id !== user.id && offer.customer_id !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden: Not a participant" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (offer.status !== "pending") {
    return new Response(JSON.stringify({ error: `Cannot counter an offer that is already ${offer.status}` }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const role = offer.freelancer_id === user.id ? 'freelancer' : 'customer';

  // Cannot counter if you are the one who proposed it last
  if (offer.proposed_by === role) {
    return new Response(JSON.stringify({ error: "Forbidden: Cannot counter your own proposal. Wait for the other party to respond." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Update offer with new amount and toggle proposed_by
  const { error: updateError } = await userClient
    .from("offers")
    .update({ 
      amount: amount,
      proposed_by: role,
      status: 'pending' // ensure it remains pending
    })
    .eq("id", offer_id);

  if (updateError) throw updateError;

  return new Response(
    JSON.stringify({ success: true, amount, proposed_by: role }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});