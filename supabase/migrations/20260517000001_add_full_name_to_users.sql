-- ============================================================
-- Add full_name to users table so we can display actual names 
-- for freelancers instead of defaulting to the listing title.
-- ============================================================

ALTER TABLE public.users ADD COLUMN full_name text;

-- Update the trigger function to include full_name
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'customer')::user_role,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Backfill existing users from auth.users
UPDATE public.users u
SET full_name = au.raw_user_meta_data ->> 'full_name'
FROM auth.users au
WHERE u.id = au.id;
