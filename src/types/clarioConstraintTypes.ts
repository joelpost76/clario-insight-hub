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

// Helper stubs – implement real logic later

export async function buildStructuredIntakeDataForClient(
  clientId: string
): Promise<StructuredIntakeData> {
  // TODO: map existing Kickoff + Intake data for this client
  // into StructuredIntakeData.
  // For now, return a mocked object with the correct shape.
  throw new Error("buildStructuredIntakeDataForClient not implemented yet");
}

export async function runConstraintAnalysis(
  data: StructuredIntakeData
): Promise<ConstraintAnalysis> {
  // TODO: call LLM in a later step.
  // For now, this will be replaced with a mock or real implementation.
  throw new Error("runConstraintAnalysis not implemented yet");
}
