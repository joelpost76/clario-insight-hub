import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitPullRequest, Zap, RefreshCw, Loader2, AlertCircle, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ScopeDisciplineResponses, ScopeDisciplineAnalysis } from "@/types/scopeDisciplineTypes";

const EMPTY: ScopeDisciplineResponses = {
  estimateVarianceFrequency: "",
  estimateReviewProcess: "",
  estimatingOwnership: "",
  avgChangeApprovalTime: "",
  pmApprovalThreshold: "",
  workBeforePricing: "",
  marginErosionVisibility: "",
  changeOrderMarginTracking: "",
  smallChangeLoggingBehavior: "",
  changeConversationStructure: "",
};

interface Field {
  key: keyof ScopeDisciplineResponses;
  label: string;
  placeholder?: string;
}

const SECTIONS: { title: string; fields: Field[] }[] = [
  {
    title: "Section 1 — Estimate Integrity",
    fields: [
      {
        key: "estimateVarianceFrequency",
        label: "How often does actual field duration exceed the estimate?",
        placeholder: "Describe frequency and typical magnitude of overruns…",
      },
      {
        key: "estimateReviewProcess",
        label: "Is there a formal estimate-to-actual review?",
        placeholder: "Describe the review process, cadence, and who participates…",
      },
      {
        key: "estimatingOwnership",
        label: "Who owns and updates estimating standards?",
        placeholder: "Name the role or person responsible and how standards are maintained…",
      },
    ],
  },
  {
    title: "Section 2 — Change Order Flow",
    fields: [
      {
        key: "avgChangeApprovalTime",
        label: "Average time from change identification to client approval?",
        placeholder: "e.g. same day, 3–5 days, over a week — and what drives the delay…",
      },
      {
        key: "pmApprovalThreshold",
        label: "Can PMs approve small changes independently?",
        placeholder: "Describe any dollar or scope thresholds and who else is involved…",
      },
      {
        key: "workBeforePricing",
        label: "Does field work ever proceed before pricing is finalized?",
        placeholder: "How often, under what conditions, and who makes that call…",
      },
    ],
  },
  {
    title: "Section 3 — Margin Visibility",
    fields: [
      {
        key: "marginErosionVisibility",
        label: "When do you detect margin erosion — during execution or after close?",
        placeholder: "Describe your current visibility and what triggers awareness…",
      },
      {
        key: "changeOrderMarginTracking",
        label: "Are change orders tracked separately from base margin?",
        placeholder: "Describe how COs are recorded and whether margin is isolated…",
      },
    ],
  },
  {
    title: "Section 4 — Behavioral Signals",
    fields: [
      {
        key: "smallChangeLoggingBehavior",
        label: "Do PMs hesitate to log small scope changes?",
        placeholder: "Describe what typically gets logged vs. absorbed informally…",
      },
      {
        key: "changeConversationStructure",
        label: "Are change conversations structured or reactive?",
        placeholder: "Describe how PMs or field staff typically raise scope changes with clients…",
      },
    ],
  },
];

const CONFIDENCE_COLORS: Record<ScopeDisciplineAnalysis["confidence"], string> = {
  LOW: "bg-destructive/10 text-destructive border-destructive/20",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  HIGH: "bg-primary/10 text-primary border-primary/20",
};

async function runScopeDisciplineAnalysis(
  responses: ScopeDisciplineResponses
): Promise<ScopeDisciplineAnalysis> {
  const { data, error } = await supabase.functions.invoke("analyze-scope-discipline", {
    body: { responses },
  });
  if (error) throw new Error(error.message ?? "Edge function error");
  if (data?.error) throw new Error(data.error);
  return data.analysis as ScopeDisciplineAnalysis;
}

export default function ScopeDiscipline() {
  const [responses, setResponses] = useState<ScopeDisciplineResponses>(EMPTY);
  const [analysis, setAnalysis] = useState<ScopeDisciplineAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formTopRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const set = (key: keyof ScopeDisciplineResponses) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setResponses((prev) => ({ ...prev, [key]: e.target.value }));

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runScopeDisciplineAnalysis(responses);
      setAnalysis(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRerun = () => {
    formTopRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filledCount = Object.values(responses).filter((v) => v.trim().length > 0).length;
  const totalFields = Object.keys(EMPTY).length;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">

        {/* Header */}
        <div ref={formTopRef} className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <GitPullRequest className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Scope &amp; Change Discipline</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Assess how estimate accuracy, change order capture, and scope control operate across projects.
              Answer each question to generate a targeted Scope Control Plan.
            </p>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.fields.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="text-sm font-medium leading-snug">
                    {label}
                  </Label>
                  <Textarea
                    id={key}
                    placeholder={placeholder}
                    value={responses[key]}
                    onChange={set(key)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Generate button */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={handleGenerate}
            disabled={loading || filledCount < 6}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Analysing…</>
            ) : (
              <><Zap className="h-4 w-4" />Generate Scope Control Plan</>
            )}
          </Button>
          {filledCount < 6 && !loading && (
            <p className="text-xs text-muted-foreground">
              Complete at least 6 of {totalFields} fields to generate the plan ({filledCount}/{totalFields} filled).
            </p>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Analysis output */}
        {analysis && (
          <div className="space-y-6 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Scope Control Plan</h2>
              <Badge
                variant="outline"
                className={`text-xs font-semibold ${CONFIDENCE_COLORS[analysis.confidence]}`}
              >
                {analysis.confidence} confidence
              </Badge>
            </div>

            {/* Scope Integrity Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Scope Integrity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{analysis.scopeIntegritySummary}</p>
              </CardContent>
            </Card>

            {/* Margin Leakage Mechanism */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Margin Leakage Mechanism
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{analysis.marginLeakageMechanism}</p>
              </CardContent>
            </Card>

            {/* Change Control Risk Pattern */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Change Control Risk Pattern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{analysis.changeControlRiskPattern}</p>
              </CardContent>
            </Card>

            {/* Discipline Moves */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Discipline Moves
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {analysis.disciplineMoves.map((move, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      {move}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Control Upgrade — highlighted callout */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                  <ArrowUpRight className="h-4 w-4" />
                  Highest-Leverage Control Upgrade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium leading-relaxed">{analysis.controlUpgrade}</p>
              </CardContent>
            </Card>

            {/* Re-run banner */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Edit your answers and regenerate to refine the plan.
              </p>
              <Button variant="outline" size="sm" onClick={handleRerun} className="gap-2 shrink-0">
                <RefreshCw className="h-3.5 w-3.5" />
                Re-run Analysis
              </Button>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
