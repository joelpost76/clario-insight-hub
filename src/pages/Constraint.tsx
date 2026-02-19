import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Loader2,
  Brain,
  AlertTriangle,
  Info,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type {
  StructuredIntakeData,
  ConstraintAnalysis,
  ConstraintPageState,
  ConstraintSource,
} from "@/types/clarioConstraintTypes";
import { buildStructuredIntakeDataForClient } from "@/types/clarioConstraintTypes";
import { runConstraintAnalysis } from "@/lib/constraintAnalysis";






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

const SOURCE_LABELS: Record<ConstraintSource, string> = {
  SYMPTOMS: "Symptoms",
  PAIN_RATINGS: "Pain Ratings",
  TOC: "TOC",
  DECISIONS: "Decisions",
  TOOLS: "Tools",
  METRICS: "Metrics",
  KICKOFF: "Kickoff",
};

// Group signals by source
function groupSignals(signals: ConstraintAnalysis["supportingSignals"]) {
  return signals.reduce<Record<string, typeof signals>>((acc, s) => {
    const key = SOURCE_LABELS[s.source] ?? s.source;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Constraint() {
  const navigate = useNavigate();
  const { workspaceId } = useWorkspace();
  const { toast } = useToast();

  const [initLoading, setInitLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const [structuredData, setStructuredData] = useState<StructuredIntakeData | null>(null);
  const [pageState, setPageState] = useState<ConstraintPageState>({
    aiAnalysis: undefined,
    consultantEdits: undefined,
  });

  // Editable fields (seeded from AI analysis when it loads)
  const [editConstraint, setEditConstraint] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // ── On mount: load structured intake data ──────────────────────────────────
  useEffect(() => {
    async function loadData() {
      setInitLoading(true);
      setInitError(null);
      try {
        const data = await buildStructuredIntakeDataForClient(workspaceId ?? "");
        setStructuredData(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load intake data";
        setInitError(msg);
      } finally {
        setInitLoading(false);
      }
    }
    loadData();
  }, [workspaceId]);

  // ── Run analysis (real AI call) ───────────────────────────────────────────
  const handleRunAnalysis = async () => {
    if (!structuredData) return;
    setAnalysisLoading(true);
    try {
      const result = await runConstraintAnalysis(structuredData);
      setPageState((prev) => ({ ...prev, aiAnalysis: result }));
      setEditConstraint(result.primaryConstraint);
      setEditNotes((prev) => prev || "");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    } finally {
      setAnalysisLoading(false);
    }
  };

  // ── Set as working constraint ──────────────────────────────────────────────
  const handleSetConstraint = () => {
    if (!editConstraint.trim()) {
      toast({
        title: "Constraint required",
        description: "Enter or confirm the constraint statement before saving.",
        variant: "destructive",
      });
      return;
    }
    setPageState((prev) => ({
      ...prev,
      consultantEdits: {
        finalConstraint: editConstraint.trim(),
        finalNotes: editNotes.trim() || undefined,
        acceptedAt: new Date().toISOString(),
      },
    }));
    toast({ title: "Working constraint set", description: "Locked for this engagement." });
  };

  const analysis = pageState.aiAnalysis;
  const isAccepted = !!pageState.consultantEdits?.acceptedAt;
  const groupedSignals = analysis ? groupSignals(analysis.supportingSignals) : {};

  // ── Loading / error states ─────────────────────────────────────────────────
  if (initLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (initError || !structuredData) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-start gap-3 py-6">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium">Failed to load intake data</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {initError ?? "No structured data available. Complete Kickoff and Intake first."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Constraint</h1>
            <p className="mt-1 text-muted-foreground">
              Turn the intake into a working hypothesis we can test together.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/intake")}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Intake
          </Button>
        </div>

        {/* ── Pre-analysis info card ── */}
        {!analysis && !analysisLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Brain className="h-7 w-7 text-primary" />
              </div>
              <div className="max-w-sm">
                <p className="font-medium">Run the constraint analysis</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  See a proposed working constraint based on the Kickoff + Intake data collected so far.
                </p>
              </div>
              <Button onClick={handleRunAnalysis} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Run AI Constraint Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Analysis loading ── */}
        {analysisLoading && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analysing Kickoff + Intake signals…
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Analysis results ── */}
        {analysis && !analysisLoading && (
          <div className="space-y-6">

            {/* ── Section: AI Proposed Constraint ── */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                AI Proposed Constraint
              </h2>

              <Card>
                <CardContent className="space-y-4 pt-4">
                  {/* Editable constraint text area */}
                  <div className="space-y-2">
                    <Label htmlFor="editConstraint" className="text-sm font-medium">
                      Constraint statement
                    </Label>
                    <Textarea
                      id="editConstraint"
                      rows={3}
                      value={editConstraint}
                      onChange={(e) => setEditConstraint(e.target.value)}
                      placeholder="One clear sentence describing the binding constraint…"
                      className="resize-none"
                    />
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{analysis.constraintType}</Badge>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      AI confidence
                      <ConfidenceBadge level={analysis.aiConfidence} />
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Data quality
                      <ConfidenceBadge level={analysis.inferredDataQuality} />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ── Section: Secondary Constraints ── */}
            {analysis.secondaryConstraints && analysis.secondaryConstraints.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Supporting Pressures
                </h2>
                <div className="space-y-3">
                  {analysis.secondaryConstraints.map((sc, i) => (
                    <Card key={i} className="border-border/60 bg-muted/30">
                      <CardContent className="pt-4 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-normal">
                            {sc.label}
                          </Badge>
                        </div>
                        <p className="text-sm">{sc.constraintStatement}</p>
                        <p className="text-xs text-muted-foreground italic">
                          {sc.whyItReinforcesPrimary}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* ── Section: Evidence ── */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Evidence
              </h2>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Left: signals grouped by source */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Signals pointing here</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(groupedSignals).map(([sourceLabel, signals]) => (
                      <div key={sourceLabel}>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {sourceLabel}
                        </p>
                        <ul className="space-y-1.5">
                          {signals.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              <span>{s.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Right: causes + effects */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Upstream causes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.upstreamCauses.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Downstream effects if this constraint improves
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.downstreamEffects.map((e, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* ── Section: Suggested Diagnostic Focus ── */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Suggested Diagnostic Focus
              </h2>
              <div className="flex flex-wrap gap-2">
                {analysis.suggestedDiagnosticModules.map((m, i) => (
                  <Badge key={i} variant="outline" className="px-3 py-1 text-sm font-normal">
                    {m}
                  </Badge>
                ))}
              </div>
            </section>

            {/* ── Section: Consultant Notes ── */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Consultant Notes
              </h2>

              {/* AI-generated note (read-only) */}
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
                <CardContent className="flex items-start gap-3 pt-4">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    {analysis.notesForConsultant}
                  </p>
                </CardContent>
              </Card>

              {/* Editable notes */}
              <div className="space-y-2">
                <Label htmlFor="editNotes" className="text-sm">
                  Your notes (optional)
                </Label>
                <Textarea
                  id="editNotes"
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Any additional context, caveats, or next steps…"
                  className="resize-none"
                />
              </div>
            </section>

            {/* ── Accepted state ── */}
            {isAccepted && (
              <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30">
                <CardContent className="flex items-start gap-3 py-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                      Working constraint set
                    </p>
                    <p className="mt-0.5 text-sm text-emerald-800 dark:text-emerald-300">
                      {pageState.consultantEdits?.finalConstraint}
                    </p>
                    {pageState.consultantEdits?.finalNotes && (
                      <p className="mt-1 text-xs italic text-emerald-700 dark:text-emerald-400">
                        {pageState.consultantEdits.finalNotes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Bottom actions ── */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunAnalysis}
                disabled={analysisLoading}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Re-run Analysis
              </Button>

              <Button onClick={handleSetConstraint} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Set as Working Constraint
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
