import "@supabase/functions-js/edge-runtime.d.ts";
import { createUserClient, createServiceClient, corsHeaders } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify the caller's identity via their JWT.
  const userClient = createUserClient(req);
  const { data: { user }, error: authError } = await userClient.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { transaction_id } = await req.json() as { transaction_id: string };
  if (!transaction_id) {
    return new Response(JSON.stringify({ error: "transaction_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch the transaction and verify the caller is the customer.
  const { data: tx, error: txError } = await userClient
    .from("transactions")
    .select("*")
    .eq("id", transaction_id)
    .single();

  if (txError || !tx) {
    return new Response(JSON.stringify({ error: "Transaction not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (tx.customer_id !== user.id) {
    return new Response(JSON.stringify({ error: "Only the customer may mark a transaction complete" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (tx.completed_at !== null) {
    return new Response(JSON.stringify({ error: "Transaction is already completed" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Use the service-role client to set completed_at (bypasses RLS).
  const serviceClient = createServiceClient();
  const { data: updated, error: updateError } = await serviceClient
    .from("transactions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", transaction_id)
    .select()
    .single();

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, transaction: updated }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
