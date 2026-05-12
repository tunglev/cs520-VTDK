import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfferCard } from './OfferCard';
import { Offer } from '../models/marketplace/Marketplace';

vi.mock('motion/react', () => {
  const Div = React.forwardRef(({ children }: any, ref: any) => <div ref={ref}>{children}</div>);
  Div.displayName = 'MotionDiv';
  const Form = React.forwardRef(({ children, onSubmit }: any, ref: any) => (
    <form ref={ref} onSubmit={onSubmit}>{children}</form>
  ));
  Form.displayName = 'MotionForm';
  return {
    motion: { div: Div, form: Form },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

const BASE_OFFER_DATA = {
  id: 'offer-1',
  customerId: 'cust-1',
  freelancerId: 'free-1',
  listingId: 'lst-1',
  amount: 150,
  scope: 'Build a landing page',
  status: 'pending' as const,
  proposedBy: 'customer' as const,
  expiresAt: null,
  createdAt: '2026-05-01T00:00:00.000Z',
};

function makeOffer(overrides: Partial<typeof BASE_OFFER_DATA> = {}): Offer {
  return new Offer({ ...BASE_OFFER_DATA, ...overrides });
}

function renderCard(
  offer: Offer,
  userRole: 'freelancer' | 'customer' = 'freelancer',
  handlers: Partial<{
    onAccept: (o: Offer) => void;
    onReject: (o: Offer) => void;
    onCounter: (o: Offer, amount: number) => void;
  }> = {}
) {
  return render(
    <OfferCard
      offer={offer}
      userRole={userRole}
      onAccept={handlers.onAccept ?? vi.fn()}
      onReject={handlers.onReject ?? vi.fn()}
      onCounter={handlers.onCounter ?? vi.fn()}
    />
  );
}

describe('OfferCard', () => {
  it('renders the offer amount, scope, and proposed-by label', () => {
    renderCard(makeOffer());
    expect(screen.getByText('$150')).toBeInTheDocument();
    expect(screen.getByText(/build a landing page/i)).toBeInTheDocument();
    expect(screen.getByText(/proposed by: customer/i)).toBeInTheDocument();
  });

  it('shows action buttons when the current user did not make the offer', () => {
    renderCard(makeOffer({ proposedBy: 'customer' }), 'freelancer');
    expect(screen.getByText('Counter')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
    expect(screen.getByText('Accept')).toBeInTheDocument();
  });

  it('shows "Waiting for Response" when the current user proposed the offer', () => {
    renderCard(makeOffer({ proposedBy: 'freelancer' }), 'freelancer');
    expect(screen.getByText(/waiting for response/i)).toBeInTheDocument();
    expect(screen.queryByText('Accept')).not.toBeInTheDocument();
  });

  it('shows "No scope provided" when scope is null', () => {
    renderCard(makeOffer({ scope: null }));
    expect(screen.getByText(/no scope provided/i)).toBeInTheDocument();
  });

  it('shows the expiry date when expiresAt is set', () => {
    renderCard(makeOffer({ expiresAt: '2026-12-31T00:00:00.000Z' }));
    expect(screen.getByText(/expires/i)).toBeInTheDocument();
  });

  it('calls onReject with the offer when Reject is clicked', async () => {
    const onReject = vi.fn();
    const offer = makeOffer({ proposedBy: 'customer' });
    renderCard(offer, 'freelancer', { onReject });
    await userEvent.click(screen.getByText('Reject'));
    expect(onReject).toHaveBeenCalledWith(offer);
  });

  it('calls onAccept with the offer when Accept is clicked', async () => {
    const onAccept = vi.fn();
    const offer = makeOffer({ proposedBy: 'customer' });
    renderCard(offer, 'freelancer', { onAccept });
    await userEvent.click(screen.getByText('Accept'));
    expect(onAccept).toHaveBeenCalledWith(offer);
  });

  it('toggles the counter form when Counter is clicked', async () => {
    renderCard(makeOffer({ proposedBy: 'customer' }), 'freelancer');
    expect(screen.queryByPlaceholderText(/enter revised amount/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Counter'));
    expect(screen.getByPlaceholderText(/enter revised amount/i)).toBeInTheDocument();
  });

  it('hides the counter form when Cancel is clicked', async () => {
    renderCard(makeOffer({ proposedBy: 'customer' }), 'freelancer');
    await userEvent.click(screen.getByText('Counter'));
    await userEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText(/enter revised amount/i)).not.toBeInTheDocument();
  });

  it('shows a validation error when the counter amount is zero', async () => {
    renderCard(makeOffer({ proposedBy: 'customer' }), 'freelancer');
    await userEvent.click(screen.getByText('Counter'));
    const input = screen.getByPlaceholderText(/enter revised amount/i);
    await userEvent.clear(input);
    await userEvent.type(input, '0');
    await userEvent.click(screen.getByText('Send Counter'));
    expect(screen.getByText(/enter a valid counter amount/i)).toBeInTheDocument();
  });

  it('calls onCounter with the parsed amount on a valid submission', async () => {
    const onCounter = vi.fn().mockResolvedValue(undefined);
    const offer = makeOffer({ proposedBy: 'customer' });
    renderCard(offer, 'freelancer', { onCounter });
    await userEvent.click(screen.getByText('Counter'));
    const input = screen.getByPlaceholderText(/enter revised amount/i);
    await userEvent.clear(input);
    await userEvent.type(input, '200');
    await userEvent.click(screen.getByText('Send Counter'));
    await waitFor(() => expect(onCounter).toHaveBeenCalledWith(offer, 200));
  });

  it('shows a "Counter sent" message after a successful counter submission', async () => {
    const onCounter = vi.fn().mockResolvedValue(undefined);
    const offer = makeOffer({ proposedBy: 'customer' });
    renderCard(offer, 'freelancer', { onCounter });
    await userEvent.click(screen.getByText('Counter'));
    const input = screen.getByPlaceholderText(/enter revised amount/i);
    await userEvent.clear(input);
    await userEvent.type(input, '175');
    await userEvent.click(screen.getByText('Send Counter'));
    await waitFor(() => expect(screen.getByText(/counter sent/i)).toBeInTheDocument());
  });

  it('shows a failure error message when onCounter rejects', async () => {
    const onCounter = vi.fn().mockRejectedValue(new Error('network error'));
    const offer = makeOffer({ proposedBy: 'customer' });
    renderCard(offer, 'freelancer', { onCounter });
    await userEvent.click(screen.getByText('Counter'));
    const input = screen.getByPlaceholderText(/enter revised amount/i);
    await userEvent.clear(input);
    await userEvent.type(input, '175');
    await userEvent.click(screen.getByText('Send Counter'));
    await waitFor(() => expect(screen.getByText(/failed to send counter/i)).toBeInTheDocument());
  });
});
