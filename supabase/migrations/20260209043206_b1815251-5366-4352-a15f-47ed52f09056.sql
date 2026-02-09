
-- Create invitations table for pending user invites
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client_user',
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  UNIQUE(email, workspace_id)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Only unburnt_admins can manage invitations
CREATE POLICY "Unburnt admins can manage all invitations"
  ON public.invitations
  FOR ALL
  USING (has_role(auth.uid(), 'unburnt_admin'));

-- Users can view invitations addressed to them (by email)
CREATE POLICY "Users can view their own invitations"
  ON public.invitations
  FOR SELECT
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- Update handle_new_user to process pending invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inv RECORD;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Check for pending invitations for this email
  FOR inv IN
    SELECT id, workspace_id, role
    FROM public.invitations
    WHERE lower(email) = lower(NEW.email)
      AND status = 'pending'
  LOOP
    -- Assign workspace membership
    INSERT INTO public.workspace_members (workspace_id, user_id)
    VALUES (inv.workspace_id, NEW.id)
    ON CONFLICT DO NOTHING;
    
    -- Assign role (use the invited role instead of default)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, inv.role)
    ON CONFLICT DO NOTHING;
    
    -- Mark invitation as accepted
    UPDATE public.invitations
    SET status = 'accepted', accepted_at = now()
    WHERE id = inv.id;
  END LOOP;
  
  -- If no invitations were found, assign default role
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client_user');
  END IF;
  
  RETURN NEW;
END;
$function$;
