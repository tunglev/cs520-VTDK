import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const THROTTLE_INTERVAL = 30_000; // Reset timer at most once per 30s
// const INACTIVITY_TIMEOUT = 5_000; // TEMP: 5 seconds for testing (revert to 15 * 60 * 1000)
// const THROTTLE_INTERVAL = 1_000; // TEMP: 1 second for testing (revert to 30_000)

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'keydown',
  'mousedown',
  'touchstart',
  'scroll',
];

export function useInactivityLogout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetRef = useRef<number>(Date.now());

  useEffect(() => {
    function logout() {
      supabase.auth.signOut();
    }

    function resetTimer() {
      const now = Date.now();
      if (now - lastResetRef.current < THROTTLE_INTERVAL) return;
      lastResetRef.current = now;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
    }

    // Start the initial timer
    timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, []);
}
