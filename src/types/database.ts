// Database types for Clario Portal
export type AppRole = 'client_user' | 'client_admin' | 'unburnt_admin';

export interface Account {
  id: string;
  name: string;
  industry?: string;
  revenue_range?: string;
  headcount?: number;
  locations?: string[];
  tools?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  account_id: string;
  type: string;
  status: string;
  start_date?: string;
  readout_date?: string;
  day_counter: number;
  phase_statuses?: Record<string, unknown>;
  outcomes_90_day?: string[];
  scope_workflows?: string[];
  scope_teams?: string[];
  constraints_nonnegotiables?: string[];
  created_at: string;
  updated_at: string;
}

export interface IntakeResponse {
  id: string;
  workspace_id: string;
  symptom_clusters?: string[];
  pain_ratings?: Record<string, number>;
  toc_wait_points?: string;
  toc_replanning_points?: string;
  toc_one_fix_effect?: string;
  recurring_fire_sentence?: string;
  decisions_bottleneck?: string;
  tools_list?: Record<string, string>[];
  metrics_tracked_today?: string;
  created_at: string;
  updated_at: string;
}

export interface Artifact {
  id: string;
  workspace_id: string;
  type: string;
  title?: string;
  link_or_file: string;
  tags?: string[];
  notes?: string;
  created_at: string;
}

export interface Interview {
  id: string;
  workspace_id: string;
  interviewee_name: string;
  role: string;
  email?: string;
  status: string;
  scheduled_at?: string;
  notes?: string;
  themes?: string[];
  created_at: string;
  updated_at: string;
}

export interface Survey {
  id: string;
  workspace_id: string;
  share_link?: string;
  sent_at?: string;
  response_count: number;
  aggregates?: Record<string, unknown>;
  themes?: string[];
  burnout_risk_avg?: number;
  created_at: string;
  updated_at: string;
}

export interface SIPOC {
  id: string;
  workspace_id: string;
  workflow_name: string;
  suppliers?: string[];
  inputs?: string[];
  process_steps?: string[];
  outputs?: string[];
  customers?: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  step_name: string;
  owner_role?: string;
  tool?: string;
  inputs_required?: string[];
}

export interface WorkflowHandoff {
  from_step: string;
  to_step: string;
  missing_inputs_common?: string[];
}

export interface WorkflowQueue {
  where_work_waits: string;
  typical_delay?: number;
}

export interface WorkflowReworkLoop {
  loop_name: string;
  trigger?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'rare';
}

export interface WorkflowMap {
  id: string;
  workspace_id: string;
  workflow_name: string;
  steps?: WorkflowStep[];
  handoffs?: WorkflowHandoff[];
  queues?: WorkflowQueue[];
  rework_loops?: WorkflowReworkLoop[];
  created_at: string;
  updated_at: string;
}

export interface FlowBaseline {
  id: string;
  workspace_id: string;
  wip_count?: number;
  throughput_per_week?: number;
  lead_time_days?: number;
  rework_rate?: number;
  billing_cycle_days?: number;
  ar_aging_30?: number;
  ar_aging_60?: number;
  ar_aging_90?: number;
  confidence_level: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  created_at: string;
}

// Completion status for dashboard
export interface CompletionStatus {
  kickoff: boolean;
  intake: boolean;
  artifacts: boolean;
  interviews: boolean;
  survey: boolean;
  sipoc: boolean;
  workflow: boolean;
  baseline: boolean;
  synthesis: boolean;
}
