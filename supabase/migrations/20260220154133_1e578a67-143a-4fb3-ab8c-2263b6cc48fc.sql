
-- Create rpe_assessments table for storing RPE snapshots per workspace
CREATE TABLE public.rpe_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,

  -- timestamps
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- versioning
  calculation_version text NOT NULL,

  -- INPUTS (from the RPE form)
  revenue numeric(14, 2),
  field_fte numeric(8, 2),
  non_field_fte numeric(8, 2),
  backlog numeric(14, 2),
  average_contract_value numeric(14, 2),
  pm_count numeric(8, 2),
  designer_count numeric(8, 2),
  sales_count numeric(8, 2),

  -- OUTPUT METRICS (calculated by the RPE engine)
  total_fte numeric(8, 2),
  total_rpe numeric(14, 2),
  field_rpe numeric(14, 2),
  non_field_rpe numeric(14, 2),
  jobs_per_year numeric(10, 2),
  implied_wip numeric(10, 2),
  backlog_months numeric(10, 2),
  jobs_per_pm numeric(10, 2),
  jobs_per_designer numeric(10, 2),
  jobs_per_sales numeric(10, 2),

  -- optional metadata
  metadata jsonb,

  -- foreign key
  CONSTRAINT rpe_assessments_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);

-- Index for fast latest-snapshot queries per workspace
CREATE INDEX idx_rpe_assessments_workspace_captured
  ON public.rpe_assessments (workspace_id, captured_at DESC);

-- updated_at trigger
CREATE TRIGGER update_rpe_assessments_updated_at
  BEFORE UPDATE ON public.rpe_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.rpe_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace members can view rpe assessments"
  ON public.rpe_assessments FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert rpe assessments"
  ON public.rpe_assessments FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update rpe assessments"
  ON public.rpe_assessments FOR UPDATE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can delete rpe assessments"
  ON public.rpe_assessments FOR DELETE
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Unburnt admins can manage all rpe assessments"
  ON public.rpe_assessments FOR ALL
  USING (has_role(auth.uid(), 'unburnt_admin'::app_role));
