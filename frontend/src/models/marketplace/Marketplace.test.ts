import { describe, it, expect } from 'vitest';
import { Category, ServiceListing, Offer, Transaction } from './Marketplace';
import { FixedPriceStrategy, HourlyStrategy } from '../pricing/PricingStrategy';

describe('Category', () => {
  it('hydrates from a database row', () => {
    const cat = Category.fromRow({ id: 'cat-1', name: 'Design', slug: 'design' });
    expect(cat).toBeInstanceOf(Category);
    expect(cat.id).toBe('cat-1');
    expect(cat.name).toBe('Design');
    expect(cat.slug).toBe('design');
  });
});

describe('ServiceListing', () => {
  const baseRow = {
    id: 'lst-1',
    freelancer_id: 'user-1',
    category_id: 'cat-1',
    title: 'Logo Design',
    description: 'Professional logo design',
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
  };

  it('hydrates from a database row without pricing', () => {
    const listing = ServiceListing.fromRow(baseRow);
    expect(listing).toBeInstanceOf(ServiceListing);
    expect(listing.id).toBe('lst-1');
    expect(listing.freelancerId).toBe('user-1');
    expect(listing.title).toBe('Logo Design');
    expect(listing.isActive).toBe(true);
    expect(listing.pricingStrategy).toBeNull();
  });

  it('hydrates with a pricing row', () => {
    const listing = ServiceListing.fromRow(baseRow, {
      strategy_type: 'fixed',
      base_price: 200,
    });
    expect(listing.pricingStrategy).toBeInstanceOf(FixedPriceStrategy);
    expect(listing.getPrice()).toBe(200);
  });

  it('throws when getPrice is called without a strategy', () => {
    const listing = ServiceListing.fromRow(baseRow);
    expect(() => listing.getPrice()).toThrow('No pricing strategy loaded');
  });

  it('hydrates hourly pricing from row', () => {
    const listing = ServiceListing.fromRow(baseRow, {
      strategy_type: 'hourly',
      base_price: 85,
    });
    expect(listing.pricingStrategy).toBeInstanceOf(HourlyStrategy);
    expect(listing.getPrice()).toBe(85);
  });
});

describe('Offer', () => {
  const offerRow = {
    id: 'off-1',
    customer_id: 'cust-1',
    freelancer_id: 'free-1',
    listing_id: 'lst-1',
    amount: 500,
    scope: 'Build a landing page',
    status: 'pending',
    expires_at: '2024-06-01T00:00:00Z',
    created_at: '2024-05-01T00:00:00Z',
  };

  it('hydrates from a database row', () => {
    const offer = Offer.fromRow(offerRow);
    expect(offer).toBeInstanceOf(Offer);
    expect(offer.id).toBe('off-1');
    expect(offer.customerId).toBe('cust-1');
    expect(offer.freelancerId).toBe('free-1');
    expect(offer.amount).toBe(500);
    expect(offer.scope).toBe('Build a landing page');
    expect(offer.status).toBe('pending');
    expect(offer.expiresAt).toBe('2024-06-01T00:00:00Z');
  });

  it('handles null scope and expires_at', () => {
    const offer = Offer.fromRow({ ...offerRow, scope: undefined, expires_at: undefined });
    expect(offer.scope).toBeNull();
    expect(offer.expiresAt).toBeNull();
  });
});

describe('Transaction', () => {
  const txRow = {
    id: 'tx-1',
    offer_id: 'off-1',
    customer_id: 'cust-1',
    freelancer_id: 'free-1',
    listing_id: 'lst-1',
    category_id: 'cat-1',
    final_price: 500,
    completed_at: null,
  };

  it('hydrates from a database row', () => {
    const tx = Transaction.fromRow(txRow);
    expect(tx).toBeInstanceOf(Transaction);
    expect(tx.id).toBe('tx-1');
    expect(tx.finalPrice).toBe(500);
    expect(tx.isComplete).toBe(false);
  });

  it('isComplete is true when completed_at is set', () => {
    const tx = Transaction.fromRow({ ...txRow, completed_at: '2024-06-01T00:00:00Z' });
    expect(tx.isComplete).toBe(true);
  });

  it('includes optional denormalized fields', () => {
    const tx = Transaction.fromRow({
      ...txRow,
      listing_title: 'Logo Design',
      freelancer_name: 'Alex',
      customer_name: 'Bob',
    });
    expect(tx.listingTitle).toBe('Logo Design');
    expect(tx.freelancerName).toBe('Alex');
    expect(tx.customerName).toBe('Bob');
  });

  it('optional fields are undefined when absent', () => {
    const tx = Transaction.fromRow(txRow);
    expect(tx.listingTitle).toBeUndefined();
    expect(tx.freelancerName).toBeUndefined();
    expect(tx.customerName).toBeUndefined();
  });
});
