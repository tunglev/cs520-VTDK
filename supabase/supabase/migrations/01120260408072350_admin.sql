-- ============================================================
-- Migration 009: AdminCascadePolicy functions
-- Depends on: all prior migrations
-- ============================================================

-- ── AdminCascadePolicy functions ─────────────────────────────
-- These are called by AdminUser.ban() and AdminUser.deleteUser()
-- via a Supabase Edge Function. They enforce referential
-- integrity side effects that are not handled by FK cascades.

-- onBan(userId): deactivate listings, expire pending offers,
--                flag conversations as archived.
CREATE OR REPLACE FUNCTION admin_cascade_on_ban(p_user_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 1. Mark the user as banned
  UPDATE users
  SET is_banned   = true,
      banned_at   = now(),
      ban_reason  = p_reason
  WHERE id = p_user_id;

  -- 2. Deactivate all of the user's listings
  UPDATE listings
  SET is_active = false
  WHERE freelancer_id = p_user_id
    AND is_active = true;

  -- 3. Expire all pending offers FROM the user (as customer)
  UPDATE offers
  SET status = 'expired'
  WHERE customer_id = p_user_id
    AND status = 'pending';

  -- 4. Expire all pending offers TO the user (as freelancer)
  UPDATE offers
  SET status = 'expired'
  WHERE freelancer_id = p_user_id
    AND status = 'pending';
END;
$$;

COMMENT ON FUNCTION admin_cascade_on_ban IS
  'AdminCascadePolicy.onBan() — bans the user and cascades effects '
  'to listings, offers. Called by the admin Edge Function.';

-- onDelete(userId): hard-delete the user and rely on FK ON DELETE CASCADE
--                   for listings, offers, reviews, messages.
--                   Wrap in a function so Edge Functions have a clean API.
CREATE OR REPLACE FUNCTION admin_cascade_on_delete(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Run the ban cascade first to clean up active state
  PERFORM admin_cascade_on_ban(p_user_id, 'Account deleted by admin');

  -- Delete the auth user; ON DELETE CASCADE handles the rest.
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION admin_cascade_on_delete IS
  'AdminCascadePolicy.onDelete() — bans first, then hard-deletes. '
  'FK ON DELETE CASCADE propagates to listings, offers, messages, etc.';

-- onUnban(userId): lift the ban so the user can authenticate again.
CREATE OR REPLACE FUNCTION admin_cascade_on_unban(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE users
  SET is_banned  = false,
      banned_at  = NULL,
      ban_reason = NULL
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION admin_cascade_on_unban IS
  'AdminCascadePolicy — lifts a ban. Listings must be manually re-activated by the freelancer.';

-- ── Offer auto-expiry helper ──────────────────────────────────
-- Called by OfferRepository.expireStale() via a scheduled Edge
-- Function (cron) or on-demand from the backend.
CREATE OR REPLACE FUNCTION expire_stale_offers()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE offers
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$;

COMMENT ON FUNCTION expire_stale_offers IS
  'OfferRepository.expireStale() implementation. '
  'Set up as a pg_cron job or called by a Supabase Edge Function cron.';