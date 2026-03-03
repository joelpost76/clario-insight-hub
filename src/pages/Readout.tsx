import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Target,
  Flame,
  Clock,
  Users,
  Activity,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Presentation,
  ClipboardList,
  Printer,
  Download,
} from "lucide-react";

interface Finding {
  id: string;
  constraint_statement: string;
  confidence_level: string;
  recommended_service: string | null;
  consultant_notes: string | null;
  created_at: string;
}

interface KickoffData {
  outcomes_90_day: string[] | null;
  scope_workflows: string[] | null;
  scope_teams: string[] | null;
  constraints_nonnegotiables: string[] | null;
}

export default function Readout() {
  const navigate = useNavigate();
  const { workspaceId, completionStatus } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState<Finding | null>(null);
  const [kickoff, setKickoff] = useState<KickoffData | null>(null);
  const [painAreas, setPainAreas] = useState<{ label: string; rating: number }[]>([]);
  const [recurringFire, setRecurringFire] = useState<string | null>(null);
  const [waitPoints, setWaitPoints] = useState<string | null>(null);
  const [teamThemes, setTeamThemes] = useState<{ theme: string; count: number }[]>([]);
  const [flowMetrics, setFlowMetrics] = useState<{
    wip: number | null;
    leadTime: number | null;
    rework: number | null;
    throughput: number | null;
    billingCycle: number | null;
  }>({ wip: null, leadTime: null, rework: null, throughput: null, billingCycle: null });
  const [sipocCount, setSipocCount] = useState(0);
  const [workflowCount, setWorkflowCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const [artifactCount, setArtifactCount] = useState(0);

  useEffect(() => {
    if (workspaceId) loadAll();
  }, [workspaceId]);

  const loadAll = async () => {
    if (!workspaceId) return;
    setLoading(true);

    const [
      findingRes,
      workspaceRes,
      intakeRes,
      interviewsRes,
      baselineRes,
      sipocRes,
      workflowRes,
      artifactRes,
    ] = await Promise.all([
      supabase.from("findings" as any).select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("workspaces").select("outcomes_90_day, scope_workflows, scope_teams, constraints_nonnegotiables").eq("id", workspaceId).maybeSingle(),
      supabase.from("intake_responses").select("pain_ratings, recurring_fire_sentence, toc_wait_points").eq("workspace_id", workspaceId).maybeSingle(),
      supabase.from("interviews").select("themes, status").eq("workspace_id", workspaceId),
      supabase.from("flow_baselines").select("wip_count, lead_time_days, rework_rate, throughput_per_week, billing_cycle_days").eq("workspace_id", workspaceId).maybeSingle(),
      supabase.from("sipocs").select("id").eq("workspace_id", workspaceId),
      supabase.from("workflow_maps").select("id").eq("workspace_id", workspaceId),
      supabase.from("artifacts").select("id").eq("workspace_id", workspaceId),
    ]);

    // Finding
    if (findingRes.data) {
      setFinding(findingRes.data as unknown as Finding);
    }

    // Kickoff
    if (workspaceRes.data) {
      setKickoff(workspaceRes.data as KickoffData);
    }

    // Pain areas
    if (intakeRes.data?.pain_ratings) {
      const ratings = intakeRes.data.pain_ratings as Record<string, number>;
      const sorted = Object.entries(ratings)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([label, rating]) => ({ label, rating }));
      setPainAreas(sorted);
    }
    setRecurringFire(intakeRes.data?.recurring_fire_sentence ?? null);
    setWaitPoints(intakeRes.data?.toc_wait_points ?? null);

    // Interview themes
    if (interviewsRes.data) {
      const themeCounts: Record<string, number> = {};
      let completed = 0;
      for (const interview of interviewsRes.data) {
        if (interview.status === "complete") {
          completed++;
          if (interview.themes) {
            for (const theme of interview.themes) {
              themeCounts[theme] = (themeCounts[theme] || 0) + 1;
            }
          }
        }
      }
      setInterviewCount(completed);
      setTeamThemes(
        Object.entries(themeCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([theme, count]) => ({ theme, count }))
      );
    }

    // Flow metrics
    if (baselineRes.data) {
      setFlowMetrics({
        wip: baselineRes.data.wip_count ?? null,
        leadTime: baselineRes.data.lead_time_days ?? null,
        rework: baselineRes.data.rework_rate ?? null,
        throughput: baselineRes.data.throughput_per_week ?? null,
        billingCycle: baselineRes.data.billing_cycle_days ?? null,
      });
    }

    setSipocCount(sipocRes.data?.length ?? 0);
    setWorkflowCount(workflowRes.data?.length ?? 0);
    setArtifactCount(artifactRes.data?.length ?? 0);

    setLoading(false);
  };

  // Completion gate tracking
  const gates = [
    { label: "Kickoff", key: "kickoff" as const, icon: ClipboardList },
    { label: "Intake", key: "intake" as const, icon: FileText },
    { label: "Artifacts", key: "artifacts" as const, icon: FileText },
    { label: "Interviews", key: "interviews" as const, icon: Users },
    { label: "Survey", key: "survey" as const, icon: BarChart3 },
    { label: "SIPOC", key: "sipoc" as const, icon: Activity },
    { label: "Workflow", key: "workflow" as const, icon: Activity },
    { label: "Baseline", key: "baseline" as const, icon: BarChart3 },
    { label: "Synthesis", key: "synthesis" as const, icon: Target },
  ];

  const completedGates = completionStatus ? gates.filter((g) => completionStatus[g.key]).length : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!finding) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Readout</h1>
            <p className="mt-1 text-muted-foreground">
              Present the diagnostic findings and recommended path forward.
            </p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="h-12 w-12 text-[hsl(var(--warning))]/40" />
              <p className="mt-4 text-sm font-medium text-foreground">
                No constraint has been identified yet.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete the Synthesis step to name the primary system constraint before preparing the readout.
              </p>
              <Button className="mt-6" onClick={() => navigate("/synthesis")}>
                Go to Synthesis
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Presentation className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">Diagnostic Readout</h1>
            </div>
            <p className="mt-1 text-muted-foreground">
              Summary of findings and recommended path forward.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
              {completedGates}/{gates.length} gates complete
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 print:hidden"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Primary Constraint Banner */}
        <div className="rounded-lg bg-[#1A2018] px-6 py-6">
          <div className="flex items-start gap-3">
            <Target className="mt-1 h-6 w-6 flex-shrink-0 text-[#B8A94A]" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#B8A94A]">
                Primary System Constraint
              </p>
              <p className="mt-2 text-xl font-semibold leading-snug text-[#F7F9F5]">
                {finding.constraint_statement}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-[#B8A94A]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#B8A94A]">
                  {finding.confidence_level} confidence
                </span>
                {finding.recommended_service && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-[#9CA89A]">
                    <ArrowRight className="h-3.5 w-3.5" />
                    {finding.recommended_service}
                  </span>
                )}
              </div>
              {finding.consultant_notes && (
                <p className="mt-4 border-t border-[#2A3028] pt-3 text-sm italic text-[#9CA89A]">
                  {finding.consultant_notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Completion Gates Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Diagnostic Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
              {gates.map((gate) => {
                const complete = completionStatus?.[gate.key] ?? false;
                return (
                  <div
                    key={gate.key}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition-colors ${
                      complete
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    {complete ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <gate.icon className="h-4 w-4 text-muted-foreground/50" />
                    )}
                    <span className={`text-[10px] font-medium leading-tight ${complete ? "text-foreground" : "text-muted-foreground"}`}>
                      {gate.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Evidence Summary — Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pain & Symptoms */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-destructive/70" />
                <CardTitle className="text-base">Pain & Symptoms</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {painAreas.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Top Pain Areas
                  </p>
                  <div className="space-y-1.5">
                    {painAreas.map((p) => (
                      <div key={p.label} className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2">
                        <span className="text-sm font-medium text-foreground">{p.label.replace(/_/g, " ")}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-destructive/70 transition-all"
                              style={{ width: `${(p.rating / 10) * 100}%` }}
                            />
                          </div>
                          <span className="min-w-[2rem] text-right text-xs font-bold text-destructive">{p.rating}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recurringFire && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recurring Fire
                  </p>
                  <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm italic text-foreground">
                    "{recurringFire}"
                  </p>
                </div>
              )}

              {waitPoints && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Where Work Waits
                  </p>
                  <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
                    {waitPoints}
                  </p>
                </div>
              )}

              {painAreas.length === 0 && !recurringFire && !waitPoints && (
                <p className="py-4 text-center text-sm text-muted-foreground">No intake data collected.</p>
              )}
            </CardContent>
          </Card>

          {/* Flow Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Flow Metrics</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(flowMetrics.wip !== null || flowMetrics.leadTime !== null || flowMetrics.rework !== null || flowMetrics.throughput !== null || flowMetrics.billingCycle !== null) ? (
                <div className="grid grid-cols-2 gap-3">
                  {flowMetrics.wip !== null && (
                    <MetricTile label="WIP Count" value={String(flowMetrics.wip)} />
                  )}
                  {flowMetrics.throughput !== null && (
                    <MetricTile label="Throughput / wk" value={String(flowMetrics.throughput)} />
                  )}
                  {flowMetrics.leadTime !== null && (
                    <MetricTile label="Lead Time" value={`${flowMetrics.leadTime}d`} />
                  )}
                  {flowMetrics.rework !== null && (
                    <MetricTile label="Rework Rate" value={`${flowMetrics.rework}%`} alert={Number(flowMetrics.rework) > 15} />
                  )}
                  {flowMetrics.billingCycle !== null && (
                    <MetricTile label="Billing Cycle" value={`${flowMetrics.billingCycle}d`} />
                  )}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No flow baseline data collected.</p>
              )}

              <Separator />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Data Collected
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <DataCountPill label="SIPOCs" count={sipocCount} />
                  <DataCountPill label="Workflow Maps" count={workflowCount} />
                  <DataCountPill label="Interviews" count={interviewCount} />
                  <DataCountPill label="Artifacts" count={artifactCount} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Themes */}
        {teamThemes.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Team Themes from Interviews</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {teamThemes.map((t) => (
                  <span
                    key={t.theme}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    {t.theme}
                    <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {t.count}
                    </span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 90-Day Outcomes & Scope */}
        {kickoff && (kickoff.outcomes_90_day?.length || kickoff.scope_workflows?.length || kickoff.scope_teams?.length) && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Engagement Scope & Objectives</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {kickoff.outcomes_90_day && kickoff.outcomes_90_day.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    90-Day Outcomes
                  </p>
                  <ul className="space-y-1">
                    {kickoff.outcomes_90_day.map((o, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {kickoff.scope_workflows && kickoff.scope_workflows.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Workflows in Scope
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {kickoff.scope_workflows.map((w, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{w}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {kickoff.scope_teams && kickoff.scope_teams.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Teams in Scope
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {kickoff.scope_teams.map((t, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {kickoff.constraints_nonnegotiables && kickoff.constraints_nonnegotiables.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Non-Negotiables
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {kickoff.constraints_nonnegotiables.map((c, i) => (
                      <Badge key={i} variant="outline" className="border-destructive/30 text-xs text-destructive">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recommended Path Forward */}
        {finding.recommended_service && finding.recommended_service !== "Not yet determined" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recommended Path Forward</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{finding.recommended_service}</p>
                  <p className="text-sm text-muted-foreground">
                    Based on the identified constraint and diagnostic evidence collected across {completedGates} completed gates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-end print:hidden">
          <Button variant="outline" onClick={() => navigate("/synthesis")}>
            Back to Synthesis
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

/* ─── Sub-components ──────────────────────────────────── */

function MetricTile({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${alert ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/20"}`}>
      <p className={`text-2xl font-bold ${alert ? "text-destructive" : "text-foreground"}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function DataCountPill({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold ${count > 0 ? "text-foreground" : "text-muted-foreground/50"}`}>{count}</span>
    </div>
  );
}
