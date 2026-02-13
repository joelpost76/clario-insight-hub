import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IntakeGuidanceCard } from "./IntakeGuidanceCard";
import type { IntakeFormData } from "@/pages/Intake";

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

interface IntakeStepOneProps {
  form: UseFormReturn<IntakeFormData>;
}

export function IntakeStepOne({ form }: IntakeStepOneProps) {
  const symptoms = form.watch("symptom_clusters");

  const handleToggle = (symptom: string) => {
    const current = form.getValues("symptom_clusters");
    const updated = current.includes(symptom)
      ? current.filter((s) => s !== symptom)
      : [...current, symptom];
    form.setValue("symptom_clusters", updated, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <IntakeGuidanceCard title="Why we ask this">
        Symptoms reveal patterns. Checking multiple items helps us see which problems are connected — and where the real constraint hides. Don't overthink it — check what feels true right now.
      </IntakeGuidanceCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Symptom Clusters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {SYMPTOM_OPTIONS.map((symptom) => (
              <div key={symptom} className="flex items-start space-x-3">
                <Checkbox
                  id={symptom}
                  checked={symptoms.includes(symptom)}
                  onCheckedChange={() => handleToggle(symptom)}
                  className="mt-0.5"
                />
                <Label htmlFor={symptom} className="font-normal leading-snug cursor-pointer">
                  {symptom}
                </Label>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t border-border">
            <Label htmlFor="recurring_fire_sentence">
              In one sentence: what problem keeps coming back?
            </Label>
            <Textarea
              id="recurring_fire_sentence"
              placeholder="Example: Jobs start without complete scope, then we scramble, rework, and bill late."
              {...form.register("recurring_fire_sentence")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
