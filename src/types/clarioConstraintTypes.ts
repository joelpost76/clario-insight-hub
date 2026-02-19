// Data from the Kickoff step

export type WorkflowInScope =
  | "LEAD_TO_ESTIMATE_TO_SALE"
  | "SALE_TO_JOB_SETUP_TO_SCHEDULING"
  | "SCHEDULING_TO_DELIVERY"
  | "CHANGE_ORDERS"
  | "BILLING_TO_COLLECTIONS"
  | "CLOSEOUT_HANDOFF"
  | "SUPPORT_SERVICE";

export interface KickoffOutcome {
  id: string;
  label: string; // e.g. "Billing cycle time under 5 days"
}

export interface KickoffData {
  outcomes90Day: KickoffOutcome[];
  workflowsInScope: WorkflowInScope[];
  teamsInScope: string[];              // e.g. ["Sales", "PMs", "Finance"]
  constraintsNonNegotiables: string[]; // list of text strings
  startDate?: string;                  // ISO date
  readoutDate?: string;                // ISO date
}

// Data from Intake – map from existing Intake storage into these shapes

export interface SymptomSection {
  selectedClusters: string[]; // labels from the symptom checklist
  oneSentenceProblem: string;
}

export interface PainRatingsSection {
  salesToOps: number;
  estimatingScopeQuality: number;
  schedulingCapacity: number;
  deliveryExecution: number;
  changeOrders: number;
  jobCostingVisibility: number;
  billingCollections: number;
  roleClarityAccountability: number;
  meetingsCadence: number;
  customerCommunication: number;
}

export interface TocSection {
  whereWorkWaitsLongest: string;
  stepWithMostReplanning: string;
  downstreamFiresIfFixed: string;
}

export interface ToolEntry {
  name: string;
  purpose?: string;
}

export interface DecisionsToolsMetricsSection {
  decisionBottlenecks: string;
  tools: ToolEntry[];
  currentMetrics: string;
}

// Aggregated structured intake for one client

export interface StructuredIntakeData {
  kickoff: KickoffData;
  symptoms: SymptomSection;
  painRatings: PainRatingsSection;
  toc: TocSection;
  decisionsToolsMetrics: DecisionsToolsMetricsSection;
}

// Constraint analysis output (from AI)

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export type ConstraintSource =
  | "SYMPTOMS"
  | "PAIN_RATINGS"
  | "TOC"
  | "DECISIONS"
  | "TOOLS"
  | "METRICS"
  | "KICKOFF";

export interface SupportingSignal {
  source: ConstraintSource;
  fieldKey: string;      // e.g. "schedulingCapacity" or "whereWorkWaitsLongest"
  description: string;   // plain-English interpretation
}

export interface ConstraintAnalysis {
  primaryConstraint: string;          // one clear sentence
  constraintType: string;             // e.g. "Handoff", "Capacity", "Decision bottleneck"
  upstreamCauses: string[];           // system-level causes
  downstreamEffects: string[];        // what pain shrinks if fixed
  supportingSignals: SupportingSignal[];
  suggestedDiagnosticModules: string[];
  aiConfidence: ConfidenceLevel;
  inferredDataQuality: ConfidenceLevel;
  notesForConsultant: string;
}

export interface ConstraintPageState {
  aiAnalysis?: ConstraintAnalysis;
  consultantEdits?: {
    finalConstraint: string;
    finalNotes?: string;
    acceptedAt?: string; // ISO date
  };
}

import { supabase } from "@/integrations/supabase/client";

// ── Workflow label → enum helper ────────────────────────────────────────────

function mapWorkflowLabelToEnum(label: string): WorkflowInScope {
  switch (label) {
    case "Lead intake → Estimate → Sale":
      return "LEAD_TO_ESTIMATE_TO_SALE";
    case "Sale → Job setup → Scheduling":
      return "SALE_TO_JOB_SETUP_TO_SCHEDULING";
    case "Scheduling → Delivery execution":
      return "SCHEDULING_TO_DELIVERY";
    case "Change orders / Variations":
    case "Change orders":
      return "CHANGE_ORDERS";
    case "Billing → Collections":
      return "BILLING_TO_COLLECTIONS";
    case "Closeout / Handoff":
      return "CLOSEOUT_HANDOFF";
    case "Support / Service tickets":
    case "Support / Service":
      return "SUPPORT_SERVICE";
    default:
      return "SUPPORT_SERVICE";
  }
}

// ── Real implementation ──────────────────────────────────────────────────────

export async function buildStructuredIntakeDataForClient(
  workspaceId: string
): Promise<StructuredIntakeData> {
  // Load both rows in parallel; neither query throws if the row is missing
  const [workspaceResult, intakeResult] = await Promise.all([
    supabase.from("workspaces").select("*").eq("id", workspaceId).maybeSingle(),
    supabase
      .from("intake_responses")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
  ]);

  const ws = workspaceResult.data;
  const intake = intakeResult.data;

  // ── Kickoff ──────────────────────────────────────────────────────────────
  const kickoff: KickoffData = {
    outcomes90Day: (ws?.outcomes_90_day ?? []).map((label, i) => ({
      id: String(i),
      label,
    })),
    workflowsInScope: (ws?.scope_workflows ?? []).map(mapWorkflowLabelToEnum),
    teamsInScope: ws?.scope_teams ?? [],
    constraintsNonNegotiables: ws?.constraints_nonnegotiables ?? [],
    startDate: ws?.start_date ?? undefined,
    readoutDate: ws?.readout_date ?? undefined,
  };

  // ── Symptoms ─────────────────────────────────────────────────────────────
  const symptoms: SymptomSection = {
    selectedClusters: (intake?.symptom_clusters as string[] | null) ?? [],
    oneSentenceProblem: intake?.recurring_fire_sentence ?? "",
  };

  // ── Pain ratings (snake_case DB keys → camelCase interface keys) ──────────
  const pr = (intake?.pain_ratings as Record<string, number> | null) ?? {};
  const painRatings: PainRatingsSection = {
    salesToOps:                pr["sales_to_ops_handoff"]        ?? 0,
    estimatingScopeQuality:    pr["estimating_scope_quality"]    ?? 0,
    schedulingCapacity:        pr["scheduling_capacity"]         ?? 0,
    deliveryExecution:         pr["delivery_execution"]          ?? 0,
    changeOrders:              pr["change_orders"]               ?? 0,
    jobCostingVisibility:      pr["job_costing_visibility"]      ?? 0,
    billingCollections:        pr["billing_collections"]         ?? 0,
    roleClarityAccountability: pr["role_clarity_accountability"] ?? 0,
    meetingsCadence:           pr["cadence_meetings"]            ?? 0,
    customerCommunication:     pr["customer_comms"]              ?? 0,
  };

  // ── TOC ───────────────────────────────────────────────────────────────────
  const toc: TocSection = {
    whereWorkWaitsLongest:  intake?.toc_wait_points       ?? "",
    stepWithMostReplanning: intake?.toc_replanning_points ?? "",
    downstreamFiresIfFixed: intake?.toc_one_fix_effect    ?? "",
  };

  // ── Decisions, Tools, Metrics ─────────────────────────────────────────────
  const rawTools = (intake?.tools_list as unknown[] | null) ?? [];
  const tools: ToolEntry[] = rawTools.map((entry) => {
    if (typeof entry === "string") return { name: entry };
    const t = entry as Record<string, unknown>;
    return {
      name: String(t["name"] ?? ""),
      purpose: t["purpose"] ? String(t["purpose"]) : undefined,
    };
  });

  const decisionsToolsMetrics: DecisionsToolsMetricsSection = {
    decisionBottlenecks: intake?.decisions_bottleneck   ?? "",
    currentMetrics:      intake?.metrics_tracked_today  ?? "",
    tools,
  };

  return { kickoff, symptoms, painRatings, toc, decisionsToolsMetrics };
}
