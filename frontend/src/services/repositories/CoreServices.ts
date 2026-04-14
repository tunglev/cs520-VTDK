import { supabase } from '../../lib/supabaseClient';

// ── MLServiceClient (Singleton) ──────────────────────────────

const ML_BASE_URL = import.meta.env.VITE_ML_SERVICE_URL as string;

async function mlPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${ML_BASE_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ML service error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface PricePrediction {
  minPrice: number;
  maxPrice: number;
  suggestedPrice: number;
}

export interface AnomalyResult {
  outlierIndices: number[];
  scores: number[];
}

export interface CategorizationResult {
  match: boolean;
  confidence: number;
}

// One HTTP client shared everywhere — imported as mlServiceClient.
export const mlServiceClient = {
  predictPrice(payload: { category: string; location: string; rating: number }) {
    return mlPost<PricePrediction>('/predict-price', payload);
  },

  detectAnomalies(prices: number[]) {
    return mlPost<AnomalyResult>('/detect-anomalies', { prices });
  },

  categorizeService(payload: { description: string; claimedCategory: string }) {
    return mlPost<CategorizationResult>('/categorize-service', payload);
  },
};

// ── CustomerPricingReport / FreelancerAnalyticsReport ────────

export interface CustomerPricingReport {
  type: 'customer';
  categoryId: string;
  marketMin: number;
  marketMax: number;
  marketAvg: number;
  marketMedian: number;
  transactionCount: number;
  prediction: PricePrediction;
  anomalies: AnomalyResult;
}

export interface FreelancerAnalyticsReport {
  type: 'freelancer';
  categoryId: string;
  marketMin: number;
  marketMax: number;
  marketAvg: number;
  marketMedian: number;
  transactionCount: number;
  prediction: PricePrediction;
  anomalies: AnomalyResult;
  ownPrices: number[];
}

export type PricingReport = CustomerPricingReport | FreelancerAnalyticsReport;

// ── ReportFactory ────────────────────────────────────────────

interface AggregateRow {
  category_id: string;
  transaction_count: number;
  price_min: number;
  price_max: number;
  price_avg: number;
  price_median: number;
}

export class ReportFactory {
  static createReport(
    role: 'customer' | 'freelancer',
    data: {
      aggregate: AggregateRow;
      prediction: PricePrediction;
      anomalies: AnomalyResult;
      ownPrices?: number[];
    },
  ): PricingReport {
    const base = {
      categoryId:       data.aggregate.category_id,
      marketMin:        data.aggregate.price_min,
      marketMax:        data.aggregate.price_max,
      marketAvg:        data.aggregate.price_avg,
      marketMedian:     data.aggregate.price_median,
      transactionCount: data.aggregate.transaction_count,
      prediction:       data.prediction,
      anomalies:        data.anomalies,
    };

    if (role === 'freelancer') {
      return { type: 'freelancer', ...base, ownPrices: data.ownPrices ?? [] };
    }
    return { type: 'customer', ...base };
  }
}

// ── MarketComparatorFacade ───────────────────────────────────

export class MarketComparatorFacade {
  async getReport(
    categoryId: string,
    role: 'customer' | 'freelancer' = 'customer',
    context?: { location?: string; rating?: number; freelancerId?: string },
  ): Promise<PricingReport> {
    // 1. Fetch anonymized aggregate from the pricing_report_aggregates view.
    const { data: aggregate, error } = await supabase
      .from('pricing_report_aggregates')
      .select('*')
      .eq('category_id', categoryId)
      .single();
    if (error) throw error;

    // 2. Get completed transaction prices for anomaly detection.
    const { data: txRows } = await supabase
      .from('transactions')
      .select('final_price')
      .eq('category_id', categoryId)
      .not('completed_at', 'is', null);

    const prices = (txRows ?? []).map((r: { final_price: number }) => r.final_price);

    // 3. Call ML service in parallel.
    const [prediction, anomalies] = await Promise.all([
      mlServiceClient.predictPrice({
        category: categoryId,
        location: context?.location ?? '',
        rating:   context?.rating  ?? 4.5,
      }),
      prices.length > 0 ? mlServiceClient.detectAnomalies(prices) : Promise.resolve({ outlierIndices: [], scores: [] }),
    ]);

    // 4. If freelancer, also fetch their own past prices for comparison.
    let ownPrices: number[] = [];
    if (role === 'freelancer' && context?.freelancerId) {
      const { data: ownTx } = await supabase
        .from('transactions')
        .select('final_price')
        .eq('freelancer_id', context.freelancerId)
        .eq('category_id', categoryId);
      ownPrices = (ownTx ?? []).map((r: { final_price: number }) => r.final_price);
    }

    return ReportFactory.createReport(role, { aggregate, prediction, anomalies, ownPrices });
  }
}

// ── NotificationService ──────────────────────────────────────
// Thin wrappers over Supabase's email/push notification hooks.
// Replace the console stubs with supabase.functions.invoke() calls
// once notification Edge Functions are implemented.

export const NotificationService = {
  async notifyOfferReceived(offerId: string) {
    console.info('[NotificationService] offer received:', offerId);
    // await supabase.functions.invoke('notify', { body: { event: 'offer_received', offer_id: offerId } });
  },

  async notifyOfferAccepted(offerId: string) {
    console.info('[NotificationService] offer accepted:', offerId);
  },

  async notifyOfferRejected(offerId: string) {
    console.info('[NotificationService] offer rejected:', offerId);
  },

  async notifyNewMessage(messageId: string) {
    console.info('[NotificationService] new message:', messageId);
  },

  async notifyReviewPosted(reviewId: string) {
    console.info('[NotificationService] review posted:', reviewId);
  },

  async notifyOfferExpiring(offerId: string) {
    console.info('[NotificationService] offer expiring:', offerId);
  },
};

// ── AdminCascadePolicy ───────────────────────────────────────
// Delegates to Postgres RPC functions defined in migration 011.

export const AdminCascadePolicy = {
  async onBan(userId: string, reason: string) {
    const { error } = await supabase.rpc('admin_cascade_on_ban', { p_user_id: userId, p_reason: reason });
    if (error) throw error;
  },

  async onDelete(userId: string) {
    const { error } = await supabase.rpc('admin_cascade_on_delete', { p_user_id: userId });
    if (error) throw error;
  },

  // Convenience wrappers exposed individually so callers can be specific.
  async deactivateListings(userId: string) {
    const { error } = await supabase
      .from('listings')
      .update({ is_active: false })
      .eq('freelancer_id', userId);
    if (error) throw error;
  },

  async expireOffers(userId: string) {
    const { error } = await supabase
      .from('offers')
      .update({ status: 'expired' })
      .or(`customer_id.eq.${userId},freelancer_id.eq.${userId}`)
      .eq('status', 'pending');
    if (error) throw error;
  },

  async closeConversations(userId: string) {
    // Conversations are not deleted; they are retained for audit.
    // This is a no-op at the DB level — the ban prevents further inserts via RLS.
    console.info('[AdminCascadePolicy] conversations archived for user:', userId);
  },
};