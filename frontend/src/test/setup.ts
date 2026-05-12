import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('../lib/supabaseClient', () => {
  const mockAuth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn(),
  };

  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn(),
  });

  return {
    supabase: {
      auth: mockAuth,
      from: mockFrom,
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});
