-- Update the trigger function to include full_name with fallbacks
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
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      SPLIT_PART(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Run the backfill again with the fallbacks
UPDATE public.users u
SET full_name = COALESCE(
  au.raw_user_meta_data ->> 'full_name',
  au.raw_user_meta_data ->> 'name',
  SPLIT_PART(au.email, '@', 1)
)
FROM auth.users au
WHERE u.id = au.id AND (u.full_name IS NULL OR u.full_name = '');
