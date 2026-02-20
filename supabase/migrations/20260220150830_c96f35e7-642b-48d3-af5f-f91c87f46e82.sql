
-- Create rpe_health_check_state table (one row per workspace, upserted on save)
CREATE TABLE public.rpe_health_check_state (
  id           uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE,
  inputs       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamp with time zone NOT NULL DEFAULT now(),
  updated_at   timestamp with time zone NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER update_rpe_health_check_state_updated_at
  BEFORE UPDATE ON public.rpe_health_check_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.rpe_health_check_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view rpe health check state"
  ON public.rpe_health_check_state FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert rpe health check state"
  ON public.rpe_health_check_state FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update rpe health check state"
  ON public.rpe_health_check_state FOR UPDATE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Unburnt admins can manage all rpe health check state"
  ON public.rpe_health_check_state FOR ALL
  USING (has_role(auth.uid(), 'unburnt_admin'::app_role));
