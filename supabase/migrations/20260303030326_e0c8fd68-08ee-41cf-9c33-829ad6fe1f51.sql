
-- Create findings table for constraint capture
CREATE TABLE public.findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  constraint_statement TEXT NOT NULL,
  confidence_level TEXT NOT NULL DEFAULT 'medium',
  recommended_service TEXT,
  consultant_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

-- RLS policies matching existing workspace pattern
CREATE POLICY "Workspace members can view findings"
  ON public.findings FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert findings"
  ON public.findings FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update findings"
  ON public.findings FOR UPDATE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can delete findings"
  ON public.findings FOR DELETE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Unburnt admins can manage all findings"
  ON public.findings FOR ALL
  USING (has_role(auth.uid(), 'unburnt_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_findings_updated_at
  BEFORE UPDATE ON public.findings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
