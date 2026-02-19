
-- Create clients table (client companies managed by consultants within a workspace)
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  revenue_range TEXT,
  headcount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS: workspace members can view clients in their workspace
CREATE POLICY "Workspace members can view clients"
  ON public.clients FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

-- RLS: workspace members can insert clients
CREATE POLICY "Workspace members can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

-- RLS: workspace members can update clients
CREATE POLICY "Workspace members can update clients"
  ON public.clients FOR UPDATE
  USING (is_workspace_member(auth.uid(), workspace_id));

-- RLS: workspace members can delete clients
CREATE POLICY "Workspace members can delete clients"
  ON public.clients FOR DELETE
  USING (is_workspace_member(auth.uid(), workspace_id));

-- RLS: unburnt_admin can manage all clients
CREATE POLICY "Unburnt admins can manage all clients"
  ON public.clients FOR ALL
  USING (has_role(auth.uid(), 'unburnt_admin'::app_role));

-- Create assessments table (module runs per client)
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL DEFAULT 'rpe', -- 'rpe' | 'scope' | 'pl' | 'cashflow'
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'complete'
  current_step INTEGER NOT NULL DEFAULT 1,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  total_weighted_score NUMERIC,
  score_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view assessments"
  ON public.assessments FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update assessments"
  ON public.assessments FOR UPDATE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can delete assessments"
  ON public.assessments FOR DELETE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Unburnt admins can manage all assessments"
  ON public.assessments FOR ALL
  USING (has_role(auth.uid(), 'unburnt_admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
