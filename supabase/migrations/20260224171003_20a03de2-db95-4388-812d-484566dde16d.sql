CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign default role (invitations are processed at login time via edge function)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client_user')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$function$;