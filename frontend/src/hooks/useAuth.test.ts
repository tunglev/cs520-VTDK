import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabaseClient';
import { FreelancerUser, CustomerUser } from '../models/users/UserSubclasses';
import { BaseUser } from '../models/users/BaseUser';

const mockAuth = supabase.auth as any;
const mockFrom = supabase.from as any;

const freelancerRow = {
  id: 'user-1',
  email: 'free@test.com',
  role: 'freelancer',
  created_at: '2024-01-01T00:00:00Z',
  is_banned: false,
  banned_at: null,
  ban_reason: null,
  business_name: 'Studio',
  summary: null,
  service_area: null,
  zip_code: null,
  avatar_url: null,
};

const customerRow = {
  ...freelancerRow,
  id: 'user-2',
  email: 'cust@test.com',
  role: 'customer',
};

function mockSessionAndRow(session: any, row: any) {
  mockAuth.getSession.mockResolvedValue({ data: { session } });
  mockAuth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });

  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: row, error: null }),
  };
  mockFrom.mockReturnValue(chain);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAuth', () => {
  it('returns null user when no session exists', async () => {
    mockSessionAndRow(null, null);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('hydrates a FreelancerUser from session', async () => {
    const session = { user: { id: 'user-1' } };
    mockSessionAndRow(session, freelancerRow);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeInstanceOf(FreelancerUser);
    expect(result.current.session).toEqual(session);
  });

  it('hydrates a CustomerUser from session', async () => {
    const session = { user: { id: 'user-2' } };
    mockSessionAndRow(session, customerRow);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeInstanceOf(CustomerUser);
  });

  it('returns null user when DB lookup fails', async () => {
    const session = { user: { id: 'user-1' } };
    mockAuth.getSession.mockResolvedValue({ data: { session } });
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    };
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('returns BaseUser for admin role', async () => {
    const session = { user: { id: 'admin-1' } };
    mockSessionAndRow(session, { ...freelancerRow, id: 'admin-1', role: 'admin' });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeInstanceOf(BaseUser);
  });
});
