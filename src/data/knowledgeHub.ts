// ─── Knowledge Hub Registry ──────────────────────────────────────────────────
// Single source of truth for how every Clario module works.
// When a feature is added or modified, update the corresponding entry here.
// This file powers the Admin → Knowledge Hub tab.

export type KnowledgeCategory =
  | "Diagnostic Step"
  | "Tool"
  | "AI Engine"
  | "Admin"
  | "Add-On Module";

export interface DataSource {
  type: "database_table" | "edge_function" | "external_api" | "local_calculation" | "context";
  name: string;
  purpose: string;
}

export interface KnowledgeEntry {
  id: string;
  moduleName: string;
  category: KnowledgeCategory;
  description: string;
  howItWorks: string;
  calculationMethodology?: string;
  dataSources: DataSource[];
  limitations?: string;
  lastUpdated: string; // ISO date
}

export const knowledgeHubEntries: KnowledgeEntry[] = [
  // ─── Diagnostic Steps ────────────────────────────────────────────────────────

  {
    id: "kickoff",
    moduleName: "Kickoff",
    category: "Diagnostic Step",
    description:
      "The kickoff step captures the engagement scope: 90-day outcomes, workflows in scope, teams in scope, constraints/non-negotiables, start date, and readout date. This data frames every subsequent analysis.",
    howItWorks:
      "The consultant fills in a structured form on the Kickoff page. Responses are saved to the `workspaces` table — specifically the columns `outcomes_90_day`, `scope_workflows`, `scope_teams`, `constraints_nonnegotiables`, `start_date`, and `readout_date`. These fields are read downstream by the Constraint Analysis AI and the Readout builder.",
    dataSources: [
      { type: "database_table", name: "workspaces", purpose: "Stores all kickoff scope fields (outcomes, workflows, teams, constraints, dates)" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "intake",
    moduleName: "Intake",
    category: "Diagnostic Step",
    description:
      "Intake collects the client's operational symptoms, pain severity across 10 dimensions, Theory of Constraints (TOC) open-text questions, decision bottlenecks, tools in use, and current metrics. This is the primary data feed for the AI Constraint Analysis.",
    howItWorks:
      "A four-step wizard guides the consultant through symptom cluster selection, pain-rating sliders (0–10), TOC narrative questions, and a tools/metrics inventory. Each step auto-saves to the `intake_responses` table (one row per workspace, upserted on change). The four steps are:\n\n1. **Symptom Clusters** — multi-select chips + a one-sentence problem summary.\n2. **Pain Ratings** — 10 numeric sliders (salesToOps, estimatingScopeQuality, schedulingCapacity, deliveryExecution, changeOrders, jobCostingVisibility, billingCollections, roleClarityAccountability, meetingsCadence, customerCommunication).\n3. **TOC Questions** — three free-text fields: where work waits longest, which step gets the most re-planning, what fires would stop if one thing were fixed.\n4. **Decisions, Tools & Metrics** — decision bottleneck free-text, tool list (name + purpose pairs), and current metrics free-text.",
    dataSources: [
      { type: "database_table", name: "intake_responses", purpose: "Stores symptom clusters, pain ratings (JSON), TOC answers, tools list, decision bottlenecks, and current metrics" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "constraint-analysis",
    moduleName: "Constraint Analysis",
    category: "AI Engine",
    description:
      "The core AI diagnostic. It reads all kickoff and intake data, sends it to a large language model with a domain-specific system prompt, and returns a structured hypothesis identifying the single biggest operational constraint.",
    howItWorks:
      "1. **Data aggregation** — The frontend assembles a `StructuredIntakeData` JSON payload from the `workspaces` table (kickoff fields) and the `intake_responses` table (symptoms, pain sliders, TOC answers, tools, metrics).\n\n2. **Edge function call** — The payload is sent to the `analyze-constraint` edge function.\n\n3. **AI processing** — The edge function forwards the data to Gemini Flash (google/gemini-3-flash-preview) via the Lovable AI gateway. A ~200-line system prompt encodes domain-specific pattern recognition rules for design-build operations. The prompt enforces voice rules (calm, system-focused, no blame), constraint statement style, and a strict JSON output schema.\n\n4. **Output** — The AI returns a `ConstraintAnalysis` JSON object containing: `primaryConstraint` (1–3 sentences), `constraintType` (short label), `secondaryConstraints` (0–2 reinforcing pressures), `upstreamCauses`, `downstreamEffects`, `supportingSignals` (with source attribution), `suggestedDiagnosticModules`, `aiConfidence`, `inferredDataQuality`, and `notesForConsultant`.\n\n5. **Storage** — The analysis is stored in `workspaces.constraint_state` as JSON. Consultant edits are layered on top via a `consultantEdits` sub-object, preserving the original AI output.\n\n6. **No learning loop** — Each analysis is independent. The model does not retain memory between sessions. Improving output quality requires editing the system prompt in the edge function.",
    calculationMethodology:
      "There is no numeric formula. The AI performs qualitative pattern matching across the intake signals. It identifies which pain ratings are elevated, cross-references with TOC narrative answers and symptom cluster selections, and applies the domain rules encoded in the system prompt to name the most likely constraint. Confidence is assessed as LOW / MEDIUM / HIGH based on the specificity and internal consistency of the input data.",
    dataSources: [
      { type: "database_table", name: "workspaces", purpose: "Reads kickoff scope fields (outcomes, workflows, teams, constraints)" },
      { type: "database_table", name: "intake_responses", purpose: "Reads symptom clusters, pain ratings, TOC answers, tools, metrics" },
      { type: "edge_function", name: "analyze-constraint", purpose: "Sends structured data to Gemini Flash and returns the ConstraintAnalysis JSON" },
      { type: "external_api", name: "Lovable AI Gateway (Gemini Flash)", purpose: "LLM inference — google/gemini-3-flash-preview via ai.gateway.lovable.dev" },
    ],
    limitations:
      "Single-pass inference with no feedback loop. Quality depends on the completeness and specificity of the intake responses. The AI may hallucinate if intake data is sparse — the `inferredDataQuality` flag helps surface this. The system prompt must be manually updated when domain logic changes.",
    lastUpdated: "2025-06-01",
  },

  {
    id: "flow-stabilization",
    moduleName: "Flow Stabilization",
    category: "Diagnostic Step",
    description:
      "Captures structured responses about release criteria, capacity visibility, change order flow, and meeting control. These responses are analyzed by an AI agent that produces a 30-day stabilization plan.",
    howItWorks:
      "The consultant answers a multi-section questionnaire covering four operational areas:\n\n1. **Release Criteria** — What conditions must be met before work enters production.\n2. **Capacity Visibility** — How the team sees and manages workload.\n3. **Change Order Flow** — How scope changes are priced, approved, and scheduled.\n4. **Meeting Control** — How meetings drive (or fail to drive) decisions.\n\nResponses are saved to `flow_stabilization_state.responses` (JSON). When the consultant triggers analysis, the responses are sent to the `analyze-flow-stabilization` edge function, which uses Gemini Flash to produce a `flowRiskSummary`, `readinessGap`, `stabilizationMoves` (3–5 concrete actions), `firstDesignMove`, and `confidence` level. The analysis is stored in `flow_stabilization_state.analysis`.",
    calculationMethodology:
      "AI-driven qualitative analysis. The system prompt enforces provisional framing ('The signals suggest...') and requires concrete, 30-day-implementable actions. No numeric scoring — output is structured narrative.",
    dataSources: [
      { type: "database_table", name: "flow_stabilization_state", purpose: "Stores questionnaire responses (JSON) and AI analysis (JSON)" },
      { type: "edge_function", name: "analyze-flow-stabilization", purpose: "Sends responses to Gemini Flash, returns stabilization plan JSON" },
      { type: "external_api", name: "Lovable AI Gateway (Gemini Flash)", purpose: "LLM inference — google/gemini-3-flash-preview" },
    ],
    limitations:
      "Same single-pass architecture as Constraint Analysis. No learning. Quality depends on response specificity.",
    lastUpdated: "2025-06-01",
  },

  {
    id: "scope-discipline",
    moduleName: "Scope & Change Discipline",
    category: "Diagnostic Step",
    description:
      "Evaluates estimating integrity and change order discipline. The AI agent identifies margin leakage mechanisms, change control risk patterns, and produces 3–5 concrete discipline actions.",
    howItWorks:
      "The consultant answers structured questions about estimating accuracy, change order capture rates, approval workflows, and pricing discipline. Responses are saved to `scope_discipline_state.responses`. The `analyze-scope-discipline` edge function sends these to Gemini Flash with a domain-specific prompt that produces: `scopeIntegritySummary`, `marginLeakageMechanism`, `changeControlRiskPattern`, `disciplineMoves` (3–5 actions), `controlUpgrade` (single highest-leverage change), and `confidence`.",
    calculationMethodology:
      "AI-driven qualitative analysis focused on estimate-to-actual drift and change latency. The prompt enforces system-focused language and requires actions that name the specific system they change.",
    dataSources: [
      { type: "database_table", name: "scope_discipline_state", purpose: "Stores questionnaire responses (JSON) and AI analysis (JSON)" },
      { type: "edge_function", name: "analyze-scope-discipline", purpose: "Sends responses to Gemini Flash, returns discipline analysis JSON" },
      { type: "external_api", name: "Lovable AI Gateway (Gemini Flash)", purpose: "LLM inference — google/gemini-3-flash-preview" },
    ],
    limitations:
      "Single-pass. No learning. Slightly firmer tone than Flow Stabilization per prompt design.",
    lastUpdated: "2025-06-01",
  },

  {
    id: "artifacts",
    moduleName: "Artifacts",
    category: "Tool",
    description:
      "A simple document/link repository. Consultants can attach files, links, and notes to a workspace with type tags for easy categorization during the engagement.",
    howItWorks:
      "CRUD interface for adding artifacts (title, type, link/file path, notes, tags). Each artifact is stored as a row in the `artifacts` table, linked to the current workspace. Tags are stored as a text array for filtering. No AI processing is involved.",
    dataSources: [
      { type: "database_table", name: "artifacts", purpose: "Stores artifact records (title, type, link_or_file, notes, tags) per workspace" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "interviews",
    moduleName: "Interviews",
    category: "Tool",
    description:
      "Tracks stakeholder interviews: who was interviewed, their role, scheduling status, raw notes, and emergent themes. Provides a structured view of qualitative data collection.",
    howItWorks:
      "Consultants add interview records with interviewee name, role, email, scheduled date, status (scheduled/completed/cancelled), free-text notes, and theme tags. All data is stored in the `interviews` table. No AI processing — themes are consultant-assigned.",
    dataSources: [
      { type: "database_table", name: "interviews", purpose: "Stores interview records (interviewee, role, notes, themes, status) per workspace" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "team-survey",
    moduleName: "Team Survey",
    category: "Tool",
    description:
      "Manages a team-wide pulse survey. Tracks distribution (share link), response count, aggregate scores, burnout risk average, and emergent themes.",
    howItWorks:
      "A survey record is created per workspace in the `surveys` table. The share link is distributed to team members. Response aggregates (JSON), response count, burnout risk average, and theme arrays are stored on the survey row. The survey data feeds into the Synthesis and Readout steps.",
    dataSources: [
      { type: "database_table", name: "surveys", purpose: "Stores survey metadata, aggregates, burnout risk, and themes per workspace" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "sipoc",
    moduleName: "SIPOC",
    category: "Tool",
    description:
      "Captures Suppliers–Inputs–Process–Outputs–Customers maps for each workflow in scope. A classic process analysis tool rendered as editable lists.",
    howItWorks:
      "Consultants create one or more SIPOC entries per workspace. Each entry names a workflow and provides five text arrays: suppliers, inputs, process steps, outputs, and customers. Stored in the `sipocs` table. No AI processing.",
    dataSources: [
      { type: "database_table", name: "sipocs", purpose: "Stores SIPOC entries (workflow name, S/I/P/O/C arrays) per workspace" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "workflow-mapping",
    moduleName: "Workflow Mapping",
    category: "Tool",
    description:
      "Documents workflow steps, handoffs between roles, queues (wait states), and rework loops. Surfaces where work stalls or cycles back.",
    howItWorks:
      "Consultants create workflow map entries with a workflow name, and JSON fields for steps, handoffs, queues, and rework loops. Stored in the `workflow_maps` table. This is a data capture tool — no automated analysis is performed.",
    dataSources: [
      { type: "database_table", name: "workflow_maps", purpose: "Stores workflow maps (steps, handoffs, queues, rework loops as JSON) per workspace" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "flow-baseline",
    moduleName: "Flow Baseline",
    category: "Tool",
    description:
      "Captures quantitative operational metrics: lead time, throughput, WIP count, rework rate, billing cycle, and AR aging buckets. Provides a numeric snapshot of current operational health.",
    howItWorks:
      "The consultant enters numeric values into a form. Fields include: `lead_time_days`, `throughput_per_week`, `wip_count`, `rework_rate`, `billing_cycle_days`, `ar_aging_30`, `ar_aging_60`, `ar_aging_90`, and `confidence_level`. Data is stored in `flow_baselines` (one row per workspace). These numbers feed into the Synthesis and Readout phases for before/after comparison.",
    dataSources: [
      { type: "database_table", name: "flow_baselines", purpose: "Stores baseline metrics (lead time, throughput, WIP, rework, billing, AR aging) per workspace" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "synthesis",
    moduleName: "Synthesis",
    category: "Diagnostic Step",
    description:
      "The synthesis phase aggregates findings from all diagnostic steps into a unified narrative. It pulls constraint analysis results, flow data, scope discipline findings, survey themes, and baseline metrics into a single consultative view.",
    howItWorks:
      "The Synthesis page reads from multiple tables: `workspaces` (constraint state, kickoff data), `flow_stabilization_state`, `scope_discipline_state`, `flow_baselines`, `surveys`, `findings`, and `interviews`. It presents this data in a structured layout that helps the consultant identify patterns and prepare for the readout. Currently a manual synthesis step — no AI summarization.",
    dataSources: [
      { type: "database_table", name: "workspaces", purpose: "Constraint state, kickoff scope" },
      { type: "database_table", name: "flow_stabilization_state", purpose: "Flow analysis results" },
      { type: "database_table", name: "scope_discipline_state", purpose: "Scope discipline analysis" },
      { type: "database_table", name: "flow_baselines", purpose: "Quantitative baseline metrics" },
      { type: "database_table", name: "surveys", purpose: "Survey aggregates and themes" },
      { type: "database_table", name: "findings", purpose: "Consultant-authored findings" },
      { type: "database_table", name: "interviews", purpose: "Interview notes and themes" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "readout",
    moduleName: "Readout",
    category: "Diagnostic Step",
    description:
      "The final deliverable of a Clario diagnostic engagement. Presents findings, recommendations, and baseline data in a format suitable for client presentation.",
    howItWorks:
      "Reads the same data sources as Synthesis and renders them in a presentation-ready layout. The readout date is set during kickoff (`workspaces.readout_date`). Content is assembled from constraint analysis, flow stabilization analysis, scope discipline analysis, survey results, and consultant-authored findings.",
    dataSources: [
      { type: "database_table", name: "workspaces", purpose: "Readout date, constraint state, kickoff scope" },
      { type: "database_table", name: "findings", purpose: "Constraint statements and consultant notes" },
      { type: "database_table", name: "flow_stabilization_state", purpose: "Stabilization plan" },
      { type: "database_table", name: "scope_discipline_state", purpose: "Discipline recommendations" },
      { type: "database_table", name: "flow_baselines", purpose: "Before-state metrics" },
    ],
    lastUpdated: "2025-06-01",
  },

  // ─── Add-On Modules ─────────────────────────────────────────────────────────

  {
    id: "rpe-health-check",
    moduleName: "RPE Health Check",
    category: "Add-On Module",
    description:
      "Revenue Per Employee (RPE) calculator and benchmarking tool. Accepts revenue, headcount, and optional staffing breakdowns, then computes RPE metrics and compares them against revenue-tiered industry benchmarks.",
    howItWorks:
      "1. **Inputs** — Revenue, field FTE, non-field FTE, backlog ($), average contract value, PM/designer/sales counts.\n\n2. **Calculation (v1 engine)** — All formulas are deterministic (no AI):\n   • `totalFTE = fieldFTE + nonFieldFTE`\n   • `totalRPE = revenue / totalFTE`\n   • `fieldRPE = revenue / fieldFTE`\n   • `nonFieldRPE = revenue / nonFieldFTE`\n   • `jobsPerYear = revenue / averageContractValue`\n   • `impliedWIP = (jobsPerYear / 52) × 12` (default 12-week job duration)\n   • `backlogMonths = backlog / (revenue / 12)`\n   • `jobsPerPM/Designer/Sales = jobsPerYear / count`\n\n3. **Benchmarking** — Revenue is mapped to a tier (Emerging <$2M, Growth $2–5M, Established $5–10M, Enterprise $10M+). Each tier has threshold bands: Critical → Caution → Average → Good → Strong. The total RPE is compared against the tier's thresholds.\n\n4. **Versioning** — Calculations are versioned (`rpe_v1`). The version is stored on each snapshot so historical data can be replayed with the original formulas.\n\n5. **Persistence** — Input state is saved to `rpe_health_check_state`. Computed snapshots are saved to `rpe_assessments` with all derived metrics and the calculation version.",
    calculationMethodology:
      "Pure arithmetic. No AI. Formulas:\n• Total RPE = Revenue ÷ (Field FTE + Non-Field FTE)\n• Field RPE = Revenue ÷ Field FTE\n• Non-Field RPE = Revenue ÷ Non-Field FTE\n• Jobs/Year = Revenue ÷ Avg Contract Value\n• Implied WIP = (Jobs/Year ÷ 52) × Job Duration Weeks (default 12)\n• Backlog Months = Backlog $ ÷ (Revenue ÷ 12)\n\nBenchmark thresholds per tier:\n• Emerging: Critical <$80K, Caution <$120K, Average <$170K, Good <$230K, Strong ≥$230K\n• Growth: Critical <$100K, Caution <$150K, Average <$200K, Good <$280K, Strong ≥$280K\n• Established: Critical <$120K, Caution <$170K, Average <$220K, Good <$300K, Strong ≥$300K\n• Enterprise: Critical <$140K, Caution <$190K, Average <$250K, Good <$330K, Strong ≥$330K",
    dataSources: [
      { type: "database_table", name: "rpe_health_check_state", purpose: "Persists current form inputs (JSON) per workspace" },
      { type: "database_table", name: "rpe_assessments", purpose: "Stores computed RPE snapshots with all derived metrics and calculation version" },
      { type: "local_calculation", name: "rpeCalculations.ts", purpose: "All RPE formulas — deterministic, no external API" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "scope-creep-assessment",
    moduleName: "Scope Creep Assessment",
    category: "Add-On Module",
    description:
      "Analyzes historical job data to quantify scope creep impact: estimate accuracy, change order capture rates, margin leakage, and constraint scoring. Supports CSV import of job-level data.",
    howItWorks:
      "1. **Data import** — The consultant uploads a CSV of historical jobs. The system maps CSV columns to required fields (job name, contract value, estimated/actual cost, COs issued/signed, CO values).\n\n2. **Column mapping** — Raw CSV headers and the chosen mapping are stored in `scope_creep_column_map`.\n\n3. **Job storage** — Parsed job rows are stored in `scope_creep_jobs` (linked to an assessment).\n\n4. **Calculations** — Per-job metrics: estimate accuracy (estimated vs actual cost), CO capture rate (COs signed vs issued), margin on each job. Portfolio-level: average estimate accuracy, overall CO capture rate, total margin leakage, constraint score.\n\n5. **Assessment record** — Summary metrics are stored in `scope_creep_assessments` (linked to a client and workspace).",
    calculationMethodology:
      "Deterministic calculations:\n• Estimate Accuracy = Estimated Cost ÷ Actual Cost (per job)\n• CO Capture Rate = COs Signed ÷ COs Issued (per job)\n• Margin Leakage = Σ (Actual Cost − Estimated Cost) for jobs where actual > estimated\n• Constraint Score = weighted composite of estimate accuracy and CO capture rate\n\nAll calculations happen client-side. No AI involvement.",
    dataSources: [
      { type: "database_table", name: "scope_creep_assessments", purpose: "Assessment metadata, summary scores, and impact model (JSON)" },
      { type: "database_table", name: "scope_creep_jobs", purpose: "Individual job records with cost, CO, and date data" },
      { type: "database_table", name: "scope_creep_column_map", purpose: "CSV column mapping for data import" },
      { type: "database_table", name: "clients", purpose: "Client record linked to each assessment" },
    ],
    lastUpdated: "2025-06-01",
  },

  // ─── Infrastructure ─────────────────────────────────────────────────────────

  {
    id: "ai-engine",
    moduleName: "AI Engine Architecture",
    category: "AI Engine",
    description:
      "Documents the shared AI infrastructure used by all AI-powered diagnostic steps (Constraint Analysis, Flow Stabilization, Scope & Change Discipline).",
    howItWorks:
      "**Model**: Google Gemini 3 Flash Preview (`google/gemini-3-flash-preview`) accessed via the Lovable AI gateway (`ai.gateway.lovable.dev`).\n\n**Architecture**: Single-pass prompt. Each edge function contains a self-contained system prompt (~100–200 lines) that encodes domain rules, voice/tone constraints, output schema, and example patterns. The user message is the serialized intake/questionnaire data.\n\n**Authentication**: Each edge function reads `LOVABLE_API_KEY` from environment secrets. This key authenticates with the Lovable AI gateway.\n\n**Error handling**: All edge functions handle 429 (rate limit) and 402 (payment required) responses from the gateway. JSON parsing failures and missing required fields in the AI response are caught and surfaced as user-friendly errors.\n\n**No learning loop**: The model does not retain memory between requests. Each call is stateless. Improving output quality requires modifying the system prompt in the edge function source code.\n\n**No fine-tuning**: The model is used as-is from the Lovable AI gateway. There is no custom training or fine-tuning layer.",
    dataSources: [
      { type: "external_api", name: "Lovable AI Gateway", purpose: "Proxies requests to Google Gemini Flash — endpoint: ai.gateway.lovable.dev/v1/chat/completions" },
      { type: "context", name: "LOVABLE_API_KEY", purpose: "Environment secret used to authenticate with the AI gateway" },
    ],
    limitations:
      "No conversation memory. No fine-tuning. No feedback loop. Each request is independent. Output quality is entirely governed by the system prompt and the quality/completeness of the input data. Rate limits and credit limits apply via the Lovable AI gateway.",
    lastUpdated: "2025-06-01",
  },

  {
    id: "edge-functions-catalog",
    moduleName: "Edge Functions Catalog",
    category: "Admin",
    description:
      "Documents all backend edge functions deployed in the system, their purpose, authentication requirements, and which features depend on them.",
    howItWorks:
      "**analyze-constraint** — AI constraint analysis. Receives `StructuredIntakeData`, returns `ConstraintAnalysis` JSON. No JWT required. Uses LOVABLE_API_KEY.\n\n**analyze-flow-stabilization** — AI flow stabilization analysis. Receives questionnaire responses, returns stabilization plan JSON. No JWT required. Uses LOVABLE_API_KEY.\n\n**analyze-scope-discipline** — AI scope discipline analysis. Receives questionnaire responses, returns discipline analysis JSON. No JWT required. Uses LOVABLE_API_KEY.\n\n**create-workspace-from-lead** — Converts an accepted sales lead into an account + workspace + membership. No JWT required. Uses SUPABASE_SERVICE_ROLE_KEY.\n\n**invite-user** — Sends workspace invitations via email. Creates invitation records and optionally adds existing users directly. No JWT required. Uses SUPABASE_SERVICE_ROLE_KEY.\n\n**lookup-user-by-email** — Finds existing users by email address for workspace membership management. No JWT required. Uses SUPABASE_SERVICE_ROLE_KEY.\n\n**process-pending-invitations** — On user login, checks for pending invitations matching the user's email and auto-accepts them (adds to workspace, assigns role). Requires JWT (authorization header). Uses SUPABASE_SERVICE_ROLE_KEY.",
    dataSources: [
      { type: "edge_function", name: "analyze-constraint", purpose: "AI-powered constraint analysis" },
      { type: "edge_function", name: "analyze-flow-stabilization", purpose: "AI-powered flow stabilization planning" },
      { type: "edge_function", name: "analyze-scope-discipline", purpose: "AI-powered scope discipline analysis" },
      { type: "edge_function", name: "create-workspace-from-lead", purpose: "Lead → Account + Workspace provisioning" },
      { type: "edge_function", name: "invite-user", purpose: "Workspace invitation system" },
      { type: "edge_function", name: "lookup-user-by-email", purpose: "User lookup for membership management" },
      { type: "edge_function", name: "process-pending-invitations", purpose: "Auto-accept pending invitations on login" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "workspace-management",
    moduleName: "Workspace & Account Management",
    category: "Admin",
    description:
      "Admin-only interface for creating and managing accounts, workspaces, user memberships, roles, and invitations. Restricted to `unburnt_admin` role.",
    howItWorks:
      "The Admin Dashboard provides three tabs:\n\n1. **Accounts** — CRUD for client accounts (name, industry). Stored in `accounts` table.\n\n2. **Workspaces** — Create workspaces linked to accounts. Each workspace represents a Clario diagnostic engagement. Stored in `workspaces` table with `account_id` FK.\n\n3. **Members** — Add users to workspaces via email lookup or invitation. Manage roles (client_user, client_admin, unburnt_admin) via the `user_roles` table. Invitations are tracked in the `invitations` table with status (pending/accepted) and can be resent or cancelled.\n\nAccess control: The `/admin` route is wrapped in `RequireAdmin`, which checks `userRole === 'unburnt_admin'` from the WorkspaceContext. Non-admin users are redirected to `/dashboard`.",
    dataSources: [
      { type: "database_table", name: "accounts", purpose: "Client account records" },
      { type: "database_table", name: "workspaces", purpose: "Engagement workspaces linked to accounts" },
      { type: "database_table", name: "workspace_members", purpose: "User-to-workspace membership mapping" },
      { type: "database_table", name: "user_roles", purpose: "Role assignments (client_user, client_admin, unburnt_admin)" },
      { type: "database_table", name: "invitations", purpose: "Pending/accepted workspace invitations" },
      { type: "database_table", name: "profiles", purpose: "User display names and avatars" },
      { type: "edge_function", name: "lookup-user-by-email", purpose: "Find existing users for direct membership add" },
      { type: "edge_function", name: "invite-user", purpose: "Send invitation emails for new users" },
    ],
    lastUpdated: "2025-06-01",
  },

  {
    id: "sales-lead-pipeline",
    moduleName: "Sales Lead Pipeline",
    category: "Admin",
    description:
      "Captures inbound sales leads from the public-facing service configuration page. Leads include company info, contact details, selected services, pain points, and urgency. Admins can review, qualify, and convert leads into workspaces.",
    howItWorks:
      "1. **Lead capture** — The public `/get-started` page collects company info, contact details, service selections, pain points, and urgency. Data is inserted into `sales_leads` with status 'new'.\n\n2. **Lead scoring** — A database function `calculate_lead_score` computes a numeric score based on lead attributes.\n\n3. **Admin review** — The Admin Leads page (`/admin/leads`) lists all leads with their status, score, and details. Admins can qualify leads (status → 'qualified'), accept them (status → 'accepted'), or reject them.\n\n4. **Workspace creation** — When a lead is accepted, the `create-workspace-from-lead` edge function provisions an account, workspace, and optional user invitation.",
    dataSources: [
      { type: "database_table", name: "sales_leads", purpose: "Stores lead records with company info, services, pain points, urgency, status" },
      { type: "database_table", name: "accounts", purpose: "Created when a lead is accepted" },
      { type: "database_table", name: "workspaces", purpose: "Created when a lead is accepted" },
      { type: "edge_function", name: "create-workspace-from-lead", purpose: "Provisions account + workspace from accepted lead" },
    ],
    lastUpdated: "2025-06-01",
  },
];
