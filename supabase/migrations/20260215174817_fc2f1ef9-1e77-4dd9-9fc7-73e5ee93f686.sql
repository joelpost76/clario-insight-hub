
-- Create sales_leads table
CREATE TABLE IF NOT EXISTS public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'new',
  
  -- Company information
  company_name TEXT NOT NULL,
  industry TEXT,
  revenue_range TEXT,
  headcount INTEGER,
  
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_title TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  -- Services and pricing
  services_selected JSONB NOT NULL,
  total_estimated_investment JSONB,
  
  -- Qualification data
  pain_points TEXT[] NOT NULL DEFAULT '{}',
  urgency TEXT NOT NULL,
  
  -- Attribution
  referral_source TEXT,
  utm_params JSONB,
  notes TEXT,
  
  -- Relationship
  workspace_id UUID REFERENCES public.workspaces(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_sales_lead_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('new', 'qualified', 'accepted', 'rejected', 'workspace_created') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.urgency NOT IN ('immediate', '1-3_months', '3-6_months', 'exploring') THEN
    RAISE EXCEPTION 'Invalid urgency: %', NEW.urgency;
  END IF;
  IF NEW.headcount IS NOT NULL AND NEW.headcount <= 0 THEN
    RAISE EXCEPTION 'Headcount must be positive';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_sales_lead_before_insert_update
  BEFORE INSERT OR UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sales_lead_status();

-- Indexes
CREATE INDEX idx_sales_leads_status ON public.sales_leads(status);
CREATE INDEX idx_sales_leads_created_at ON public.sales_leads(created_at DESC);
CREATE INDEX idx_sales_leads_email ON public.sales_leads(contact_email);
CREATE INDEX idx_sales_leads_workspace_id ON public.sales_leads(workspace_id);

-- RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous/public insert (no auth required for lead submission)
CREATE POLICY "Public can insert sales leads"
  ON public.sales_leads FOR INSERT
  WITH CHECK (true);

-- Only unburnt_admin can read
CREATE POLICY "Only unburnt_admin can read sales leads"
  ON public.sales_leads FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'unburnt_admin'::app_role));

-- Only unburnt_admin can update
CREATE POLICY "Only unburnt_admin can update sales leads"
  ON public.sales_leads FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'unburnt_admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Lead scoring function
CREATE OR REPLACE FUNCTION public.calculate_lead_score(lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  lead_record public.sales_leads;
BEGIN
  SELECT * INTO lead_record FROM public.sales_leads WHERE id = lead_id;
  
  -- Revenue range scoring (0-30 points)
  CASE lead_record.revenue_range
    WHEN '25m_plus' THEN score := score + 30;
    WHEN '10m-25m' THEN score := score + 25;
    WHEN '5m-10m' THEN score := score + 20;
    WHEN '1m-5m' THEN score := score + 15;
    WHEN 'under_1m' THEN score := score + 5;
    ELSE NULL;
  END CASE;
  
  -- Urgency scoring (0-25 points)
  CASE lead_record.urgency
    WHEN 'immediate' THEN score := score + 25;
    WHEN '1-3_months' THEN score := score + 20;
    WHEN '3-6_months' THEN score := score + 10;
    WHEN 'exploring' THEN score := score + 5;
    ELSE NULL;
  END CASE;
  
  -- Pain points (5 points each, max 25)
  IF array_length(lead_record.pain_points, 1) IS NOT NULL THEN
    score := score + LEAST(array_length(lead_record.pain_points, 1) * 5, 25);
  END IF;
  
  -- Services selected (5 points each, max 20)
  score := score + LEAST(
    (SELECT COUNT(*)::integer FROM jsonb_array_elements(lead_record.services_selected) elem
     WHERE elem->>'selected' = 'true') * 5, 20
  );
  
  RETURN score;
END;
$$ LANGUAGE plpgsql SET search_path = public;
