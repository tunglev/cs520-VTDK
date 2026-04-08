-- ── Messages ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  body            text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE messages IS
  'Individual chat messages. Supabase Realtime broadcasts inserts to conversation subscribers.';

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX idx_messages_sender       ON messages (sender_id);

-- ── Row Level Security: messages ────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Only participants of the parent conversation can read messages.
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.customer_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

-- Only participants can send messages.
CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.customer_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

-- Admins have full access.
CREATE POLICY "messages_all_admin"
  ON messages FOR ALL
  TO authenticated
  USING  ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- ── Supabase Realtime ────────────────────────────────────────
-- React subscribes to messages filtered by conversation_id so both
-- parties receive new messages instantly without polling.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;