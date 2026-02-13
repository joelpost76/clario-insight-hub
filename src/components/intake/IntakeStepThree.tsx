import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IntakeGuidanceCard } from "./IntakeGuidanceCard";
import type { IntakeFormData } from "@/pages/Intake";

interface IntakeStepThreeProps {
  form: UseFormReturn<IntakeFormData>;
}

export function IntakeStepThree({ form }: IntakeStepThreeProps) {
  return (
    <div className="space-y-6">
      <IntakeGuidanceCard title="Theory of Constraints thinking">
        These questions help us find the single constraint that limits the whole system. Don't list everything — focus on the one place where fixing it would unlock the most downstream improvement.
      </IntakeGuidanceCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Constraint Thinking (TOC)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="toc_wait_points">Where does work wait the longest?</Label>
            <Textarea
              id="toc_wait_points"
              placeholder="Queues, approvals, missing inputs, scheduling gaps, billing triggers."
              rows={4}
              {...form.register("toc_wait_points")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toc_replanning_points">
              What step forces the most re-planning or escalation?
            </Label>
            <Textarea
              id="toc_replanning_points"
              placeholder="Where priorities flip, schedules get rewritten, or leadership gets pulled in."
              rows={4}
              {...form.register("toc_replanning_points")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toc_one_fix_effect">
              If we fixed one bottleneck, what other fires would shrink?
            </Label>
            <Textarea
              id="toc_one_fix_effect"
              placeholder="List downstream symptoms that would reduce."
              rows={4}
              {...form.register("toc_one_fix_effect")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
