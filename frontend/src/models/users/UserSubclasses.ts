import { BaseUser, type BaseUserData } from './BaseUser';
import { supabase } from '../../lib/supabaseClient';

// ── FreelancerUser ───────────────────────────────────────────

export interface FreelancerUserData extends BaseUserData {
  businessName: string | null;
  summary: string | null;
  serviceArea: string | null;
  zipCode: string | null;
  avatarUrl: string | null;
}

export class FreelancerUser extends BaseUser {
  businessName: string | null;
  summary: string | null;
  serviceArea: string | null;
  zipCode: string | null;
  avatarUrl: string | null;

  constructor(data: FreelancerUserData) {
    super(data);
    this.businessName = data.businessName;
    this.summary      = data.summary;
    this.serviceArea  = data.serviceArea;
    this.zipCode      = data.zipCode;
    this.avatarUrl    = data.avatarUrl;
  }

  // Updates the freelancer's pricing model base_price for a given listing.
  async updateRate(listingId: string, newPrice: number) {
    const { error } = await supabase
      .from('pricing_models')
      .update({ base_price: newPrice })
      .eq('listing_id', listingId);
    if (error) throw error;
  }

  // Returns aggregate pricing stats for the freelancer's own transactions.
  // Delegates to the MarketComparatorFacade in practice; this is a thin helper.
  async viewAnalytics(categoryId: string) {
    const { data, error } = await supabase
      .from('pricing_report_aggregates')
      .select('*')
      .eq('category_id', categoryId)
      .single();
    if (error) throw error;
    return data;
  }

  // Creates a new listing for this freelancer.
  async createListing(payload: {
    categoryId: string;
    title: string;
    description: string;
  }) {
    const { data, error } = await supabase
      .from('listings')
      .insert({
        freelancer_id: this.id,
        category_id:   payload.categoryId,
        title:         payload.title,
        description:   payload.description,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static fromRow(row: Record<string, unknown>): FreelancerUserData {
    return {
      ...BaseUser.fromRow(row),
      businessName: (row.business_name as string) ?? null,
      summary:      (row.summary as string) ?? null,
      serviceArea:  (row.service_area as string) ?? null,
      zipCode:      (row.zip_code as string) ?? null,
      avatarUrl:    (row.avatar_url as string) ?? null,
    };
  }
}

// ── CustomerUser ─────────────────────────────────────────────

export interface CustomerUserData extends BaseUserData {
  location: string | null;
  searchHistory: string[];
}

export class CustomerUser extends BaseUser {
  location: string | null;
  searchHistory: string[];

  constructor(data: CustomerUserData) {
    super(data);
    this.location      = data.location;
    this.searchHistory = data.searchHistory;
  }

  // Places an offer on a listing.
  async placeOffer(payload: {
    listingId: string;
    amount: number;
    scope?: string;
  }) {
    const { data, error } = await supabase
      .from('offers')
      .insert({
        customer_id: this.id,
        listing_id:  payload.listingId,
        amount:      payload.amount,
        scope:       payload.scope ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Delegates review creation to the submit-review Edge Function.
  async writeReview(payload: {
    transactionId: string;
    ratings: Record<string, number>;
    body: string;
  }) {
    const { data, error } = await supabase.functions.invoke('submit-review', {
      body: { transaction_id: payload.transactionId, ratings: payload.ratings, body: payload.body },
    });
    if (error) throw error;
    return data;
  }

  // Calls the generate-pricing-report Edge Function.
  async viewReport(categoryId: string) {
    const { data, error } = await supabase.functions.invoke('generate-pricing-report', {
      body: { category_id: categoryId },
    });
    if (error) throw error;
    return data;
  }

  static fromRow(row: Record<string, unknown>): CustomerUserData {
    return {
      ...BaseUser.fromRow(row),
      location:      (row.zip_code as string) ?? null,
      searchHistory: [],
    };
  }
}

// ── AdminUser ────────────────────────────────────────────────

export class AdminUser extends BaseUser {
  // Bans a user and cascades side effects via the admin_cascade_on_ban function.
  async ban(userId: string, reason: string) {
    const { error } = await supabase.rpc('admin_cascade_on_ban', {
      p_user_id: userId,
      p_reason:  reason,
    });
    if (error) throw error;
  }

  async unban(userId: string) {
    const { error } = await supabase.rpc('admin_cascade_on_unban', {
      p_user_id: userId,
    });
    if (error) throw error;
  }

  async deleteUser(userId: string) {
    const { error } = await supabase.rpc('admin_cascade_on_delete', {
      p_user_id: userId,
    });
    if (error) throw error;
  }

  // Returns all users (bypasses normal RLS because the JWT carries admin role).
  async viewAllData() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data;
  }
}