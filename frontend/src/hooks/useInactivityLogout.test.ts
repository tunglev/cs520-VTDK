import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInactivityLogout } from './useInactivityLogout';
import { supabase } from '../lib/supabaseClient';

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useInactivityLogout', () => {
  it('calls signOut after 15 minutes of inactivity', () => {
    renderHook(() => useInactivityLogout());

    vi.advanceTimersByTime(15 * 60 * 1000);

    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });

  it('does not call signOut before 15 minutes', () => {
    renderHook(() => useInactivityLogout());

    vi.advanceTimersByTime(14 * 60 * 1000);

    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('resets the timer on user activity (respecting throttle)', () => {
    renderHook(() => useInactivityLogout());

    // Advance past the 30s throttle window, then trigger activity
    vi.advanceTimersByTime(31_000);
    window.dispatchEvent(new Event('mousemove'));

    // Now 15 minutes from that reset should trigger logout
    vi.advanceTimersByTime(15 * 60 * 1000);
    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });

  it('throttles rapid activity events', () => {
    renderHook(() => useInactivityLogout());

    // Fire many events within the 30s throttle window
    for (let i = 0; i < 10; i++) {
      window.dispatchEvent(new Event('keydown'));
    }

    // The timer should NOT have been reset (still within throttle),
    // so logout fires at the original 15-minute mark
    vi.advanceTimersByTime(15 * 60 * 1000);
    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });

  it('cleans up listeners and timer on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useInactivityLogout());

    unmount();

    const removedEvents = removeSpy.mock.calls.map(c => c[0]);
    expect(removedEvents).toContain('mousemove');
    expect(removedEvents).toContain('keydown');
    expect(removedEvents).toContain('scroll');

    // After unmount, advancing time should not trigger signOut
    vi.clearAllMocks();
    vi.advanceTimersByTime(15 * 60 * 1000);
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});
