-- ============================================================
-- Migration 004: pricing_models
-- Depends on: listings (003)
-- Persists the Strategy pattern at the database layer.
-- A listing can have multiple pricing options (fixed, hourly,
-- project) that customers choose from.
-- ============================================================

CREATE TYPE pricing_strategy_type AS ENUM ('fixed', 'hourly', 'project');

CREATE TABLE IF NOT EXISTS pricing_models (
  id            uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    uuid                  NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  strategy_type pricing_strategy_type NOT NULL,
  base_price    numeric(12, 2)        NOT NULL CHECK (base_price >= 0),
  unit          text                  -- e.g. 'per hour', 'per project', NULL for fixed
);

COMMENT ON TABLE  pricing_models               IS 'One or more pricing options per listing; maps to PricingStrategy implementations.';
COMMENT ON COLUMN pricing_models.strategy_type IS 'fixed | hourly | project — determines which PricingStrategy class handles the calculation.';
COMMENT ON COLUMN pricing_models.unit          IS 'Human-readable billing unit displayed in the UI.';

CREATE INDEX idx_pricing_models_listing ON pricing_models (listing_id);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE pricing_models ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read pricing models.
CREATE POLICY "pricing_models_select_authenticated"
  ON pricing_models FOR SELECT
  TO authenticated
  USING (true);

-- Freelancers can insert pricing models on their own listings.
CREATE POLICY "pricing_models_insert_owner"
  ON pricing_models FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
        AND listings.freelancer_id = auth.uid()
    )
  );

-- Freelancers can update their own listings' pricing models.
CREATE POLICY "pricing_models_update_owner"
  ON pricing_models FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
        AND listings.freelancer_id = auth.uid()
    )
  );

-- Freelancers can delete their own listings' pricing models.
CREATE POLICY "pricing_models_delete_owner"
  ON pricing_models FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
        AND listings.freelancer_id = auth.uid()
    )
  );

-- Admins have full access.
CREATE POLICY "pricing_models_all_admin"
  ON pricing_models FOR ALL
  TO authenticated
  USING  ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');