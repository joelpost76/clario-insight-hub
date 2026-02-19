import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Loader2,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import type {
  StructuredIntakeData,
  ConstraintAnalysis,
  ConstraintPageState,
} from "@/types/clarioConstraintTypes";

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_INTAKE_DATA: StructuredIntakeData = {
  kickoff: {
    outcomes90Day: [
      { id: "1", label: "Billing cycle time under 5 days" },
      { id: "2", label: "Change order capture rate above 85%" },
    ],
    workflowsInScope: ["CHANGE_ORDERS", "BILLING_TO_COLLECTIONS", "SALE_TO_JOB_SETUP_TO_SCHEDULING"],
    teamsInScope: ["Sales", "PMs", "Finance"],
    constraintsNonNegotiables: ["Cannot disrupt active jobs", "No new software until Q3"],
    startDate: "2025-01-15",
    readoutDate: "2025-04-15",
  },
  symptoms: {
    selectedClusters: [
      "Change orders not captured in time",
      "Billing delays after job completion",
      "Scheduling conflicts and last-minute changes",
    ],
    oneSentenceProblem:
      "Jobs complete but billing is delayed 2–3 weeks, and change orders aren't being captured consistently, which is eroding margin.",
  },
  painRatings: {
    salesToOps: 7,
    estimatingScopeQuality: 6,
    schedulingCapacity: 8,
    deliveryExecution: 5,
    changeOrders: 9,
    jobCostingVisibility: 8,
    billingCollections: 9,
    roleClarityAccountability: 6,
    meetingsCadence: 4,
    customerCommunication: 5,
  },
  toc: {
    whereWorkWaitsLongest:
      "Work queues up at the PM-to-finance handoff after job closeout — PMs don't signal completion, so billing doesn't start.",
    stepWithMostReplanning:
      "Scheduling gets rewritten 2–3x per week due to material delays and crew availability, pulling PMs away from closeout tasks.",
    downstreamFiresIfFixed:
      "If closeout handoff was clean, billing would start within 1 day, AR aging would drop, and PMs would have fewer follow-up calls.",
  },
  decisionsToolsMetrics: {
    decisionBottlenecks:
      "PMs decide when a job is 'done' but have no standard checklist — finance waits on informal signals (texts, calls).",
    tools: [
      { name: "Buildertrend", purpose: "Project management and scheduling" },
      { name: "QuickBooks", purpose: "Accounting and invoicing" },
      { name: "Excel", purpose: "Change order tracking" },
    ],
    currentMetrics: "Tracking revenue and job count. No consistent tracking of billing cycle time, CO capture rate, or WIP age.",
  },
};

const MOCK_ANALYSIS: ConstraintAnalysis = {
  primaryConstraint:
    "The PM-to-Finance closeout handoff is the binding constraint — informal, inconsistency-driven, and blocking billing for 2–3 weeks after job completion.",
  constraintType: "Handoff / Process Gap",
  upstreamCauses: [
    "No standardized definition of job 'done' across PMs",
    "Scheduling rework consumes PM bandwidth needed for closeout",
    "Change orders tracked in Excel outside the PM tool (Buildertrend), creating data gaps",
  ],
  downstreamEffects: [
    "Billing cycle time of 2–3 weeks post-completion → cash flow strain",
    "AR aging increases as invoices go out late",
    "Change order revenue leaks because informal CO tracking gets lost in closeout rush",
    "Finance team spends time chasing PMs instead of processing invoices",
  ],
  supportingSignals: [
    {
      source: "PAIN_RATINGS",
      fieldKey: "changeOrders",
      description: "Change Orders rated 9/10 pain — highest single signal in the dataset",
    },
    {
      source: "PAIN_RATINGS",
      fieldKey: "billingCollections",
      description: "Billing & Collections rated 9/10 — confirms billing delay is acute",
    },
    {
      source: "PAIN_RATINGS",
      fieldKey: "jobCostingVisibility",
      description: "Job costing visibility rated 8/10 — PMs and finance lack shared data view",
    },
    {
      source: "TOC",
      fieldKey: "whereWorkWaitsLongest",
      description: "PM-to-finance closeout handoff explicitly named as primary wait point",
    },
    {
      source: "TOC",
      fieldKey: "downstreamFiresIfFixed",
      description:
        "Client identified billing speed and AR aging as top downstream beneficiaries of fixing closeout",
    },
    {
      source: "SYMPTOMS",
      fieldKey: "selectedClusters",
      description: "Change order capture and billing delays are both in top symptom clusters",
    },
    {
      source: "DECISIONS",
      fieldKey: "decisionBottlenecks",
      description:
        "No standard closeout checklist — PM signals job completion informally (texts/calls)",
    },
    {
      source: "TOOLS",
      fieldKey: "tools",
      description:
        "CO tracking in Excel outside Buildertrend creates data loss risk at the handoff moment",
    },
  ],
  suggestedDiagnosticModules: [
    "Workflow Map – PM Closeout to Finance Trigger",
    "SIPOC – Billing & Collections Process",
    "Scope Creep / Change Order Analyzer",
    "Interviews – PM × Finance Handoff Friction",
  ],
  aiConfidence: "HIGH",
  inferredDataQuality: "MEDIUM",
  notesForConsultant:
    "Data quality is MEDIUM — pain ratings are strong signals but TOC answers are brief. Recommend 30-min PM interview to confirm closeout sequence before locking the constraint. The Excel-based CO tracking is a quick win: consolidating into Buildertrend would reduce data loss independent of the handoff fix.",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: "LOW" | "MEDIUM" | "HIGH" }) {
  const map = {
    HIGH: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
    LOW: "bg-destructive/10 text-destructive border-destructive/20",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[level]}`}
    >
      {level}
    </span>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  SYMPTOMS: "Symptoms",
  PAIN_RATINGS: "Pain Ratings",
  TOC: "TOC",
  DECISIONS: "Decisions",
  TOOLS: "Tools",
  METRICS: "Metrics",
  KICKOFF: "Kickoff",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Constraint() {
  const navigate = useNavigate();
  const { workspaceId } = useWorkspace();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [structuredData, setStructuredData] = useState<StructuredIntakeData | null>(null);
  const [pageState, setPageState] = useState<ConstraintPageState>({
    aiAnalysis: undefined,
    consultantEdits: undefined,
  });

  const [finalConstraint, setFinalConstraint] = useState("");
  const [finalNotes, setFinalNotes] = useState("");
  const [accepted, setAccepted] = useState(false);

  const analysis = pageState.aiAnalysis;

  // ── Run analysis (mock) ──────────────────────────────────────────────────
  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: replace with real buildStructuredIntakeDataForClient + runConstraintAnalysis
      await new Promise((r) => setTimeout(r, 1800)); // simulate network latency
      setStructuredData(MOCK_INTAKE_DATA);
      setPageState((prev) => ({ ...prev, aiAnalysis: MOCK_ANALYSIS }));
      setFinalConstraint(MOCK_ANALYSIS.primaryConstraint);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Accept constraint ────────────────────────────────────────────────────
  const handleAccept = () => {
    if (!finalConstraint.trim()) {
      toast({
        title: "Constraint required",
        description: "Enter or confirm the constraint before accepting.",
        variant: "destructive",
      });
      return;
    }
    setPageState((prev) => ({
      ...prev,
      consultantEdits: {
        finalConstraint: finalConstraint.trim(),
        finalNotes: finalNotes.trim() || undefined,
        acceptedAt: new Date().toISOString(),
      },
    }));
    setAccepted(true);
    toast({ title: "Constraint locked", description: "Your working constraint has been saved." });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Constraint Analysis</h1>
            <p className="mt-1 text-muted-foreground">
              AI-proposed working constraint based on Kickoff + Intake data.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/intake")}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Intake
          </Button>
        </div>

        {/* Empty state */}
        {!analysis && !loading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Brain className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-medium">Run Constraint Analysis</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reads Kickoff + Intake data and proposes the single constraint most likely to unlock
                  downstream improvement.
                </p>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <Button onClick={handleRunAnalysis} disabled={loading} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analysing Kickoff + Intake signals…
              </p>
            </CardContent>
          </Card>
        )}

        {/* Analysis results */}
        {analysis && !loading && (
          <div className="space-y-4">
            {/* Primary constraint */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Primary Constraint</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">AI Confidence</span>
                    <ConfidenceBadge level={analysis.aiConfidence} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium leading-relaxed">{analysis.primaryConstraint}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{analysis.constraintType}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Data quality: <ConfidenceBadge level={analysis.inferredDataQuality} />
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Upstream causes + downstream effects */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                    Upstream Causes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.upstreamCauses.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                    Downstream Effects (if fixed)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.downstreamEffects.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Supporting signals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Supporting Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.supportingSignals.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-md border border-border bg-muted/40 px-3 py-2"
                    >
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {SOURCE_LABELS[s.source] ?? s.source}
                      </Badge>
                      <div>
                        <p className="text-xs font-mono text-muted-foreground">{s.fieldKey}</p>
                        <p className="text-sm">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Suggested modules */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Suggested Diagnostic Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {analysis.suggestedDiagnosticModules.map((m, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="h-3.5 w-3.5 text-primary" />
                      {m}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Consultant notes */}
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <CardTitle className="text-sm text-amber-800 dark:text-amber-300">Notes for Consultant</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-900 dark:text-amber-200">{analysis.notesForConsultant}</p>
              </CardContent>
            </Card>

            <Separator />

            {/* Consultant override / accept */}
            {!accepted ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Lock Working Constraint</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Edit the AI proposal if needed, then accept to lock it as the working constraint
                    for this engagement.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="finalConstraint">Final Constraint Statement</Label>
                    <Textarea
                      id="finalConstraint"
                      rows={3}
                      value={finalConstraint}
                      onChange={(e) => setFinalConstraint(e.target.value)}
                      placeholder="One clear sentence describing the binding constraint…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="finalNotes">Consultant Notes (optional)</Label>
                    <Textarea
                      id="finalNotes"
                      rows={3}
                      value={finalNotes}
                      onChange={(e) => setFinalNotes(e.target.value)}
                      placeholder="Any additional context, caveats, or next steps…"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRunAnalysis}
                      disabled={loading}
                      className="gap-1"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Re-run Analysis
                    </Button>
                    <Button onClick={handleAccept} className="gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Accept Constraint
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30">
                <CardContent className="flex items-start gap-3 py-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">Constraint locked</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">
                      {pageState.consultantEdits?.finalConstraint}
                    </p>
                    {pageState.consultantEdits?.finalNotes && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 italic">
                        {pageState.consultantEdits.finalNotes}
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 px-2 text-xs text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
                      onClick={() => setAccepted(false)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-end border-t border-border pt-4">
              <Button onClick={() => navigate("/artifacts")} className="gap-2">
                Next: Artifacts
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
