-- ============================================================
-- Migration 001: categories
-- Independent lookup table; no foreign key dependencies.
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE
);

COMMENT ON TABLE  categories      IS 'Service categories used across listings, ML endpoints, and analytics.';
COMMENT ON COLUMN categories.slug IS 'URL-safe identifier, e.g. "web-development".';

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- All authenticated users may read categories.
CREATE POLICY "categories_select_authenticated"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Only admins may insert / update / delete categories.
CREATE POLICY "categories_write_admin"
  ON categories FOR ALL
  TO authenticated
  USING  ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');