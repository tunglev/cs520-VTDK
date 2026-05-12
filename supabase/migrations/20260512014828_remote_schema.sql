alter table "public"."transactions" drop constraint "transactions_listing_id_fkey";

alter table "public"."offers" add column "proposed_by" text not null default 'customer'::text;

alter table "public"."transactions" alter column "listing_id" drop not null;

alter table "public"."offers" add constraint "offers_proposed_by_check" CHECK ((proposed_by = ANY (ARRAY['customer'::text, 'freelancer'::text]))) not valid;

alter table "public"."offers" validate constraint "offers_proposed_by_check";

alter table "public"."transactions" add constraint "transactions_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL not valid;

alter table "public"."transactions" validate constraint "transactions_listing_id_fkey";


  create policy "offers_update_customer"
  on "public"."offers"
  as permissive
  for update
  to authenticated
using ((auth.uid() = customer_id))
with check ((auth.uid() = customer_id));



