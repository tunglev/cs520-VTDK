import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfferModal } from './OfferModal';

vi.mock('motion/react', () => {
  const Div = React.forwardRef(({ children }: any, ref: any) => <div ref={ref}>{children}</div>);
  Div.displayName = 'MotionDiv';
  return {
    motion: { div: Div },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

vi.mock('../data/mockData', () => ({
  getPricingReport: vi.fn().mockReturnValue({
    category: 'design',
    marketAvg: 55,
    marketMedian: 50,
    marketMin: 30,
    marketMax: 90,
    sampleSize: 42,
    percentile: 60,
    priceDistribution: [],
    scatterData: [],
  }),
}));

vi.mock('../models/users/UserSubclasses', () => {
  class CustomerUser {
    placeOffer = vi.fn().mockResolvedValue({ id: 'offer-123' });
  }
  class FreelancerUser {}
  class AdminUser {}
  return { CustomerUser, FreelancerUser, AdminUser };
});

const MOCK_LISTING = {
  id: 'lst-1',
  name: 'Alex Rivera',
  role: 'UI/UX Designer',
  price: 45,
  category: 'design',
};

describe('OfferModal', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('renders the modal title', () => {
    render(<OfferModal listing={MOCK_LISTING} user={null} onClose={vi.fn()} />);
    expect(screen.getByText(/make an offer/i)).toBeInTheDocument();
  });

  it('calls onClose when the X button is clicked', async () => {
    const onClose = vi.fn();
    render(<OfferModal listing={MOCK_LISTING} user={null} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: '' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('displays market comparator data from getPricingReport', () => {
    render(<OfferModal listing={MOCK_LISTING} user={null} onClose={vi.fn()} />);
    expect(screen.getByText('$55')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('$45')).toBeInTheDocument();
  });

  it('shows market context labels', () => {
    render(<OfferModal listing={MOCK_LISTING} user={null} onClose={vi.fn()} />);
    expect(screen.getByText(/market avg/i)).toBeInTheDocument();
    expect(screen.getByText(/market median/i)).toBeInTheDocument();
    expect(screen.getByText(/this freelancer/i)).toBeInTheDocument();
  });

  it('shows an alert when submitting without a CustomerUser', async () => {
    render(<OfferModal listing={MOCK_LISTING} user={null} onClose={vi.fn()} />);
    const amountInput = screen.getByPlaceholderText(/e\.g\. 150/i);
    await userEvent.type(amountInput, '100');
    await userEvent.click(screen.getByText(/submit offer/i));
    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/customer/i));
  });

  it('shows the success state after a CustomerUser submits an offer', async () => {
    const { CustomerUser } = await import('../models/users/UserSubclasses');
    const customer = new CustomerUser();
    render(<OfferModal listing={MOCK_LISTING} user={customer} onClose={vi.fn()} />);
    const amountInput = screen.getByPlaceholderText(/e\.g\. 150/i);
    await userEvent.type(amountInput, '120');
    await userEvent.click(screen.getByText(/submit offer/i));
    await waitFor(() => expect(screen.getByText(/offer sent/i)).toBeInTheDocument());
  });

  it('renders a scope textarea for additional context', () => {
    render(<OfferModal listing={MOCK_LISTING} user={null} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/describe the project scope/i)).toBeInTheDocument();
  });

  it('shows a close button in the success state', async () => {
    const { CustomerUser } = await import('../models/users/UserSubclasses');
    const customer = new CustomerUser();
    render(<OfferModal listing={MOCK_LISTING} user={customer} onClose={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. 150/i), '80');
    await userEvent.click(screen.getByText(/submit offer/i));
    await waitFor(() => screen.getByText(/offer sent/i));
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });
});
