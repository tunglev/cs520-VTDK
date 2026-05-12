-- ============================================================
-- Migration 014: allow customers to mark their transactions complete
-- The original transactions table only allows service_role inserts
-- and participant selects.  We need to let the customer set
-- completed_at so the "Mark Complete" button can work directly
-- from the browser (the Edge Function uses service_role so this
-- is belt-and-suspenders, but keeping it for direct-client path).
-- ============================================================

-- Customers may update completed_at on their own transactions,
-- but only when the transaction is not already completed.
CREATE POLICY "transactions_update_customer_complete"
  ON transactions FOR UPDATE
  TO authenticated
  USING  (auth.uid() = customer_id AND completed_at IS NULL)
  WITH CHECK (auth.uid() = customer_id);

-- Freelancers may also mark their side complete (future-proof).
CREATE POLICY "transactions_update_freelancer_complete"
  ON transactions FOR UPDATE
  TO authenticated
  USING  (auth.uid() = freelancer_id AND completed_at IS NULL)
  WITH CHECK (auth.uid() = freelancer_id);
