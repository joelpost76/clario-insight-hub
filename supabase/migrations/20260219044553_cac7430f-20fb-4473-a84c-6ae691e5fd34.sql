
-- ─── Scope Creep Assessments ────────────────────────────────────────────────
CREATE TABLE public.scope_creep_assessments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid REFERENCES public.workspaces(id) NOT NULL,
  client_id             uuid REFERENCES public.clients(id) NOT NULL,
  current_step          integer NOT NULL DEFAULT 1,
  is_complete           boolean NOT NULL DEFAULT false,
  total_jobs            integer,
  date_range_start      date,
  date_range_end        date,
  avg_estimate_accuracy numeric,
  co_capture_rate       numeric,
  total_margin_leakage  numeric,
  constraint_score      numeric,
  root_cause_notes      text,
  impact_model          jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── Scope Creep Jobs ────────────────────────────────────────────────────────
CREATE TABLE public.scope_creep_jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id     uuid REFERENCES public.scope_creep_assessments(id) ON DELETE CASCADE NOT NULL,
  job_name          text,
  project_type      text,
  estimator_name    text,
  contract_value    numeric,
  estimated_cost    numeric,
  actual_cost       numeric,
  cos_issued        integer DEFAULT 0,
  cos_signed        integer DEFAULT 0,
  co_value_issued   numeric DEFAULT 0,
  co_value_signed   numeric DEFAULT 0,
  job_start_date    date,
  job_end_date      date,
  is_excluded       boolean DEFAULT false
);

-- ─── Scope Creep Column Map ──────────────────────────────────────────────────
CREATE TABLE public.scope_creep_column_map (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  uuid REFERENCES public.scope_creep_assessments(id) ON DELETE CASCADE NOT NULL,
  raw_headers    jsonb,
  mapping        jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── Updated-at trigger ──────────────────────────────────────────────────────
CREATE TRIGGER update_scope_creep_assessments_updated_at
  BEFORE UPDATE ON public.scope_creep_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.scope_creep_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_creep_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_creep_column_map ENABLE ROW LEVEL SECURITY;

-- ─── RLS: scope_creep_assessments ────────────────────────────────────────────
CREATE POLICY "Workspace members can view scope creep assessments"
  ON public.scope_creep_assessments FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert scope creep assessments"
  ON public.scope_creep_assessments FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update scope creep assessments"
  ON public.scope_creep_assessments FOR UPDATE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can delete scope creep assessments"
  ON public.scope_creep_assessments FOR DELETE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Unburnt admins can manage all scope creep assessments"
  ON public.scope_creep_assessments FOR ALL
  USING (public.has_role(auth.uid(), 'unburnt_admin'::app_role));

-- ─── RLS: scope_creep_jobs ────────────────────────────────────────────────────
CREATE POLICY "Workspace members can view scope creep jobs"
  ON public.scope_creep_jobs FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM public.scope_creep_assessments
      WHERE public.is_workspace_member(auth.uid(), workspace_id)
    )
  );

CREATE POLICY "Workspace members can insert scope creep jobs"
  ON public.scope_creep_jobs FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM public.scope_creep_assessments
      WHERE public.is_workspace_member(auth.uid(), workspace_id)
    )
  );

CREATE POLICY "Workspace members can update scope creep jobs"
  ON public.scope_creep_jobs FOR UPDATE
  USING (
    assessment_id IN (
      SELECT id FROM public.scope_creep_assessments
      WHERE public.is_workspace_member(auth.uid(), workspace_id)
    )
  );

CREATE POLICY "Workspace members can delete scope creep jobs"
  ON public.scope_creep_jobs FOR DELETE
  USING (
    assessment_id IN (
      SELECT id FROM public.scope_creep_assessments
      WHERE public.is_workspace_member(auth.uid(), workspace_id)
    )
  );

CREATE POLICY "Unburnt admins can manage all scope creep jobs"
  ON public.scope_creep_jobs FOR ALL
  USING (public.has_role(auth.uid(), 'unburnt_admin'::app_role));

-- ─── RLS: scope_creep_column_map ─────────────────────────────────────────────
CREATE POLICY "Workspace members can view scope creep column maps"
  ON public.scope_creep_column_map FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM public.scope_creep_assessments
      WHERE public.is_workspace_member(auth.uid(), workspace_id)
    )
  );

CREATE POLICY "Workspace members can insert scope creep column maps"
  ON public.scope_creep_column_map FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM public.scope_creep_assessments
      WHERE public.is_workspace_member(auth.uid(), workspace_id)
    )
  );

CREATE POLICY "Workspace members can update scope creep column maps"
  ON public.scope_creep_column_map FOR UPDATE
  USING (
    assessment_id IN (
      SELECT id FROM public.scope_creep_assessments
      WHERE public.is_workspace_member(auth.uid(), workspace_id)
    )
  );

CREATE POLICY "Unburnt admins can manage all scope creep column maps"
  ON public.scope_creep_column_map FOR ALL
  USING (public.has_role(auth.uid(), 'unburnt_admin'::app_role));
