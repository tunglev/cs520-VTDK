-- ── Review Responses ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS review_responses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id     uuid        NOT NULL UNIQUE REFERENCES reviews (id),
  freelancer_id uuid        NOT NULL REFERENCES users (id),
  body          text        NOT NULL CHECK (char_length(body) <= 500),
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  review_responses      IS 'Freelancer reply to a customer review. One per review, max 500 chars.';
COMMENT ON COLUMN review_responses.body IS 'Validated against char_length <= 500 and profanity filter in the Edge Function.';

CREATE INDEX idx_review_responses_review     ON review_responses (review_id);
CREATE INDEX idx_review_responses_freelancer ON review_responses (freelancer_id);

-- ── Row Level Security: review_responses ────────────────────
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read responses.
CREATE POLICY "review_responses_select_authenticated"
  ON review_responses FOR SELECT
  TO authenticated
  USING (true);

-- Freelancers can respond only to reviews on their own profile.
CREATE POLICY "review_responses_insert_owner"
  ON review_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = freelancer_id
    AND EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_id
        AND r.freelancer_id = auth.uid()
    )
  );

-- Admins have full access.
CREATE POLICY "review_responses_all_admin"
  ON review_responses FOR ALL
  TO authenticated
  USING  ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');