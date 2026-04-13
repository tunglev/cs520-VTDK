import "@supabase/functions-js/edge-runtime.d.ts";
import { createUserClient, corsHeaders } from "../_shared/supabase.ts";

// ── Types ────────────────────────────────────────────────────

interface PricingModelInput {
  strategy_type: "fixed" | "hourly" | "project";
  base_price: number;
  unit?: string | null;
}

interface CreateListingBody {
  category_id: string;
  title: string;
  description: string;
  pricing_models?: PricingModelInput[];
}

interface UpdateListingBody {
  id: string;
  title?: string;
  description?: string;
  is_active?: boolean;
  pricing_models?: PricingModelInput[];
}

interface DeleteListingBody {
  id: string;
}

// ── Helpers ──────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

// ── Handlers ─────────────────────────────────────────────────

async function handleCreate(req: Request) {
  const supabase = createUserClient(req);
  const body: CreateListingBody = await req.json();

  // Validate required fields
  if (!body.category_id || !body.title || !body.description) {
    return errorResponse("category_id, title, and description are required.");
  }

  // Get the authenticated user's ID
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse("Unauthorized", 401);
  }

  // Insert the listing (RLS ensures freelancer_id = auth.uid())
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      freelancer_id: user.id,
      category_id: body.category_id,
      title: body.title,
      description: body.description,
    })
    .select()
    .single();

  if (listingError) {
    return errorResponse(listingError.message, 403);
  }

  // Insert pricing models if provided
  let pricingModels = null;
  if (body.pricing_models && body.pricing_models.length > 0) {
    const rows = body.pricing_models.map((pm) => ({
      listing_id: listing.id,
      strategy_type: pm.strategy_type,
      base_price: pm.base_price,
      unit: pm.unit ?? null,
    }));

    const { data, error: pmError } = await supabase
      .from("pricing_models")
      .insert(rows)
      .select();

    if (pmError) {
      // Clean up the listing if pricing models fail
      await supabase.from("listings").delete().eq("id", listing.id);
      return errorResponse(`Failed to create pricing models: ${pmError.message}`, 400);
    }
    pricingModels = data;
  }

  return jsonResponse({ ...listing, pricing_models: pricingModels ?? [] }, 201);
}

async function handleUpdate(req: Request) {
  const supabase = createUserClient(req);
  const body: UpdateListingBody = await req.json();

  if (!body.id) {
    return errorResponse("Listing id is required.");
  }

  // Build the update payload (only include provided fields)
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  // Update the listing if there are fields to update
  let listing;
  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from("listings")
      .update(updates)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return errorResponse(error.message, 403);
    }
    listing = data;
  } else {
    // No listing fields to update, just fetch the current listing
    const { data, error } = await supabase
      .from("listings")
      .select()
      .eq("id", body.id)
      .single();

    if (error) {
      return errorResponse(error.message, 404);
    }
    listing = data;
  }

  // Replace pricing models if provided (delete old, insert new)
  let pricingModels;
  if (body.pricing_models !== undefined) {
    // Delete existing pricing models for this listing
    await supabase
      .from("pricing_models")
      .delete()
      .eq("listing_id", body.id);

    if (body.pricing_models.length > 0) {
      const rows = body.pricing_models.map((pm) => ({
        listing_id: body.id,
        strategy_type: pm.strategy_type,
        base_price: pm.base_price,
        unit: pm.unit ?? null,
      }));

      const { data, error: pmError } = await supabase
        .from("pricing_models")
        .insert(rows)
        .select();

      if (pmError) {
        return errorResponse(`Failed to update pricing models: ${pmError.message}`, 400);
      }
      pricingModels = data;
    } else {
      pricingModels = [];
    }
  } else {
    // Pricing models not touched — fetch current ones
    const { data } = await supabase
      .from("pricing_models")
      .select()
      .eq("listing_id", body.id);
    pricingModels = data;
  }

  return jsonResponse({ ...listing, pricing_models: pricingModels ?? [] });
}

async function handleDelete(req: Request) {
  const supabase = createUserClient(req);
  const body: DeleteListingBody = await req.json();

  if (!body.id) {
    return errorResponse("Listing id is required.");
  }

  // Delete the listing (ON DELETE CASCADE removes pricing_models)
  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", body.id);

  if (error) {
    return errorResponse(error.message, 403);
  }

  return jsonResponse({ message: "Listing deleted successfully." });
}

// ── Router ───────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    switch (req.method) {
      case "POST":
        return await handleCreate(req);
      case "PUT":
        return await handleUpdate(req);
      case "DELETE":
        return await handleDelete(req);
      default:
        return errorResponse("Method not allowed", 405);
    }
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
