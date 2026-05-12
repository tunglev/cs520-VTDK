import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Transaction } from '../models/marketplace/Marketplace';
import { TransactionRepository } from '../services/repositories/Repositories';
import { TransactionsPage } from './TransactionsPage';
import { supabase } from '../lib/supabaseClient';

// ── Module-level mock: TransactionRepository ──────────────────
// This lets TransactionsPage integration tests control what
// getByUserEnriched() returns without fighting Supabase chain mocks.
vi.mock('../services/repositories/Repositories', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/repositories/Repositories')>();
  const MockTransactionRepository = vi.fn().mockImplementation(function () {
    this.getByUserEnriched = vi.fn().mockResolvedValue([]);
    this.getByUser = vi.fn().mockResolvedValue([]);
  });
  return {
    ...actual,
    TransactionRepository: MockTransactionRepository,
  };
});

// ── Shared helpers ────────────────────────────────────────────

const BASE_ROW = {
  id: 'tx-1',
  offer_id: 'off-1',
  customer_id: 'cust-1',
  freelancer_id: 'free-1',
  listing_id: 'lst-1',
  category_id: 'cat-1',
  final_price: 20,
  completed_at: null,
  listing_title: 'Web Dev',
  freelancer_name: 'Alice',
  customer_name: 'Bob',
};

/** Build a Transaction instance directly from overriding the base row. */
function makeTx(rowOverrides: Record<string, unknown> = {}): Transaction {
  return Transaction.fromRow({ ...BASE_ROW, ...rowOverrides });
}

const MOCK_USER = { id: 'cust-1', name: 'Bob', role: 'customer' };

function renderPage(user = MOCK_USER) {
  return render(
    <MemoryRouter>
      <TransactionsPage user={user} onBack={vi.fn()} />
    </MemoryRouter>
  );
}

// ── Transaction model unit tests ──────────────────────────────

describe('Transaction model', () => {
  it('hydrates from a database row', () => {
    const tx = Transaction.fromRow(BASE_ROW);
    expect(tx).toBeInstanceOf(Transaction);
    expect(tx.id).toBe('tx-1');
    expect(tx.finalPrice).toBe(20);
    expect(tx.isComplete).toBe(false);
    expect(tx.listingTitle).toBe('Web Dev');
    expect(tx.freelancerName).toBe('Alice');
    expect(tx.customerName).toBe('Bob');
  });

  it('isComplete is false when completed_at is null', () => {
    const tx = Transaction.fromRow(BASE_ROW);
    expect(tx.isComplete).toBe(false);
  });

  it('isComplete is true when completed_at is set', () => {
    const tx = Transaction.fromRow({ ...BASE_ROW, completed_at: '2026-05-11T00:00:00Z' });
    expect(tx.isComplete).toBe(true);
  });

  it('markComplete() calls the complete-transaction Edge Function', async () => {
    const completedAt = '2026-05-11T12:00:00Z';
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { success: true, transaction: { completed_at: completedAt } },
      error: null,
    });

    const tx = Transaction.fromRow(BASE_ROW);
    await tx.markComplete();

    expect(supabase.functions.invoke).toHaveBeenCalledWith('complete-transaction', {
      body: { transaction_id: 'tx-1' },
    });
    expect(tx.completedAt).toBe(completedAt);
    expect(tx.isComplete).toBe(true);
  });

  it('markComplete() throws when the Edge Function returns an error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: new Error('Only the customer may mark a transaction complete'),
    });

    const tx = Transaction.fromRow(BASE_ROW);
    await expect(tx.markComplete()).rejects.toThrow();
  });

  it('markComplete() falls back to current timestamp when response omits completed_at', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { success: true, transaction: {} },
      error: null,
    });

    const before = Date.now();
    const tx = Transaction.fromRow(BASE_ROW);
    await tx.markComplete();
    const after = Date.now();

    expect(tx.completedAt).not.toBeNull();
    const ts = new Date(tx.completedAt!).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

// ── TransactionRepository.getByUser unit tests ────────────────

describe('TransactionRepository.getByUser', () => {
  // getByUser still uses the real Supabase chain mock from setup.ts
  // Restore default supabase mock after each test.
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish the module mock cleared by clearAllMocks
    vi.mocked(TransactionRepository).mockImplementation(() => ({
      getByUserEnriched: vi.fn().mockResolvedValue([]),
      getByUser: vi.fn().mockResolvedValue([]),
    }) as any);
  });

  it('returns an empty array when there are no transactions', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any);

    // Use a fresh repo instance that bypasses the module mock
    const { TransactionRepository: RealRepo } = await vi.importActual<
      typeof import('../services/repositories/Repositories')
    >('../services/repositories/Repositories');
    const repo = new RealRepo();
    const result = await repo.getByUser('cust-1');
    expect(result).toEqual([]);
  });

  it('maps rows to Transaction instances', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [BASE_ROW], error: null }),
    } as any);

    const { TransactionRepository: RealRepo } = await vi.importActual<
      typeof import('../services/repositories/Repositories')
    >('../services/repositories/Repositories');
    const repo = new RealRepo();
    const result = await repo.getByUser('cust-1');
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Transaction);
    expect(result[0].id).toBe('tx-1');
  });

  it('throws when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
    } as any);

    const { TransactionRepository: RealRepo } = await vi.importActual<
      typeof import('../services/repositories/Repositories')
    >('../services/repositories/Repositories');
    const repo = new RealRepo();
    await expect(repo.getByUser('cust-1')).rejects.toThrow('DB error');
  });
});

// ── TransactionsPage integration tests ───────────────────────

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(TransactionRepository).mockImplementation(function (this: any) {
      this.getByUserEnriched = vi.fn().mockResolvedValue([]);
    });
  });

  function mockTransactions(txs: Transaction[]) {
    vi.mocked(TransactionRepository).mockImplementation(function (this: any) {
      this.getByUserEnriched = vi.fn().mockResolvedValue(txs);
    });
  }

  function mockFetchError(message: string) {
    vi.mocked(TransactionRepository).mockImplementation(function (this: any) {
      this.getByUserEnriched = vi.fn().mockRejectedValue(new Error(message));
    });
  }

  it('renders the page heading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no transactions', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/No transactions yet/i)).toBeInTheDocument();
    });
  });

  it('renders a transaction card with listing title and price', async () => {
    mockTransactions([makeTx()]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/web dev/i)).toBeInTheDocument();
      // Price appears in both the stat card ($20.00) and the tx card (20.00)
      const priceEls = screen.getAllByText(/20\.00/);
      expect(priceEls.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows IN PROGRESS badge for transactions without completed_at', async () => {
    mockTransactions([makeTx()]);
    renderPage();
    await waitFor(() => {
      // Both the status badge and the tab bar contain "In Progress"
      const matches = screen.getAllByText(/In Progress/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows COMPLETED badge for completed transactions', async () => {
    mockTransactions([makeTx({ completed_at: '2026-05-11T00:00:00Z' })]);
    renderPage();
    await waitFor(() => {
      const matches = screen.getAllByText(/Completed/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows Mark Complete button for customer on in-progress transactions', async () => {
    mockTransactions([makeTx()]);
    renderPage({ id: 'cust-1', name: 'Bob', role: 'customer' });
    await waitFor(() => {
      expect(screen.getByText('Mark Complete')).toBeInTheDocument();
    });
  });

  it('does NOT show Mark Complete button when user is the freelancer', async () => {
    mockTransactions([makeTx()]);
    renderPage({ id: 'free-1', name: 'Alice', role: 'freelancer' });
    await waitFor(() => {
      // Wait for loading to finish first
      expect(screen.queryByText(/No transactions yet/i)).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Mark Complete')).not.toBeInTheDocument();
  });

  it('does NOT show Mark Complete button on already completed transactions', async () => {
    mockTransactions([makeTx({ completed_at: '2026-05-11T00:00:00Z' })]);
    renderPage();
    await waitFor(() => {
      const matches = screen.getAllByText(/Completed/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByText('Mark Complete')).not.toBeInTheDocument();
  });

  it('shows review eligible hint for completed transactions (customer view)', async () => {
    mockTransactions([makeTx({ completed_at: '2026-05-11T00:00:00Z' })]);
    renderPage(); // user is cust-1 (the customer)
    await waitFor(() => {
      expect(screen.getByText(/Review eligible/i)).toBeInTheDocument();
    });
  });

  it('shows stat cards with correct counts and total value', async () => {
    mockTransactions([
      makeTx({ id: 'tx-1' }),
      makeTx({ id: 'tx-2', completed_at: '2026-05-11T00:00:00Z' }),
    ]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();           // total
      expect(screen.getByText('1')).toBeInTheDocument();           // in-progress
      expect(screen.getByText(/\$40\.00/)).toBeInTheDocument();   // total value
    });
  });

  it('filters to In Progress tab correctly', async () => {
    mockTransactions([
      makeTx({ id: 'tx-1', listing_title: 'Web Dev' }),
      makeTx({ id: 'tx-2', listing_title: 'Logo Design', completed_at: '2026-05-11T00:00:00Z' }),
    ]);
    renderPage();

    // Both cards visible initially
    await waitFor(() => {
      expect(screen.getByText(/web dev/i)).toBeInTheDocument();
    });

    // Click "In Progress" tab
    fireEvent.click(document.getElementById('tab-in-progress')!);

    await waitFor(() => {
      expect(screen.getByText(/web dev/i)).toBeInTheDocument();
      expect(screen.queryByText(/logo design/i)).not.toBeInTheDocument();
    });
  });

  it('filters to Completed tab correctly', async () => {
    mockTransactions([
      makeTx({ id: 'tx-1', listing_title: 'Web Dev' }),
      makeTx({ id: 'tx-2', listing_title: 'Logo Design', completed_at: '2026-05-11T00:00:00Z' }),
    ]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/web dev/i)).toBeInTheDocument();
    });

    // Click "Completed" tab
    fireEvent.click(document.getElementById('tab-completed')!);

    await waitFor(() => {
      expect(screen.queryByText(/web dev/i)).not.toBeInTheDocument();
      expect(screen.getByText(/logo design/i)).toBeInTheDocument();
    });
  });

  it('calls the Edge Function and updates the UI on Mark Complete click', async () => {
    const completedAt = '2026-05-11T20:00:00Z';
    mockTransactions([makeTx()]);
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { success: true, transaction: { completed_at: completedAt } },
      error: null,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mark Complete')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Mark Complete'));
    });

    // Edge Function was called with the correct transaction ID
    expect(supabase.functions.invoke).toHaveBeenCalledWith('complete-transaction', {
      body: { transaction_id: 'tx-1' },
    });

    // UI reflects completion — Mark Complete button gone, badge updated
    await waitFor(() => {
      expect(screen.queryByText('Mark Complete')).not.toBeInTheDocument();
      const completedEls = screen.getAllByText(/Completed/i);
      expect(completedEls.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows an inline error message when Mark Complete fails', async () => {
    mockTransactions([makeTx()]);
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: new Error('Only the customer may mark a transaction complete'),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mark Complete')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Mark Complete'));
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Only the customer may mark a transaction complete/i),
      ).toBeInTheDocument();
    });
  });

  it('shows error state and a retry button when the fetch fails', async () => {
    mockFetchError('Network error');
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load transactions/i)).toBeInTheDocument();
      expect(screen.getByText(/Try again/i)).toBeInTheDocument();
    });
  });

  it('calls onBack when the "Back to Profile" button is clicked', async () => {
    const onBack = vi.fn();
    render(
      <MemoryRouter>
        <TransactionsPage user={MOCK_USER} onBack={onBack} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Back to Profile/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Back to Profile/i));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
