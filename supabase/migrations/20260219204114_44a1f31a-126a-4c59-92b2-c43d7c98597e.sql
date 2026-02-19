
CREATE TABLE public.flow_stabilization_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  analysis jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.flow_stabilization_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Unburnt admins can manage all flow stabilization state"
  ON public.flow_stabilization_state FOR ALL
  USING (has_role(auth.uid(), 'unburnt_admin'::app_role));

CREATE POLICY "Workspace members can view flow stabilization state"
  ON public.flow_stabilization_state FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert flow stabilization state"
  ON public.flow_stabilization_state FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update flow stabilization state"
  ON public.flow_stabilization_state FOR UPDATE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER update_flow_stabilization_state_updated_at
  BEFORE UPDATE ON public.flow_stabilization_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
