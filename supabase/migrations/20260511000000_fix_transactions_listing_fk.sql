-- Allow listing_id to be NULL so a listing can be deleted without losing
-- transaction history. The Market Comparator aggregates on category_id,
-- so pricing reports continue to work after a listing is removed.
ALTER TABLE transactions
  DROP CONSTRAINT transactions_listing_id_fkey,
  ALTER COLUMN listing_id DROP NOT NULL;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_listing_id_fkey
    FOREIGN KEY (listing_id) REFERENCES listings (id)
    ON DELETE SET NULL;
