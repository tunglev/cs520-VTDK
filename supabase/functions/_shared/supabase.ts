import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Creates a Supabase client authenticated as the requesting user.
 * The user's JWT is extracted from the Authorization header so that
 * Row Level Security policies apply to every query.
 */
export function createUserClient(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
    },
  );
}

/** Standard CORS headers for browser requests. */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};
