-- ============================================================
-- Migration 005: offers
-- Depends on: users (002), listings (003)
-- Models the Offer state machine: pending → active | rejected | expired
-- freelancer_id is denormalized from the listing to avoid
-- joins in RLS policies and Supabase Realtime subscriptions.
-- ============================================================

CREATE TYPE offer_status AS ENUM ('pending', 'active', 'rejected', 'expired');

CREATE TABLE IF NOT EXISTS offers (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   uuid         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- Denormalized: mirrors listings.freelancer_id for RLS + Realtime filtering
  freelancer_id uuid         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  listing_id    uuid         NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  amount        numeric(12,2) NOT NULL CHECK (amount > 0),
  scope         text,
  status        offer_status  NOT NULL DEFAULT 'pending',
  expires_at    timestamptz  DEFAULT (now() + INTERVAL '7 days'),
  created_at    timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  offers              IS 'Customer-submitted offers; drives the Offer state machine.';
COMMENT ON COLUMN offers.freelancer_id IS 'Denormalized from listings.freelancer_id. Kept in sync by the insert trigger below.';
COMMENT ON COLUMN offers.expires_at   IS 'Auto-set to 7 days out; OfferRepository.expireStale() flips status to expired.';

-- Trigger: auto-populate freelancer_id from listing on insert
-- so callers never need to supply it manually.
CREATE OR REPLACE FUNCTION set_offer_freelancer_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  SELECT freelancer_id INTO NEW.freelancer_id
  FROM listings WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER offers_set_freelancer_id
  BEFORE INSERT ON offers
  FOR EACH ROW EXECUTE FUNCTION set_offer_freelancer_id();

-- Indexes for common access patterns
CREATE INDEX idx_offers_customer   ON offers (customer_id);
CREATE INDEX idx_offers_freelancer ON offers (freelancer_id);
CREATE INDEX idx_offers_listing    ON offers (listing_id);
CREATE INDEX idx_offers_status     ON offers (status);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Customers can create offers.
CREATE POLICY "offers_insert_customer"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id
    AND (auth.jwt() ->> 'role') = 'customer'
  );

-- Customers can read their own offers.
CREATE POLICY "offers_select_customer"
  ON offers FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

-- Freelancers can read offers directed at their listings.
CREATE POLICY "offers_select_freelancer"
  ON offers FOR SELECT
  TO authenticated
  USING (auth.uid() = freelancer_id);

-- Freelancers can update status (accept / reject / counter) on their offers.
CREATE POLICY "offers_update_freelancer"
  ON offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = freelancer_id)
  WITH CHECK (auth.uid() = freelancer_id);

-- Admins have full access (AdminCascadePolicy.expireOffers).
CREATE POLICY "offers_all_admin"
  ON offers FOR ALL
  TO authenticated
  USING  ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- ── Supabase Realtime ────────────────────────────────────────
-- Enable Realtime on offers so React re-renders on status changes
-- (e.g. pending → active). Filtered by freelancer_id client-side.
ALTER PUBLICATION supabase_realtime ADD TABLE offers;