import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Layers } from "lucide-react";
import type { FlowStabilizationResponses } from "@/types/flowStabilizationTypes";

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

  const set = (key: keyof FlowStabilizationResponses) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setResponses((prev) => ({ ...prev, [key]: e.target.value }));

  const handleGenerate = () => {
    // Placeholder — AI connection will be wired in next iteration
    console.log("Flow Stabilization responses:", responses);
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

        {/* CTA */}
        <div className="flex justify-end pb-8">
          <Button size="lg" onClick={handleGenerate}>
            Generate Stabilization Plan
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
