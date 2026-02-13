import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { IntakeProgressBar } from "@/components/intake/IntakeProgressBar";
import { IntakeStepOne } from "@/components/intake/IntakeStepOne";
import { IntakeStepTwo } from "@/components/intake/IntakeStepTwo";
import { IntakeStepThree } from "@/components/intake/IntakeStepThree";
import { IntakeStepFour } from "@/components/intake/IntakeStepFour";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface ToolEntry {
  name: string;
  purpose?: string;
}

export interface IntakeFormData {
  symptom_clusters: string[];
  recurring_fire_sentence: string;
  pain_ratings: Record<string, number>;
  toc_wait_points: string;
  toc_replanning_points: string;
  toc_one_fix_effect: string;
  decisions_bottleneck: string;
  metrics_tracked_today: string;
  tools_list: ToolEntry[];
}

const defaultValues: IntakeFormData = {
  symptom_clusters: [],
  recurring_fire_sentence: "",
  pain_ratings: {},
  toc_wait_points: "",
  toc_replanning_points: "",
  toc_one_fix_effect: "",
  decisions_bottleneck: "",
  metrics_tracked_today: "",
  tools_list: [],
};

function calculateCompletion(data: IntakeFormData): { percentage: number; missing: string[] } {
  const missing: string[] = [];
  let filled = 0;
  const total = 8;

  if (data.symptom_clusters.length >= 1) filled++;
  else missing.push("At least 1 symptom cluster");

  if (data.recurring_fire_sentence.trim().length >= 20) filled++;
  else missing.push("Recurring fire sentence (20+ chars)");

  const ratedCount = Object.values(data.pain_ratings).filter((v) => v > 0).length;
  if (ratedCount >= 3) filled++;
  else missing.push("At least 3 pain ratings");

  if (data.toc_wait_points.trim().length >= 20) filled++;
  else missing.push("Wait points (20+ chars)");

  if (data.toc_replanning_points.trim().length >= 20) filled++;
  else missing.push("Re-planning points (20+ chars)");

  if (data.toc_one_fix_effect.trim().length >= 20) filled++;
  else missing.push("One-fix effect (20+ chars)");

  if (data.decisions_bottleneck.trim().length >= 20) filled++;
  else missing.push("Decision bottlenecks (20+ chars)");

  if (data.metrics_tracked_today.trim().length >= 20) filled++;
  else missing.push("Metrics tracked today (20+ chars)");

  return { percentage: Math.round((filled / total) * 100), missing };
}

export default function Intake() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspaceId, refreshCompletionStatus } = useWorkspace();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [intakeId, setIntakeId] = useState<string | null>(null);

  const form = useForm<IntakeFormData>({ defaultValues });

  useEffect(() => {
    if (workspaceId) loadIntake();
  }, [workspaceId]);

  const loadIntake = async () => {
    if (!workspaceId) return;
    const { data } = await supabase
      .from("intake_responses")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (data) {
      setIntakeId(data.id);
      form.reset({
        symptom_clusters: (data.symptom_clusters as string[]) ?? [],
        recurring_fire_sentence: data.recurring_fire_sentence ?? "",
        pain_ratings: (data.pain_ratings as Record<string, number>) ?? {},
        toc_wait_points: data.toc_wait_points ?? "",
        toc_replanning_points: data.toc_replanning_points ?? "",
        toc_one_fix_effect: data.toc_one_fix_effect ?? "",
        decisions_bottleneck: data.decisions_bottleneck ?? "",
        metrics_tracked_today: data.metrics_tracked_today ?? "",
        tools_list: (data.tools_list as unknown as ToolEntry[]) ?? [],
      });
    }
    setLoading(false);
  };

  const saveData = useCallback(
    async (isFinal: boolean = false) => {
      if (!workspaceId) return false;

      const values = form.getValues();

      if (isFinal) {
        const { percentage, missing } = calculateCompletion(values);
        if (percentage < 75) {
          toast({
            title: "Intake incomplete",
            description: `${percentage}% complete — need 75%. Missing: ${missing.join(", ")}`,
            variant: "destructive",
          });
          return false;
        }
      }

      setSaving(true);

      const payload = {
        workspace_id: workspaceId,
        symptom_clusters: values.symptom_clusters,
        recurring_fire_sentence: values.recurring_fire_sentence || null,
        pain_ratings: values.pain_ratings as unknown as Record<string, unknown>,
        toc_wait_points: values.toc_wait_points || null,
        toc_replanning_points: values.toc_replanning_points || null,
        toc_one_fix_effect: values.toc_one_fix_effect || null,
        decisions_bottleneck: values.decisions_bottleneck || null,
        metrics_tracked_today: values.metrics_tracked_today || null,
        tools_list: values.tools_list as unknown as null,
      } as any;

      let error;
      if (intakeId) {
        const result = await supabase
          .from("intake_responses")
          .update(payload)
          .eq("id", intakeId);
        error = result.error;
      } else {
        const result = await supabase
          .from("intake_responses")
          .insert(payload)
          .select()
          .single();
        error = result.error;
        if (result.data) setIntakeId(result.data.id);
      }

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setSaving(false);
        return false;
      }

      toast({
        title: isFinal ? "Intake saved" : "Draft saved",
        description: isFinal
          ? "Your intake responses have been saved."
          : "Progress saved. You can come back anytime.",
      });

      await refreshCompletionStatus();
      setSaving(false);
      return true;
    },
    [workspaceId, intakeId, form, toast, refreshCompletionStatus]
  );

  const handleNext = async () => {
    await saveData(false);
    setStep((s) => Math.min(s + 1, 4));
  };

  const handlePrevious = () => setStep((s) => Math.max(s - 1, 1));

  const handleFinalSave = async () => {
    const success = await saveData(true);
    if (success) navigate("/dashboard");
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
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Intake</h1>
            <p className="mt-1 text-muted-foreground">
              Capture the signal. Start where it hurts. Stay precise.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Dashboard
          </Button>
        </div>

        {/* Progress */}
        <IntakeProgressBar currentStep={step} totalSteps={4} />

        {/* Step content */}
        {step === 1 && <IntakeStepOne form={form} />}
        {step === 2 && <IntakeStepTwo form={form} />}
        {step === 3 && <IntakeStepThree form={form} />}
        {step === 4 && <IntakeStepFour form={form} />}

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button variant="outline" onClick={handlePrevious} disabled={step === 1}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <Button
            variant="secondary"
            onClick={() => saveData(false)}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Save draft
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext} disabled={saving}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinalSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-4 w-4" />
              )}
              Save intake
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
