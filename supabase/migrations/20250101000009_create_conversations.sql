-- ============================================================
-- Migration 008: conversations + messages
-- Depends on: users (002)
-- Powers the P1 real-time chat via Supabase Realtime.
-- ============================================================

-- ── Conversations ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  freelancer_id uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),

  -- One conversation per customer–freelancer pair
  CONSTRAINT conversations_unique_pair UNIQUE (customer_id, freelancer_id)
);

COMMENT ON TABLE conversations IS
  'Chat thread between a customer and a freelancer. One thread per pair.';

CREATE INDEX idx_conversations_customer   ON conversations (customer_id);
CREATE INDEX idx_conversations_freelancer ON conversations (freelancer_id);

-- ── Row Level Security: conversations ───────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Only the two participants can see the conversation.
CREATE POLICY "conversations_select_participant"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = freelancer_id
  );

-- Either participant can create a conversation (upsert-safe).
CREATE POLICY "conversations_insert_participant"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id
    OR auth.uid() = freelancer_id
  );

-- Admins have full access (for audit / moderation).
CREATE POLICY "conversations_all_admin"
  ON conversations FOR ALL
  TO authenticated
  USING  ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');