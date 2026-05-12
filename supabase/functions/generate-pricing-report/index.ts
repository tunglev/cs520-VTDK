import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/supabase.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ML_SERVICE_URL = Deno.env.get("ML_SERVICE_URL");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { category_id, location = "", rating = 4.5 } = await req.json() as {
    category_id: string;
    location?: string;
    rating?: number;
  };

  // When category_id is omitted, return market-wide price distribution only.
  if (!category_id) {
    const { data: allPriceRows } = await supabase
      .from("transactions")
      .select("final_price")
      .not("completed_at", "is", null);

    const allPrices = (allPriceRows ?? []).map((r: { final_price: number }) => r.final_price);
    const distribution: { range: string; count: number; avg: number }[] = [];
    if (allPrices.length > 0) {
      const bucketSize = 50;
      const minB = Math.floor(Math.min(...allPrices) / bucketSize) * bucketSize;
      const maxB = Math.floor(Math.max(...allPrices) / bucketSize) * bucketSize;
      for (let start = minB; start <= maxB; start += bucketSize) {
        const end = start + bucketSize;
        const inBucket = allPrices.filter((p: number) => p >= start && p < end);
        if (inBucket.length > 0) {
          distribution.push({
            range: `$${start}–$${end}`,
            count: inBucket.length,
            avg: Math.round(inBucket.reduce((s: number, v: number) => s + v, 0) / inBucket.length),
          });
        }
      }
    }

    return new Response(JSON.stringify({ priceDistribution: distribution }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Get individual prices for anomaly detection.
  const { data: priceRows } = await supabase
    .from("transactions")
    .select("final_price")
    .eq("category_id", category_id)
    .not("completed_at", "is", null);

  const prices = (priceRows ?? []).map((r: { final_price: number }) => r.final_price);

  // 3. Call ML service (optional — skipped if ML_SERVICE_URL is not configured).
  let prediction = { minPrice: 0, maxPrice: 0, suggestedPrice: 0 };
  let anomalies = { outlierIndices: [] as number[], scores: [] as number[] };

  if (ML_SERVICE_URL) {
    try {
      const [predRes, anomalyRes] = await Promise.all([
        fetch(`${ML_SERVICE_URL}/predict-price`, {
          method: "POST",
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ category: category_id, location, rating }),
        }),
        prices.length > 0
          ? fetch(`${ML_SERVICE_URL}/detect-anomalies`, {
              method: "POST",
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              body: JSON.stringify({ prices }),
            })
          : Promise.resolve(null),
      ]);

      if (predRes.ok) prediction = await predRes.json();
      if (anomalyRes && anomalyRes.ok) anomalies = await anomalyRes.json();
    } catch {
      // ML service unavailable — continue with defaults
    }
  }

  // Build price distribution buckets from individual prices.
  const priceDistribution: { range: string; count: number; avg: number }[] = [];
  if (prices.length > 0) {
    const bucketSize = 50;
    const minBucket = Math.floor(Math.min(...prices) / bucketSize) * bucketSize;
    const maxBucket = Math.floor(Math.max(...prices) / bucketSize) * bucketSize;
    for (let start = minBucket; start <= maxBucket; start += bucketSize) {
      const end = start + bucketSize;
      const inBucket = prices.filter((p: number) => p >= start && p < end);
      if (inBucket.length > 0) {
        priceDistribution.push({
          range: `$${start}–$${end}`,
          count: inBucket.length,
          avg: Math.round(inBucket.reduce((s: number, v: number) => s + v, 0) / inBucket.length),
        });
      }
    }
  }

  // Build scatter data: price + rating for each freelancer in this category.
  const { data: scatterRows } = await supabase
    .from("listings")
    .select("id, title, pricing_models(base_price), freelancer_id")
    .eq("category_id", category_id);

  let scatterData: { name: string; price: number; rating: number; reviews: number }[] = [];
  if (scatterRows && scatterRows.length > 0) {
    const fIds = [...new Set(scatterRows.map((r: any) => r.freelancer_id).filter(Boolean))];
    const { data: ratingRows } = await supabase
      .from("freelancer_rating_aggregates")
      .select("freelancer_id, avg_overall, review_count")
      .in("freelancer_id", fIds);
    const rMap = new Map((ratingRows ?? []).map((r: any) => [r.freelancer_id, r]));

    scatterData = scatterRows
      .filter((r: any) => r.pricing_models?.length > 0)
      .map((r: any) => {
        const rat = rMap.get(r.freelancer_id) as any;
        return {
          name: r.title || "Freelancer",
          price: r.pricing_models[0].base_price,
          rating: rat?.avg_overall ?? 0,
          reviews: rat?.review_count ?? 0,
        };
      });
  }

  const report = {
    categoryId:       aggregate.category_id,
    marketMin:        aggregate.price_min,
    marketMax:        aggregate.price_max,
    marketAvg:        aggregate.price_avg,
    marketMedian:     aggregate.price_median,
    transactionCount: aggregate.transaction_count,
    priceDistribution,
    scatterData,
    prediction,
    anomalies,
  };

  return new Response(JSON.stringify(report), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});