-- Allow unburnt_admins to view all profiles
CREATE POLICY "Unburnt admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'unburnt_admin'::app_role));