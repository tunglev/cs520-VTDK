-- ============================================================
-- Migration 003: listings
-- Depends on: users (002), categories (001)
-- ============================================================

CREATE TABLE IF NOT EXISTS listings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  category_id   uuid        NOT NULL REFERENCES categories (id),
  title         text        NOT NULL,
  description   text        NOT NULL,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  listings             IS 'Service postings created by freelancers.';
COMMENT ON COLUMN listings.is_active   IS 'Set to false by AdminCascadePolicy.onBan() or by the freelancer.';

-- Index for common search patterns
CREATE INDEX idx_listings_category   ON listings (category_id);
CREATE INDEX idx_listings_freelancer ON listings (freelancer_id);
CREATE INDEX idx_listings_active     ON listings (is_active) WHERE is_active = true;

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read active listings.
CREATE POLICY "listings_select_active"
  ON listings FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Freelancers can read all their own listings (including inactive).
CREATE POLICY "listings_select_own"
  ON listings FOR SELECT
  TO authenticated
  USING (auth.uid() = freelancer_id);

-- Freelancers can insert their own listings.
CREATE POLICY "listings_insert_freelancer"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = freelancer_id
    AND (auth.jwt() ->> 'role') = 'freelancer'
  );

-- Freelancers can update their own listings.
CREATE POLICY "listings_update_own"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = freelancer_id)
  WITH CHECK (auth.uid() = freelancer_id);

-- Freelancers can delete their own listings.
CREATE POLICY "listings_delete_own"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = freelancer_id);

-- Admins have full access (needed for AdminCascadePolicy).
CREATE POLICY "listings_all_admin"
  ON listings FOR ALL
  TO authenticated
  USING  ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');