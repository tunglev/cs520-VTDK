-- ============================================================
-- Migration 007: reviews + review_responses
-- Depends on: users (002), transactions (006)
-- One review per transaction (unique constraint).
-- One response per review (unique constraint).
-- ============================================================

-- ── Reviews ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid        NOT NULL UNIQUE REFERENCES transactions (id),
  customer_id    uuid        NOT NULL REFERENCES users (id),
  freelancer_id  uuid        NOT NULL REFERENCES users (id),
  -- e.g. {"communication": 4, "quality": 5, "speed": 3}
  ratings        jsonb       NOT NULL,
  body           text        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  reviews         IS 'Customer reviews for completed transactions. One per transaction.';
COMMENT ON COLUMN reviews.ratings IS 'JSONB map of category → score (1–5). E.g. {"communication":4,"quality":5,"speed":3}.';

CREATE INDEX idx_reviews_freelancer ON reviews (freelancer_id);
CREATE INDEX idx_reviews_customer   ON reviews (customer_id);

-- Trigger: validate that every rating value is between 1 and 5.
-- CHECK constraints cannot use subqueries in Postgres, so this
-- logic lives in a BEFORE INSERT / UPDATE trigger instead.
CREATE OR REPLACE FUNCTION validate_review_ratings()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  kv record;
BEGIN
  FOR kv IN SELECT * FROM jsonb_each(NEW.ratings) LOOP
    IF (kv.value::text)::int NOT BETWEEN 1 AND 5 THEN
      RAISE EXCEPTION 'Rating "%" has value % — must be between 1 and 5.', kv.key, kv.value;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
 
CREATE TRIGGER reviews_validate_ratings
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION validate_review_ratings();

-- Trigger: auto-populate customer_id and freelancer_id from the transaction
CREATE OR REPLACE FUNCTION populate_review_from_transaction()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  SELECT customer_id, freelancer_id
  INTO   NEW.customer_id, NEW.freelancer_id
  FROM   transactions
  WHERE  id = NEW.transaction_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_populate_from_transaction
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION populate_review_from_transaction();

-- ── Row Level Security: reviews ──────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read reviews.
CREATE POLICY "reviews_select_authenticated"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

-- Customers can insert exactly one review per completed transaction.
CREATE POLICY "reviews_insert_customer"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id
    -- The transaction must be completed and belong to this customer.
    AND EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_id
        AND t.customer_id = auth.uid()
        AND t.completed_at IS NOT NULL
    )
  );

-- Admins have full access.
CREATE POLICY "reviews_all_admin"
  ON reviews FOR ALL
  TO authenticated
  USING  ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- ── Freelancer Aggregate Rating View ────────────────────────
-- Pre-computed per-category averages used by the analytics dashboard.
CREATE OR REPLACE VIEW freelancer_rating_aggregates AS
SELECT
  r.freelancer_id,
  COUNT(r.id)                              AS review_count,
  ROUND(AVG((r.ratings ->> 'communication')::numeric), 2) AS avg_communication,
  ROUND(AVG((r.ratings ->> 'quality')::numeric), 2)       AS avg_quality,
  ROUND(AVG((r.ratings ->> 'speed')::numeric), 2)         AS avg_speed,
  ROUND(
    AVG(
      (
        COALESCE((r.ratings ->> 'communication')::numeric, 0) +
        COALESCE((r.ratings ->> 'quality')::numeric, 0) +
        COALESCE((r.ratings ->> 'speed')::numeric, 0)
      ) / 3.0
    ), 2
  ) AS avg_overall
FROM reviews r
GROUP BY r.freelancer_id;

COMMENT ON VIEW freelancer_rating_aggregates IS
  'Aggregate review scores per freelancer. Displayed on public profiles and search cards.';