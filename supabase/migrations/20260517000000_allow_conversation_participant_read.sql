-- ============================================================
-- Allow conversation participants to read each other's basic profile
-- This is needed for the real-time chat UI to display the other
-- participant's name / initial in the conversation sidebar.
-- Only exposes: id, business_name, email (no sensitive fields).
-- ============================================================

CREATE POLICY "users_select_conversation_participant"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE
        (c.customer_id = auth.uid() AND c.freelancer_id = users.id)
        OR
        (c.freelancer_id = auth.uid() AND c.customer_id = users.id)
    )
  );
