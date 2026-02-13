import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { IntakeGuidanceCard } from "./IntakeGuidanceCard";
import type { IntakeFormData } from "@/pages/Intake";

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

function getRatingColor(value: number): string {
  if (value <= 3) return "bg-green-600 text-white";
  if (value <= 6) return "bg-yellow-500 text-foreground";
  return "bg-destructive text-destructive-foreground";
}

interface IntakeStepTwoProps {
  form: UseFormReturn<IntakeFormData>;
}

export function IntakeStepTwo({ form }: IntakeStepTwoProps) {
  const painRatings = form.watch("pain_ratings");

  const handleRating = (key: string, value: number[]) => {
    const current = form.getValues("pain_ratings");
    form.setValue("pain_ratings", { ...current, [key]: value[0] }, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <IntakeGuidanceCard title="How to rate">
        Rate each area 0–10 based on how much pain it causes right now. 0 = no issues, 10 = critical. Don't aim for precision — go with your gut. The pattern across areas matters more than any single number.
      </IntakeGuidanceCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pain Ratings (0–10)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {PAIN_AREAS.map((area) => {
            const value = painRatings[area.key] ?? 0;
            return (
              <div key={area.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-normal">{area.label}</Label>
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold ${getRatingColor(value)}`}
                  >
                    {value}
                  </span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={(v) => handleRating(area.key, v)}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
