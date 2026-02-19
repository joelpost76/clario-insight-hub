import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Layers, Loader2, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import type {
  FlowStabilizationResponses,
  FlowStabilizationAnalysis,
} from "@/types/flowStabilizationTypes";

// ─── Required fields for validation ────────────────────────────────────────
const REQUIRED_FIELDS: { key: keyof FlowStabilizationResponses; label: string }[] = [
  { key: "releaseReadinessCriteria", label: "Release readiness criteria" },
  { key: "releaseAuthority",         label: "Release authority" },
  { key: "pmCapacityEstimate",       label: "PM capacity estimate" },
  { key: "changeOrderFlow",          label: "Scope change process" },
  { key: "scheduleControlMeeting",   label: "Schedule control meeting" },
];

// ─── Mock AI function (replace with real edge function later) ───────────────
async function runFlowStabilizationAnalysis(
  _responses: FlowStabilizationResponses
): Promise<FlowStabilizationAnalysis> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1800));

  return {
    flowRiskSummary:
      "Work is being released without a formal gate, causing downstream congestion and rework loops. Capacity is invisible, which forces PMs into reactive firefighting rather than planned execution.",
    readinessGap:
      "There is no documented release checklist or authority structure. Release decisions are being made ad hoc, often bypassing crew availability checks entirely.",
    stabilizationMoves: [
      "Define a 5-point release gate checklist (materials, permits, crew, scope lock, stakeholder sign-off) and make it mandatory before any job enters production.",
      "Establish a single named PM as the release authority for each job — no dual authorization ambiguity.",
      "Create a visible capacity board (physical or digital) showing each PM's active job count updated weekly.",
      "Institute a standing Monday operations meeting with a fixed agenda: releases due this week, capacity check, and open change orders.",
      "Set a 48-hour SLA between scope-change approval and field execution — flag any breach in the weekly ops meeting.",
    ],
    firstDesignMove:
      "Implement the release gate checklist immediately. This single structural change will surface all downstream problems (capacity gaps, missing permits, undefined scope) before they become production fires.",
    confidence: "HIGH",
  };
}

// ─── Confidence badge colours ───────────────────────────────────────────────
const confidenceVariant: Record<
  FlowStabilizationAnalysis["confidence"],
  "default" | "secondary" | "destructive"
> = {
  HIGH:   "default",
  MEDIUM: "secondary",
  LOW:    "destructive",
};

const defaultResponses: FlowStabilizationResponses = {
  releaseReadinessCriteria: "",
  releaseAuthority: "",
  capacityCheckMethod: "",
  pmCapacityEstimate: "",
  capacityVisibilityLocation: "",
  changeOrderFlow: "",
  approvalToFieldDelay: "",
  scheduleControlMeeting: "",
  decisionReopenFrequency: "",
};

export default function FlowStabilization() {
  const [responses, setResponses] = useState<FlowStabilizationResponses>(defaultResponses);
  const [analysis, setAnalysis] = useState<FlowStabilizationAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FlowStabilizationResponses) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setResponses((prev) => ({ ...prev, [key]: e.target.value }));

  const handleGenerate = async () => {
    // Validate required fields
    const missing = REQUIRED_FIELDS.filter((f) => !responses[f.key].trim());
    if (missing.length > 0) {
      setError(
        `Please fill in: ${missing.map((f) => f.label).join(", ")}.`
      );
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await runFlowStabilizationAnalysis(responses);
      setAnalysis(result);
    } catch (err) {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-8 p-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Flow Stabilization</h1>
            <p className="text-sm text-muted-foreground">
              Answer each section to generate a tailored stabilization plan.
            </p>
          </div>
        </div>

        {/* SECTION 1 – Release Gate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
              Section 1 — Release Gate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="releaseReadinessCriteria">
                Before a job enters production, what must be true?
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Textarea
                id="releaseReadinessCriteria"
                placeholder="e.g. Materials confirmed, permits approved, crew available..."
                rows={4}
                value={responses.releaseReadinessCriteria}
                onChange={set("releaseReadinessCriteria")}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="releaseAuthority">
                Who gives final authorization to release work?
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Textarea
                id="releaseAuthority"
                placeholder="e.g. Project Manager, Operations Director..."
                rows={3}
                value={responses.releaseAuthority}
                onChange={set("releaseAuthority")}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="capacityCheckMethod">
                Is crew capacity formally checked before release? If yes, how?
              </Label>
              <Textarea
                id="capacityCheckMethod"
                placeholder="e.g. Weekly capacity board, PM discretion, no formal check..."
                rows={3}
                value={responses.capacityCheckMethod}
                onChange={set("capacityCheckMethod")}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2 – Capacity Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
              Section 2 — Capacity Visibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pmCapacityEstimate">
                How many active jobs can one PM realistically manage?
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Textarea
                id="pmCapacityEstimate"
                placeholder="e.g. 8–10 jobs, it varies significantly by job size..."
                rows={3}
                value={responses.pmCapacityEstimate}
                onChange={set("pmCapacityEstimate")}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="capacityVisibilityLocation">
                Where is that capacity visible today?
              </Label>
              <Textarea
                id="capacityVisibilityLocation"
                placeholder="e.g. Whiteboard in the office, project management software, nowhere..."
                rows={3}
                value={responses.capacityVisibilityLocation}
                onChange={set("capacityVisibilityLocation")}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 – Replanning */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
              Section 3 — Replanning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="changeOrderFlow">
                When scope changes mid-project, what actually happens?
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Textarea
                id="changeOrderFlow"
                placeholder="e.g. PM negotiates informally, formal CO raised, work begins before approval..."
                rows={4}
                value={responses.changeOrderFlow}
                onChange={set("changeOrderFlow")}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="approvalToFieldDelay">
                What is the typical delay between approval and field execution?
              </Label>
              <Textarea
                id="approvalToFieldDelay"
                placeholder="e.g. Same day, 2–3 days, up to a week or more..."
                rows={3}
                value={responses.approvalToFieldDelay}
                onChange={set("approvalToFieldDelay")}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4 – Meeting Control */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
              Section 4 — Meeting Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="scheduleControlMeeting">
                What meeting currently controls schedule decisions?
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Textarea
                id="scheduleControlMeeting"
                placeholder="e.g. Monday operations meeting, no defined meeting, ad hoc calls..."
                rows={3}
                value={responses.scheduleControlMeeting}
                onChange={set("scheduleControlMeeting")}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="decisionReopenFrequency">
                Are schedule decisions frequently reopened?
              </Label>
              <Textarea
                id="decisionReopenFrequency"
                placeholder="e.g. Yes, almost weekly; rarely; only on large jobs..."
                rows={3}
                value={responses.decisionReopenFrequency}
                onChange={set("decisionReopenFrequency")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Validation error */}
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-end pb-4">
          <Button size="lg" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing…
              </>
            ) : (
              "Generate Stabilization Plan"
            )}
          </Button>
        </div>

        {/* ── Analysis Output ──────────────────────────────────────────────── */}
        {analysis && (
          <div className="space-y-6 pb-12">
            <Separator />

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Stabilization Output</h2>
              <Badge variant={confidenceVariant[analysis.confidence]}>
                {analysis.confidence} confidence
              </Badge>
            </div>

            {/* Flow Risk Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Flow Risk Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{analysis.flowRiskSummary}</p>
              </CardContent>
            </Card>

            {/* Readiness Gap */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Readiness Gap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{analysis.readinessGap}</p>
              </CardContent>
            </Card>

            {/* Stabilization Moves */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Stabilization Moves
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {analysis.stabilizationMoves.map((move, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{move}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* First Design Move */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  First Design Move
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 text-sm leading-relaxed">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>{analysis.firstDesignMove}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
