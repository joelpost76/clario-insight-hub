-- Create role enum for RBAC
CREATE TYPE public.app_role AS ENUM ('client_user', 'client_admin', 'unburnt_admin');

-- Create user_roles table (security best practice: roles in separate table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'client_user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  revenue_range TEXT,
  headcount INTEGER,
  locations TEXT[],
  tools JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'clario_diagnostic',
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  readout_date DATE,
  day_counter INTEGER DEFAULT 1,
  phase_statuses JSONB,
  outcomes_90_day TEXT[],
  scope_workflows TEXT[],
  scope_teams TEXT[],
  constraints_nonnegotiables TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workspace_members junction table (links users to workspaces)
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

-- Create intake_responses table
CREATE TABLE public.intake_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL UNIQUE,
  symptom_clusters TEXT[],
  pain_ratings JSONB,
  toc_wait_points TEXT,
  toc_replanning_points TEXT,
  toc_one_fix_effect TEXT,
  recurring_fire_sentence TEXT,
  decisions_bottleneck TEXT,
  tools_list JSONB,
  metrics_tracked_today TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create artifacts table
CREATE TABLE public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  link_or_file TEXT NOT NULL,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create interviews table
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  interviewee_name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  scheduled_at DATE,
  notes TEXT,
  themes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create surveys table
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL UNIQUE,
  share_link TEXT,
  sent_at DATE,
  response_count INTEGER DEFAULT 0,
  aggregates JSONB,
  themes TEXT[],
  burnout_risk_avg NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sipocs table
CREATE TABLE public.sipocs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  workflow_name TEXT NOT NULL,
  suppliers TEXT[],
  inputs TEXT[],
  process_steps TEXT[],
  outputs TEXT[],
  customers TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workflow_maps table
CREATE TABLE public.workflow_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  workflow_name TEXT NOT NULL,
  steps JSONB,
  handoffs JSONB,
  queues JSONB,
  rework_loops JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create flow_baselines table
CREATE TABLE public.flow_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL UNIQUE,
  wip_count INTEGER,
  throughput_per_week NUMERIC,
  lead_time_days NUMERIC,
  rework_rate NUMERIC,
  billing_cycle_days NUMERIC,
  ar_aging_30 NUMERIC,
  ar_aging_60 NUMERIC,
  ar_aging_90 NUMERIC,
  confidence_level TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table for user metadata
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_intake_responses_updated_at BEFORE UPDATE ON public.intake_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sipocs_updated_at BEFORE UPDATE ON public.sipocs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workflow_maps_updated_at BEFORE UPDATE ON public.workflow_maps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_flow_baselines_updated_at BEFORE UPDATE ON public.flow_baselines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sipocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Unburnt admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'unburnt_admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for accounts (unburnt_admin can manage, workspace members can view)
CREATE POLICY "Unburnt admins can manage accounts" ON public.accounts FOR ALL USING (public.has_role(auth.uid(), 'unburnt_admin'));
CREATE POLICY "Workspace members can view their account" ON public.accounts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    JOIN public.workspace_members wm ON wm.workspace_id = w.id
    WHERE w.account_id = accounts.id AND wm.user_id = auth.uid()
  )
);

-- RLS Policies for workspaces
CREATE POLICY "Unburnt admins can manage all workspaces" ON public.workspaces FOR ALL USING (public.has_role(auth.uid(), 'unburnt_admin'));
CREATE POLICY "Workspace members can view their workspaces" ON public.workspaces FOR SELECT USING (public.is_workspace_member(auth.uid(), id));
CREATE POLICY "Client admins can update their workspaces" ON public.workspaces FOR UPDATE USING (
  public.is_workspace_member(auth.uid(), id) AND public.has_role(auth.uid(), 'client_admin')
);

-- RLS Policies for workspace_members
CREATE POLICY "Unburnt admins can manage workspace members" ON public.workspace_members FOR ALL USING (public.has_role(auth.uid(), 'unburnt_admin'));
CREATE POLICY "Workspace members can view their membership" ON public.workspace_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Client admins can manage their workspace members" ON public.workspace_members FOR ALL USING (
  public.is_workspace_member(auth.uid(), workspace_id) AND public.has_role(auth.uid(), 'client_admin')
);

-- RLS Policies for intake_responses
CREATE POLICY "Unburnt admins can manage all intake responses" ON public.intake_responses FOR ALL USING (public.has_role(auth.uid(), 'unburnt_admin'));
CREATE POLICY "Workspace members can view intake responses" ON public.intake_responses FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert intake responses" ON public.intake_responses FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update intake responses" ON public.intake_responses FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id));

-- RLS Policies for artifacts
CREATE POLICY "Unburnt admins can manage all artifacts" ON public.artifacts FOR ALL USING (public.has_role(auth.uid(), 'unburnt_admin'));
CREATE POLICY "Workspace members can view artifacts" ON public.artifacts FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert artifacts" ON public.artifacts FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update artifacts" ON public.artifacts FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete artifacts" ON public.artifacts FOR DELETE USING (public.is_workspace_member(auth.uid(), workspace_id));

-- RLS Policies for interviews
CREATE POLICY "Unburnt admins can manage all interviews" ON public.interviews FOR ALL USING (public.has_role(auth.uid(), 'unburnt_admin'));
CREATE POLICY "Workspace members can view interviews" ON public.interviews FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert interviews" ON public.interviews FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update interviews" ON public.interviews FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete interviews" ON public.interviews FOR DELETE USING (public.is_workspace_member(auth.uid(), workspace_id));

-- RLS Policies for surveys
CREATE POLICY "Unburnt admins can manage all surveys" ON public.surveys FOR ALL USING (public.has_role(auth.uid(), 'unburnt_admin'));
CREATE POLICY "Workspace members can view surveys" ON public.surveys FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert surveys" ON public.surveys FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update surveys" ON public.surveys FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id));

-- RLS Policies for sipocs
CREATE POLICY "Unburnt admins can manage all sipocs" ON public.sipocs FOR ALL USING (public.has_role(auth.uid(), 'unburnt_admin'));
CREATE POLICY "Workspace members can view sipocs" ON public.sipocs FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert sipocs" ON public.sipocs FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update sipocs" ON public.sipocs FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete sipocs" ON public.sipocs FOR DELETE USING (public.is_workspace_member(auth.uid(), workspace_id));

-- RLS Policies for workflow_maps
CREATE POLICY "Unburnt admins can manage all workflow maps" ON public.workflow_maps FOR ALL USING (public.has_role(auth.uid(), 'unburnt_admin'));
CREATE POLICY "Workspace members can view workflow maps" ON public.workflow_maps FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert workflow maps" ON public.workflow_maps FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update workflow maps" ON public.workflow_maps FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete workflow maps" ON public.workflow_maps FOR DELETE USING (public.is_workspace_member(auth.uid(), workspace_id));

-- RLS Policies for flow_baselines
CREATE POLICY "Unburnt admins can manage all flow baselines" ON public.flow_baselines FOR ALL USING (public.has_role(auth.uid(), 'unburnt_admin'));
CREATE POLICY "Workspace members can view flow baselines" ON public.flow_baselines FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert flow baselines" ON public.flow_baselines FOR INSERT WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update flow baselines" ON public.flow_baselines FOR UPDATE USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client_user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();