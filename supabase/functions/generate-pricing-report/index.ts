import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ML_SERVICE_URL = Deno.env.get("ML_SERVICE_URL")!;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { category_id, location = "", rating = 4.5 } = await req.json() as {
    category_id: string;
    location?: string;
    rating?: number;
  };

  if (!category_id) {
    return new Response(JSON.stringify({ error: "category_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Aggregate query — uses service role so RLS doesn't restrict cross-user reads.
  const { data: aggregate, error: aggError } = await supabase
    .from("pricing_report_aggregates")
    .select("*")
    .eq("category_id", category_id)
    .single();

  if (aggError) {
    return new Response(JSON.stringify({ error: "Not enough data for this category yet." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Get individual prices for anomaly detection.
  const { data: priceRows } = await supabase
    .from("transactions")
    .select("final_price")
    .eq("category_id", category_id)
    .not("completed_at", "is", null);

  const prices = (priceRows ?? []).map((r: { final_price: number }) => r.final_price);

  // 3. Call ML service.
  const [predRes, anomalyRes] = await Promise.all([
    fetch(`${ML_SERVICE_URL}/predict-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: category_id, location, rating }),
    }),
    prices.length > 0
      ? fetch(`${ML_SERVICE_URL}/detect-anomalies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prices }),
        })
      : Promise.resolve(null),
  ]);

  const prediction  = predRes.ok    ? await predRes.json()    : { minPrice: 0, maxPrice: 0, suggestedPrice: 0 };
  const anomalies   = anomalyRes && anomalyRes.ok ? await anomalyRes.json() : { outlierIndices: [], scores: [] };

  const report = {
    categoryId:       aggregate.category_id,
    marketMin:        aggregate.price_min,
    marketMax:        aggregate.price_max,
    marketAvg:        aggregate.price_avg,
    marketMedian:     aggregate.price_median,
    transactionCount: aggregate.transaction_count,
    prediction,
    anomalies,
  };

  return new Response(JSON.stringify(report), {
    headers: { "Content-Type": "application/json" },
  });
});