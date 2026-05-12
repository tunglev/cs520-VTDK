-- Migration: Add proposed_by column to offers
-- This tracks whether the offer was last proposed by the customer or freelancer (counter-offers)

ALTER TABLE offers
ADD COLUMN proposed_by text NOT NULL DEFAULT 'customer'
CHECK (proposed_by IN ('customer', 'freelancer'));

-- Allow customers to UPDATE offers (to accept/reject/counter responses from freelancers)
CREATE POLICY "offers_update_customer"
  ON offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);
