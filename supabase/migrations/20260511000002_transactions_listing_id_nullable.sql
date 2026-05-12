-- The ON DELETE SET NULL FK was applied in 20260511000001 but the column
-- still has NOT NULL, which causes the cascade to fail on existing rows.
ALTER TABLE public.transactions
  ALTER COLUMN listing_id DROP NOT NULL;
