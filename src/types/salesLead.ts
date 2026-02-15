import type { ServiceSelection } from './service';

export type LeadStatus = 'new' | 'qualified' | 'accepted' | 'rejected' | 'workspace_created';
export type Urgency = 'immediate' | '1-3_months' | '3-6_months' | 'exploring';
export type RevenueRange = 'under_1m' | '1m-5m' | '5m-10m' | '10m-25m' | '25m_plus';
export type Industry = 'residential_design_build' | 'commercial_construction' | 'remodeling' | 'mixed' | 'other';

export const PAIN_POINTS = [
  'recurring_fires',
  'unclear_root_causes',
  'work_waits',
  'rework_mistakes',
  'decision_bottleneck',
  'schedule_unpredictability',
  'billing_delays',
  'team_burnout',
  'tool_sprawl',
  'unclear_roles',
  'slow_onboarding',
  'client_communication',
] as const;

export type PainPoint = typeof PAIN_POINTS[number];

export const PAIN_POINT_LABELS: Record<PainPoint, string> = {
  recurring_fires: 'Recurring fires / reactive mode',
  unclear_root_causes: 'Unclear root causes for problems',
  work_waits: 'Work waits / bottlenecks',
  rework_mistakes: 'Rework / mistakes / repeated effort',
  decision_bottleneck: 'Decisions bottleneck with one person',
  schedule_unpredictability: 'Schedule unpredictability',
  billing_delays: 'Billing delays / cash flow issues',
  team_burnout: 'Team burnout / turnover risk',
  tool_sprawl: 'Tool sprawl / system mismatch',
  unclear_roles: 'Unclear roles / accountability',
  slow_onboarding: 'Slow onboarding / knowledge gaps',
  client_communication: 'Client communication issues',
};

export interface SalesLeadInput {
  companyName: string;
  industry?: Industry | '';
  revenueRange?: RevenueRange | '';
  headcount?: number | '';
  contactName: string;
  contactTitle?: string;
  contactEmail: string;
  contactPhone?: string;
  servicesSelected: ServiceSelection[];
  painPoints: PainPoint[];
  urgency: Urgency;
  referralSource?: string;
  notes?: string;
}
