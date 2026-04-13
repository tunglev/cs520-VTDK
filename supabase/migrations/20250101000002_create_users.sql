-- ============================================================
-- Migration 002: users
-- Extends Supabase Auth (auth.users) with profile data.
-- A trigger keeps this table in sync with auth signups.
-- ============================================================

CREATE TYPE user_role AS ENUM ('customer', 'freelancer', 'admin');

CREATE TABLE IF NOT EXISTS users (
  id            uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email         text        NOT NULL UNIQUE,
  role          user_role   NOT NULL DEFAULT 'customer',

  -- Ban system (AdminUser.ban / unban)
  is_banned     boolean     NOT NULL DEFAULT false,
  banned_at     timestamptz,
  ban_reason    text,

  -- Freelancer-only profile fields (nullable for customers / admins)
  business_name text,
  summary       text,
  service_area  text,       -- human-readable region, e.g. "Amherst, MA"
  zip_code      text,

  -- Shared
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  users             IS 'Application user profiles; synced from auth.users via trigger.';
COMMENT ON COLUMN users.role        IS 'customer | freelancer | admin — drives RLS and UI routing.';
COMMENT ON COLUMN users.is_banned   IS 'When true, the user cannot authenticate (enforced in app + RLS).';
COMMENT ON COLUMN users.service_area IS 'Free-text region used for geographic filtering (freelancers).';

-- ── Sync trigger: create a users row when someone signs up ──
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'customer')::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row.
CREATE POLICY "users_select_self"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Freelancer profiles are publicly readable by any authenticated user.
CREATE POLICY "users_select_freelancer_public"
  ON users FOR SELECT
  TO authenticated
  USING (role = 'freelancer' AND is_banned = false);

-- Users can update only their own profile.
CREATE POLICY "users_update_self"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins have unrestricted read/write access.
CREATE POLICY "users_all_admin"
  ON users FOR ALL
  TO authenticated
  USING  ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');