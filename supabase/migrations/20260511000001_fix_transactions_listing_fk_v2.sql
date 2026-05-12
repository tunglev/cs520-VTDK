-- Fix transactions_listing_id_fkey to ON DELETE SET NULL so listings can be
-- deleted while preserving transaction history. The Market Comparator aggregates
-- on category_id, so pricing reports remain accurate after listing deletion.

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_listing_id_fkey;

ALTER TABLE public.transactions
  ALTER COLUMN listing_id DROP NOT NULL;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_listing_id_fkey
    FOREIGN KEY (listing_id) REFERENCES public.listings (id)
    ON DELETE SET NULL;
