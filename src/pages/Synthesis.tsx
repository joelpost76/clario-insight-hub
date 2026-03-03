import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Target, Flame, Clock, Users, Activity, Save } from "lucide-react";

interface Finding {
  id: string;
  workspace_id: string;
  constraint_statement: string;
  confidence_level: string;
  recommended_service: string | null;
  consultant_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function Synthesis() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspaceId, refreshCompletionStatus } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finding, setFinding] = useState<Finding | null>(null);

  // Signal data
  const [painAreas, setPainAreas] = useState<{ label: string; rating: number }[]>([]);
  const [recurringFire, setRecurringFire] = useState<string | null>(null);
  const [waitPoints, setWaitPoints] = useState<string | null>(null);
  const [teamThemes, setTeamThemes] = useState<{ theme: string; count: number }[]>([]);
  const [flowMetrics, setFlowMetrics] = useState<{ wip: number | null; leadTime: number | null; rework: number | null }>({ wip: null, leadTime: null, rework: null });

  // Form state
  const [form, setForm] = useState({
    constraint_statement: "",
    confidence_level: "medium",
    recommended_service: "",
    consultant_notes: "",
  });

  useEffect(() => {
    if (workspaceId) {
      loadAll();
    }
  }, [workspaceId]);

  const loadAll = async () => {
    if (!workspaceId) return;
    setLoading(true);

    const [intakeRes, interviewsRes, baselineRes, findingRes] = await Promise.all([
      supabase.from("intake_responses").select("pain_ratings, recurring_fire_sentence, toc_wait_points").eq("workspace_id", workspaceId).maybeSingle(),
      supabase.from("interviews").select("themes, status").eq("workspace_id", workspaceId),
      supabase.from("flow_baselines").select("wip_count, lead_time_days, rework_rate").eq("workspace_id", workspaceId).maybeSingle(),
      supabase.from("findings" as any).select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    // Pain areas — top 3
    if (intakeRes.data?.pain_ratings) {
      const ratings = intakeRes.data.pain_ratings as Record<string, number>;
      const sorted = Object.entries(ratings)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([label, rating]) => ({ label, rating }));
      setPainAreas(sorted);
    }
    setRecurringFire(intakeRes.data?.recurring_fire_sentence ?? null);
    setWaitPoints(intakeRes.data?.toc_wait_points ?? null);

    // Team themes — aggregate from completed interviews
    if (interviewsRes.data) {
      const themeCounts: Record<string, number> = {};
      for (const interview of interviewsRes.data) {
        if (interview.status === "complete" && interview.themes) {
          for (const theme of interview.themes) {
            themeCounts[theme] = (themeCounts[theme] || 0) + 1;
          }
        }
      }
      const sorted = Object.entries(themeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([theme, count]) => ({ theme, count }));
      setTeamThemes(sorted);
    }

    // Flow metrics
    if (baselineRes.data) {
      setFlowMetrics({
        wip: baselineRes.data.wip_count ?? null,
        leadTime: baselineRes.data.lead_time_days ?? null,
        rework: baselineRes.data.rework_rate ?? null,
      });
    }

    // Existing finding
    if (findingRes.data) {
      const f = findingRes.data as unknown as Finding;
      setFinding(f);
      setForm({
        constraint_statement: f.constraint_statement,
        confidence_level: f.confidence_level,
        recommended_service: f.recommended_service ?? "",
        consultant_notes: f.consultant_notes ?? "",
      });
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.constraint_statement.trim()) {
      toast({ title: "Required", description: "Please state the constraint.", variant: "destructive" });
      return;
    }

    setSaving(true);

    const payload = {
      workspace_id: workspaceId!,
      constraint_statement: form.constraint_statement.trim(),
      confidence_level: form.confidence_level,
      recommended_service: form.recommended_service || null,
      consultant_notes: form.consultant_notes || null,
    };

    let result;
    if (finding) {
      result = await supabase
        .from("findings" as any)
        .update(payload as any)
        .eq("id", finding.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("findings" as any)
        .insert(payload as any)
        .select()
        .single();
    }

    if (result.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    } else {
      const f = result.data as unknown as Finding;
      setFinding(f);
      toast({ title: "Saved", description: "Constraint finding has been captured." });
      await refreshCompletionStatus();
    }

    setSaving(false);
  };

  const hasSignalData = painAreas.length > 0 || recurringFire || waitPoints || teamThemes.length > 0 || flowMetrics.wip !== null;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Synthesis</h1>
          <p className="mt-1 text-muted-foreground">
            Review the evidence. Name the constraint.
          </p>
        </div>

        {/* Constraint Identified Banner */}
        {finding && (
          <div className="rounded-lg bg-[#1A2018] px-6 py-5">
            <div className="flex items-start gap-3">
              <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#B8A94A]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B8A94A]">
                  Constraint Identified
                </p>
                <p className="mt-1.5 text-lg font-semibold leading-snug text-[#F7F9F5]">
                  {finding.constraint_statement}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[#B8A94A]/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#B8A94A]">
                    {finding.confidence_level} confidence
                  </span>
                  {finding.recommended_service && (
                    <span className="text-xs text-[#9CA89A]">
                      → {finding.recommended_service}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Signal Summary */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Evidence Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!hasSignalData ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No diagnostic data collected yet. Complete the Intake, Interviews, and Flow Baseline steps to populate this panel.
              </p>
            ) : (
              <>
                {/* Highest Pain Areas */}
                {painAreas.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-destructive/70" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Highest Pain Areas
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {painAreas.map((p) => (
                        <div
                          key={p.label}
                          className="rounded-lg border border-border bg-card px-3 py-2"
                        >
                          <span className="text-sm font-medium text-foreground">{p.label}</span>
                          <span className="ml-2 text-xs font-semibold text-destructive">{p.rating}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recurring Fire */}
                {recurringFire && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-[#B8A94A]" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Recurring Fire
                      </p>
                    </div>
                    <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm italic text-foreground">
                      "{recurringFire}"
                    </p>
                  </div>
                )}

                {/* Where Work Waits */}
                {waitPoints && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#B8A94A]" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Where Work Waits
                      </p>
                    </div>
                    <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
                      {waitPoints}
                    </p>
                  </div>
                )}

                {/* Team Themes */}
                {teamThemes.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Team Themes
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {teamThemes.map((t) => (
                        <span
                          key={t.theme}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {t.theme}
                          <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold">
                            {t.count}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flow Metrics */}
                {(flowMetrics.wip !== null || flowMetrics.leadTime !== null || flowMetrics.rework !== null) && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Flow Metrics
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {flowMetrics.wip !== null && (
                        <div className="rounded-lg border border-border bg-card p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">{flowMetrics.wip}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">WIP Count</p>
                        </div>
                      )}
                      {flowMetrics.leadTime !== null && (
                        <div className="rounded-lg border border-border bg-card p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">{flowMetrics.leadTime}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Lead Time (days)</p>
                        </div>
                      )}
                      {flowMetrics.rework !== null && (
                        <div className="rounded-lg border border-border bg-card p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">{flowMetrics.rework}%</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Rework Rate</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Constraint Capture */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Constraint Capture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="constraint_statement">
                State the primary system constraint in one sentence *
              </Label>
              <Textarea
                id="constraint_statement"
                placeholder='Example: Jobs enter production without complete scope, causing rework, schedule breaks, and late billing.'
                rows={4}
                value={form.constraint_statement}
                onChange={(e) => setForm((p) => ({ ...p, constraint_statement: e.target.value }))}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Select
                  value={form.confidence_level}
                  onValueChange={(v) => setForm((p) => ({ ...p, confidence_level: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recommended Service</Label>
                <Select
                  value={form.recommended_service}
                  onValueChange={(v) => setForm((p) => ({ ...p, recommended_service: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clario Install: Operating System">Clario Install: Operating System</SelectItem>
                    <SelectItem value="Onboarding Success System">Onboarding Success System</SelectItem>
                    <SelectItem value="Fractional Ops Leadership">Fractional Ops Leadership</SelectItem>
                    <SelectItem value="Not yet determined">Not yet determined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultant_notes">Consultant Notes (optional)</Label>
              <Textarea
                id="consultant_notes"
                placeholder="Internal observations, supporting evidence, or next steps..."
                rows={3}
                value={form.consultant_notes}
                onChange={(e) => setForm((p) => ({ ...p, consultant_notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {finding ? "Update Finding" : "Save Finding"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/baseline")}>
            Back to Flow Baseline
          </Button>
          <Button variant="secondary" onClick={() => navigate("/readout")}>
            Next: Readout
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
