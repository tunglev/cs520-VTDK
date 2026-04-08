-- ============================================================
-- Migration 006: transactions
-- Depends on: users (002), listings (003), offers (005),
--             categories (001)
-- category_id and listing_id are denormalized for efficient
-- pricing report aggregate queries (avoids joining through
-- offers → listings → categories on every report).
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id      uuid           NOT NULL UNIQUE REFERENCES offers (id),
  customer_id   uuid           NOT NULL REFERENCES users (id),
  freelancer_id uuid           NOT NULL REFERENCES users (id),
  -- Denormalized for aggregate reporting
  listing_id    uuid           NOT NULL REFERENCES listings (id),
  category_id   uuid           NOT NULL REFERENCES categories (id),
  final_price   numeric(12,2)  NOT NULL CHECK (final_price >= 0),
  completed_at  timestamptz    -- NULL until the freelancer marks the work done
);

COMMENT ON TABLE  transactions             IS 'Immutable record of a completed (or in-progress) sale. Feeds the Market Comparator.';
COMMENT ON COLUMN transactions.category_id IS 'Denormalized from listings.category_id for O(1) aggregate queries in pricing reports.';
COMMENT ON COLUMN transactions.listing_id  IS 'Denormalized from offers.listing_id for traceability without join chains.';
COMMENT ON COLUMN transactions.completed_at IS 'NULL means the work is accepted but not yet delivered.';

-- Trigger: auto-populate denormalized fields from the accepted offer
CREATE OR REPLACE FUNCTION populate_transaction_from_offer()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_listing listings%ROWTYPE;
  v_offer   offers%ROWTYPE;
BEGIN
  SELECT * INTO v_offer   FROM offers   WHERE id = NEW.offer_id;
  SELECT * INTO v_listing FROM listings WHERE id = v_offer.listing_id;

  NEW.customer_id   := v_offer.customer_id;
  NEW.freelancer_id := v_offer.freelancer_id;
  NEW.listing_id    := v_offer.listing_id;
  NEW.category_id   := v_listing.category_id;
  NEW.final_price   := COALESCE(NEW.final_price, v_offer.amount);
  RETURN NEW;
END;
$$;

CREATE TRIGGER transactions_populate_from_offer
  BEFORE INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION populate_transaction_from_offer();

-- Indexes for pricing report aggregates
CREATE INDEX idx_transactions_category   ON transactions (category_id);
CREATE INDEX idx_transactions_freelancer ON transactions (freelancer_id);
CREATE INDEX idx_transactions_customer   ON transactions (customer_id);
CREATE INDEX idx_transactions_completed  ON transactions (completed_at) WHERE completed_at IS NOT NULL;

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Participants (customer or freelancer) can read their own transactions.
CREATE POLICY "transactions_select_participant"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = freelancer_id
  );

-- Transactions are created by Edge Functions (service role) only —
-- no direct client inserts. The insert policy is therefore admin/service only.
CREATE POLICY "transactions_insert_service"
  ON transactions FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admins have full access.
CREATE POLICY "transactions_all_admin"
  ON transactions FOR ALL
  TO authenticated
  USING  ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- ── Pricing Report Aggregate View ───────────────────────────
-- Used by MarketComparatorFacade to generate anonymous price
-- distributions without exposing individual customer records.
CREATE OR REPLACE VIEW pricing_report_aggregates AS
SELECT
  category_id,
  COUNT(*)                           AS transaction_count,
  MIN(final_price)                   AS price_min,
  MAX(final_price)                   AS price_max,
  ROUND(AVG(final_price), 2)         AS price_avg,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY final_price) AS price_p25,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY final_price) AS price_median,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY final_price) AS price_p75
FROM transactions
WHERE completed_at IS NOT NULL
GROUP BY category_id;

COMMENT ON VIEW pricing_report_aggregates IS
  'Anonymous aggregate pricing data per category. Used by MarketComparatorFacade. '
  'No individual customer or transaction IDs are exposed.';