import "@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, corsHeaders } from "../_shared/supabase.ts";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const supabase = createServiceClient();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const freelancerId = url.searchParams.get("freelancer_id");
    const categoryId = url.searchParams.get("category_id");
    const includeInactive = url.searchParams.get("include_inactive") === "true";

    // Join pricing models, category name, and freelancer info
    const selectQuery = `
      *,
      pricing_models (*),
      categories (name, slug),
      users!listings_freelancer_id_fkey (
        full_name,
        business_name,
        avatar_url,
        summary,
        service_area,
        zip_code,
        created_at
      )
    `;

    // Single listing by ID
    if (id) {
      const { data, error } = await supabase
        .from("listings")
        .select(selectQuery)
        .eq("id", id)
        .single();

      if (error) {
        return errorResponse(error.message, 404);
      }
      return jsonResponse(data);
    }

    // Build filtered query
    let query = supabase.from("listings").select(selectQuery);

    if (freelancerId) {
      query = query.eq("freelancer_id", freelancerId);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    // By default only return active listings (unless requesting own or explicitly asking for inactive)
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return errorResponse(error.message, 400);
    }

    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
