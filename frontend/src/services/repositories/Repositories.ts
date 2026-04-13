import { supabase } from '../../lib/supabaseClient';
import { BaseUser } from '../../models/users/BaseUser';
import { FreelancerUser, CustomerUser } from '../../models/users/UserSubclasses';
import { ServiceListing } from '../../models/marketplace/Marketplace';
import { Offer, Transaction } from '../../models/marketplace/Marketplace';
import { Review, ReviewResponse } from '../../models/reviews/ReviewsAndMessaging';

// ── UserRepository ───────────────────────────────────────────

export class UserRepository {
  async findById(id: string): Promise<BaseUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return BaseUser.fromRow(data);
  }

  async updateProfile(
    id: string,
    patch: Partial<{
      business_name: string;
      summary: string;
      service_area: string;
      zip_code: string;
      avatar_url: string;
    }>,
  ) {
    const { error } = await supabase.from('users').update(patch).eq('id', id);
    if (error) throw error;
  }

  async deactivate(id: string) {
    const { error } = await supabase
      .from('listings')
      .update({ is_active: false })
      .eq('freelancer_id', id);
    if (error) throw error;
  }

  static hydrateUser(row: Record<string, unknown>) {
    if (row.role === 'freelancer') return new FreelancerUser(FreelancerUser.fromRow(row));
    if (row.role === 'customer')  return new CustomerUser(CustomerUser.fromRow(row));
    return BaseUser.fromRow(row); // now returns BaseUser instance directly — no double-wrapping
  }
}

// ── ListingRepository ────────────────────────────────────────

export interface ListingSearchFilters {
  search?: string;
  categoryId?: string;
  maxPrice?: number;
  minRating?: number;
  zipCode?: string;
  isActive?: boolean;
}

export class ListingRepository {
  async create(payload: {
    freelancerId: string;
    categoryId: string;
    title: string;
    description: string;
  }): Promise<ServiceListing> {
    const { data, error } = await supabase
      .from('listings')
      .insert({
        freelancer_id: payload.freelancerId,
        category_id:   payload.categoryId,
        title:         payload.title,
        description:   payload.description,
      })
      .select()
      .single();
    if (error) throw error;
    return ServiceListing.fromRow(data);
  }

  async update(id: string, patch: Partial<{ title: string; description: string; is_active: boolean }>) {
    const { data, error } = await supabase
      .from('listings')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return ServiceListing.fromRow(data);
  }

  async delete(id: string) {
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) throw error;
  }

  async search(filters: ListingSearchFilters = {}): Promise<ServiceListing[]> {
    let query = supabase.from('listings').select('*').eq('is_active', filters.isActive ?? true);

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => ServiceListing.fromRow(row));
  }

  async findByCategory(categoryId: string): Promise<ServiceListing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true);
    if (error) throw error;
    return (data ?? []).map((row) => ServiceListing.fromRow(row));
  }
}

// ── OfferRepository ──────────────────────────────────────────

export class OfferRepository {
  async create(payload: {
    customerId: string;
    listingId: string;
    amount: number;
    scope?: string;
  }): Promise<Offer> {
    const { data, error } = await supabase
      .from('offers')
      .insert({
        customer_id: payload.customerId,
        listing_id:  payload.listingId,
        amount:      payload.amount,
        scope:       payload.scope ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return Offer.fromRow(data);
  }

  async findById(id: string): Promise<Offer | null> {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return Offer.fromRow(data);
  }

  async updateStatus(id: string, status: Offer['status']) {
    const { error } = await supabase
      .from('offers')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  }

  async expireStale(): Promise<number> {
    const { data, error } = await supabase.rpc('expire_stale_offers');
    if (error) throw error;
    return data as number;
  }

  async findByFreelancer(freelancerId: string): Promise<Offer[]> {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(Offer.fromRow);
  }
}

// ── TransactionRepository ────────────────────────────────────

export class TransactionRepository {
  async create(payload: { offerId: string; finalPrice?: number }): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ offer_id: payload.offerId, final_price: payload.finalPrice })
      .select()
      .single();
    if (error) throw error;
    return Transaction.fromRow(data);
  }

  async getByUser(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`customer_id.eq.${userId},freelancer_id.eq.${userId}`)
      .order('completed_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(Transaction.fromRow);
  }

  async getByCategory(categoryId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('category_id', categoryId)
      .not('completed_at', 'is', null);
    if (error) throw error;
    return (data ?? []).map(Transaction.fromRow);
  }
}

// ── ReviewRepository ─────────────────────────────────────────

export class ReviewRepository {
  async create(payload: {
    transactionId: string;
    ratings: Record<string, number>;
    body: string;
  }): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        transaction_id: payload.transactionId,
        ratings:        payload.ratings,
        body:           payload.body,
      })
      .select()
      .single();
    if (error) throw error;
    return Review.fromRow(data);
  }

  async getByFreelancer(freelancerId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(Review.fromRow);
  }

  async getByTransaction(transactionId: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();
    if (error) return null;
    return Review.fromRow(data);
  }

  async createResponse(payload: {
    reviewId: string;
    freelancerId: string;
    body: string;
  }): Promise<ReviewResponse> {
    const { data, error } = await supabase
      .from('review_responses')
      .insert({
        review_id:     payload.reviewId,
        freelancer_id: payload.freelancerId,
        body:          payload.body,
      })
      .select()
      .single();
    if (error) throw error;
    return ReviewResponse.fromRow(data);
  }
}