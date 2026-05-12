import { supabase } from '../../lib/supabaseClient';
import { type PricingStrategy, strategyFromRow } from '../pricing/PricingStrategy';

// ── Category ─────────────────────────────────────────────────

export class Category {
  id: string;
  name: string;
  slug: string;

  constructor(data: { id: string; name: string; slug: string }) {
    this.id   = data.id;
    this.name = data.name;
    this.slug = data.slug;
  }

  static fromRow(row: Record<string, unknown>): Category {
    return new Category({
      id:   row.id as string,
      name: row.name as string,
      slug: row.slug as string,
    });
  }
}

// ── ServiceListing ───────────────────────────────────────────

export class ServiceListing {
  id: string;
  freelancerId: string;
  categoryId: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  pricingStrategy: PricingStrategy | null;

  constructor(data: {
    id: string;
    freelancerId: string;
    categoryId: string;
    title: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    pricingStrategy?: PricingStrategy | null;
  }) {
    this.id              = data.id;
    this.freelancerId    = data.freelancerId;
    this.categoryId      = data.categoryId;
    this.title           = data.title;
    this.description     = data.description;
    this.isActive        = data.isActive;
    this.createdAt       = data.createdAt;
    this.pricingStrategy = data.pricingStrategy ?? null;
  }

  // Delegates to the held strategy; throws if no strategy is loaded.
  getPrice(): number {
    if (!this.pricingStrategy) {
      throw new Error('No pricing strategy loaded for this listing.');
    }
    return this.pricingStrategy.calculatePrice();
  }

  // Patches the listing in the database and updates local state.
  async updateListing(patch: Partial<{ title: string; description: string; isActive: boolean }>) {
    const { data, error } = await supabase
      .from('listings')
      .update(patch)
      .eq('id', this.id)
      .select()
      .single();
    if (error) throw error;
    Object.assign(this, ServiceListing.fromRow(data));
    return this;
  }

  async deleteListing(): Promise<void> {
    const { error } = await supabase.from('listings').delete().eq('id', this.id);
    if (error) throw error;
  }

  static fromRow(
    row: Record<string, unknown>,
    pricingRow?: Record<string, unknown> | null,
  ): ServiceListing {
    return new ServiceListing({
      id:              row.id as string,
      freelancerId:    row.freelancer_id as string,
      categoryId:      row.category_id as string,
      title:           row.title as string,
      description:     row.description as string,
      isActive:        row.is_active as boolean,
      createdAt:       row.created_at as string,
      pricingStrategy: pricingRow ? strategyFromRow(pricingRow as { strategy_type: 'fixed' | 'hourly' | 'project'; base_price: number }) : null,
    });
  }
}

// ── Offer ────────────────────────────────────────────────────

export type OfferStatus = 'pending' | 'active' | 'rejected' | 'expired';

export class Offer {
  id: string;
  customerId: string;
  freelancerId: string;
  listingId: string;
  amount: number;
  scope: string | null;
  status: OfferStatus;
  expiresAt: string | null;
  createdAt: string;

  constructor(data: {
    id: string;
    customerId: string;
    freelancerId: string;
    listingId: string;
    amount: number;
    scope: string | null;
    status: OfferStatus;
    expiresAt: string | null;
    createdAt: string;
  }) {
    this.id           = data.id;
    this.customerId   = data.customerId;
    this.freelancerId = data.freelancerId;
    this.listingId    = data.listingId;
    this.amount       = data.amount;
    this.scope        = data.scope;
    this.status       = data.status;
    this.expiresAt    = data.expiresAt;
    this.createdAt    = data.createdAt;
  }

  // Accepts the offer via Edge Function (atomic: updates status + creates transaction).
  async accept() {
    const { data, error } = await supabase.functions.invoke('accept-reject-offer', {
      body: { offer_id: this.id, action: 'accept' },
    });
    if (error) throw error;
    this.status = 'active';
    return data;
  }

  async reject() {
    const { data, error } = await supabase.functions.invoke('accept-reject-offer', {
      body: { offer_id: this.id, action: 'reject' },
    });
    if (error) throw error;
    this.status = 'rejected';
    return data;
  }

  // Creates a counter-offer (new pending offer) with a revised amount.
  async counter(newAmount: number) {
    const { data, error } = await supabase
      .from('offers')
      .insert({
        customer_id:  this.customerId,
        listing_id:   this.listingId,
        amount:       newAmount,
        scope:        this.scope,
      })
      .select()
      .single();
    if (error) throw error;
    return Offer.fromRow(data);
  }

  static fromRow(row: Record<string, unknown>): Offer {
    return new Offer({
      id:           row.id as string,
      customerId:   row.customer_id as string,
      freelancerId: row.freelancer_id as string,
      listingId:    row.listing_id as string,
      amount:       row.amount as number,
      scope:        (row.scope as string) ?? null,
      status:       row.status as OfferStatus,
      expiresAt:    (row.expires_at as string) ?? null,
      createdAt:    row.created_at as string,
    });
  }
}

// ── Transaction ──────────────────────────────────────────────

export class Transaction {
  id: string;
  offerId: string;
  customerId: string;
  freelancerId: string;
  listingId: string;
  categoryId: string;
  finalPrice: number;
  completedAt: string | null;

  constructor(data: {
    id: string;
    offerId: string;
    customerId: string;
    freelancerId: string;
    listingId: string;
    categoryId: string;
    finalPrice: number;
    completedAt: string | null;
  }) {
    this.id           = data.id;
    this.offerId      = data.offerId;
    this.customerId   = data.customerId;
    this.freelancerId = data.freelancerId;
    this.listingId    = data.listingId;
    this.categoryId   = data.categoryId;
    this.finalPrice   = data.finalPrice;
    this.completedAt  = data.completedAt;
  }

  static fromRow(row: Record<string, unknown>): Transaction {
    return new Transaction({
      id:           row.id as string,
      offerId:      row.offer_id as string,
      customerId:   row.customer_id as string,
      freelancerId: row.freelancer_id as string,
      listingId:    row.listing_id as string,
      categoryId:   row.category_id as string,
      finalPrice:   row.final_price as number,
      completedAt:  (row.completed_at as string) ?? null,
    });
  }
}