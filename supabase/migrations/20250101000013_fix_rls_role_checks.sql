-- ============================================================
-- Migration 013: Fix RLS role checks
-- The original migrations checked (auth.jwt() ->> 'role') which
-- always returns 'authenticated' in Supabase. Custom roles live
-- in the public.users table, not the JWT.
-- This migration adds a helper function and replaces all broken
-- role-based policies across every table.
-- ============================================================

-- Helper: returns the calling user's role from the users table.
-- SECURITY DEFINER lets it bypass RLS on the users table itself.
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

-- ── categories ───────────────────────────────────────────────
DROP POLICY IF EXISTS "categories_all_admin" ON categories;
CREATE POLICY "categories_all_admin"
  ON categories FOR ALL
  TO authenticated
  USING  (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ── users ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_all_admin" ON users;
CREATE POLICY "users_all_admin"
  ON users FOR ALL
  TO authenticated
  USING  (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ── listings ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "listings_insert_freelancer" ON listings;
CREATE POLICY "listings_insert_freelancer"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = freelancer_id
    AND auth_user_role() = 'freelancer'
  );

DROP POLICY IF EXISTS "listings_all_admin" ON listings;
CREATE POLICY "listings_all_admin"
  ON listings FOR ALL
  TO authenticated
  USING  (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ── pricing_models ───────────────────────────────────────────
DROP POLICY IF EXISTS "pricing_models_all_admin" ON pricing_models;
CREATE POLICY "pricing_models_all_admin"
  ON pricing_models FOR ALL
  TO authenticated
  USING  (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ── offers ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "offers_insert_customer" ON offers;
CREATE POLICY "offers_insert_customer"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id
    AND auth_user_role() = 'customer'
  );

DROP POLICY IF EXISTS "offers_all_admin" ON offers;
CREATE POLICY "offers_all_admin"
  ON offers FOR ALL
  TO authenticated
  USING  (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ── transactions ─────────────────────────────────────────────
DROP POLICY IF EXISTS "transactions_all_admin" ON transactions;
CREATE POLICY "transactions_all_admin"
  ON transactions FOR ALL
  TO authenticated
  USING  (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ── reviews ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "reviews_all_admin" ON reviews;
CREATE POLICY "reviews_all_admin"
  ON reviews FOR ALL
  TO authenticated
  USING  (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ── review_responses ─────────────────────────────────────────
DROP POLICY IF EXISTS "review_responses_all_admin" ON review_responses;
CREATE POLICY "review_responses_all_admin"
  ON review_responses FOR ALL
  TO authenticated
  USING  (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ── conversations ────────────────────────────────────────────
DROP POLICY IF EXISTS "conversations_all_admin" ON conversations;
CREATE POLICY "conversations_all_admin"
  ON conversations FOR ALL
  TO authenticated
  USING  (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ── messages ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "messages_all_admin" ON messages;
CREATE POLICY "messages_all_admin"
  ON messages FOR ALL
  TO authenticated
  USING  (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');
