import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const SYMPTOM_OPTIONS = [
  "Work constantly feels urgent / reactive",
  "Deadlines slip / schedule unpredictability",
  "Margin leakage / estimate-to-actual variance",
  "Rework / mistakes / repeated effort",
  "Too many meetings, not enough clarity",
  "Decisions bottleneck with one person",
  "PMs/coordinators overwhelmed",
  "Billing late / change orders messy / cashflow swings",
  "Tool sprawl / duplicated entry / mismatched systems",
  "Team burnout / turnover risk",
  "Client/customer complaints rising",
  "Onboarding takes too long (people or customers)",
];

const PAIN_AREAS = [
  { key: "sales_to_ops_handoff", label: "Sales → Handoff to Ops" },
  { key: "estimating_scope_quality", label: "Estimating / Scope quality" },
  { key: "scheduling_capacity", label: "Scheduling / Capacity planning" },
  { key: "delivery_execution", label: "Delivery execution" },
  { key: "change_orders", label: "Change orders / Variations" },
  { key: "job_costing_visibility", label: "Job costing / Visibility" },
  { key: "billing_collections", label: "Billing / Collections" },
  { key: "role_clarity_accountability", label: "Role clarity / Accountability" },
  { key: "cadence_meetings", label: "Meetings / Cadence" },
  { key: "customer_comms", label: "Customer communication" },
];

export default function Intake() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspaceId, refreshCompletionStatus } = useWorkspace();
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    symptom_clusters: [] as string[],
    recurring_fire_sentence: "",
    pain_ratings: {} as Record<string, number>,
    toc_wait_points: "",
    toc_replanning_points: "",
    toc_one_fix_effect: "",
    decisions_bottleneck: "",
    metrics_tracked_today: "",
  });

  useEffect(() => {
    if (workspaceId) {
      loadIntake();
    }
  }, [workspaceId]);

  const loadIntake = async () => {
    if (!workspaceId) return;
    
    const { data, error } = await supabase
      .from("intake_responses")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (data) {
      setIntakeId(data.id);
      setFormData({
        symptom_clusters: (data.symptom_clusters as string[]) ?? [],
        recurring_fire_sentence: data.recurring_fire_sentence ?? "",
        pain_ratings: (data.pain_ratings as Record<string, number>) ?? {},
        toc_wait_points: data.toc_wait_points ?? "",
        toc_replanning_points: data.toc_replanning_points ?? "",
        toc_one_fix_effect: data.toc_one_fix_effect ?? "",
        decisions_bottleneck: data.decisions_bottleneck ?? "",
        metrics_tracked_today: data.metrics_tracked_today ?? "",
      });
    }
    setLoading(false);
  };

  const handleSymptomToggle = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptom_clusters: prev.symptom_clusters.includes(symptom)
        ? prev.symptom_clusters.filter((s) => s !== symptom)
        : [...prev.symptom_clusters, symptom],
    }));
  };

  const handlePainRating = (key: string, value: number[]) => {
    setFormData((prev) => ({
      ...prev,
      pain_ratings: { ...prev.pain_ratings, [key]: value[0] },
    }));
  };

  const handleSave = async () => {
    if (!workspaceId) return;

    setSaving(true);

    const intakeData = {
      workspace_id: workspaceId,
      symptom_clusters: formData.symptom_clusters,
      recurring_fire_sentence: formData.recurring_fire_sentence || null,
      pain_ratings: formData.pain_ratings,
      toc_wait_points: formData.toc_wait_points || null,
      toc_replanning_points: formData.toc_replanning_points || null,
      toc_one_fix_effect: formData.toc_one_fix_effect || null,
      decisions_bottleneck: formData.decisions_bottleneck || null,
      metrics_tracked_today: formData.metrics_tracked_today || null,
    };

    let error;
    if (intakeId) {
      const result = await supabase
        .from("intake_responses")
        .update(intakeData)
        .eq("id", intakeId);
      error = result.error;
    } else {
      const result = await supabase
        .from("intake_responses")
        .insert(intakeData)
        .select()
        .single();
      error = result.error;
      if (result.data) {
        setIntakeId(result.data.id);
      }
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Intake saved",
        description: "Your intake responses have been saved.",
      });
      await refreshCompletionStatus();
    }

    setSaving(false);
  };

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
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Intake</h1>
          <p className="mt-1 text-muted-foreground">
            Capture the signal. Start where it hurts. Stay precise.
          </p>
        </div>

        {/* Recurring Fires */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recurring Fires (Smoke)</CardTitle>
            <CardDescription>What symptoms are you experiencing?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    id={symptom}
                    checked={formData.symptom_clusters.includes(symptom)}
                    onCheckedChange={() => handleSymptomToggle(symptom)}
                  />
                  <Label htmlFor={symptom} className="font-normal">
                    {symptom}
                  </Label>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-4">
              <Label htmlFor="recurring_fire_sentence">
                In one sentence: what problem keeps coming back?
              </Label>
              <Textarea
                id="recurring_fire_sentence"
                placeholder="Example: Jobs start without complete scope, then we scramble, rework, and bill late."
                value={formData.recurring_fire_sentence}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, recurring_fire_sentence: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Pain Ratings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pain Ratings (0–10)</CardTitle>
            <CardDescription>Rate severity by area.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {PAIN_AREAS.map((area) => (
              <div key={area.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-normal">{area.label}</Label>
                  <span className="text-sm font-medium">
                    {formData.pain_ratings[area.key] ?? 0}
                  </span>
                </div>
                <Slider
                  value={[formData.pain_ratings[area.key] ?? 0]}
                  onValueChange={(value) => handlePainRating(area.key, value)}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* TOC Prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Constraint Thinking (TOC)</CardTitle>
            <CardDescription>Help us find the bottleneck.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="toc_wait_points">Where does work wait the longest?</Label>
              <Textarea
                id="toc_wait_points"
                placeholder="Queues, approvals, missing inputs, scheduling gaps, billing triggers."
                value={formData.toc_wait_points}
                onChange={(e) => setFormData((prev) => ({ ...prev, toc_wait_points: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toc_replanning_points">
                What step forces the most re-planning or escalation?
              </Label>
              <Textarea
                id="toc_replanning_points"
                placeholder="Where priorities flip, schedules get rewritten, or leadership gets pulled in."
                value={formData.toc_replanning_points}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, toc_replanning_points: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toc_one_fix_effect">
                If we fixed one bottleneck, what other fires would shrink?
              </Label>
              <Textarea
                id="toc_one_fix_effect"
                placeholder="List downstream symptoms that would reduce."
                value={formData.toc_one_fix_effect}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, toc_one_fix_effect: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Decision Bottlenecks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Decision Bottlenecks + Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decisions_bottleneck">
                What decisions route through one person (or get stuck)?
              </Label>
              <Textarea
                id="decisions_bottleneck"
                placeholder="Example: pricing exceptions, schedule changes, change order approval, job closeout."
                value={formData.decisions_bottleneck}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, decisions_bottleneck: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metrics_tracked_today">
                What do you track today (even if inconsistent)?
              </Label>
              <Textarea
                id="metrics_tracked_today"
                placeholder="Weekly KPIs, reports, dashboards, spreadsheets."
                value={formData.metrics_tracked_today}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, metrics_tracked_today: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save intake
          </Button>
          <Button variant="secondary" onClick={() => navigate("/artifacts")}>
            Next: Artifacts
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
