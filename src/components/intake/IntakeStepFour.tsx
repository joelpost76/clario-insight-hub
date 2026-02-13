import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { IntakeGuidanceCard } from "./IntakeGuidanceCard";
import type { IntakeFormData, ToolEntry } from "@/pages/Intake";

interface IntakeStepFourProps {
  form: UseFormReturn<IntakeFormData>;
}

export function IntakeStepFour({ form }: IntakeStepFourProps) {
  const [toolName, setToolName] = useState("");
  const [toolPurpose, setToolPurpose] = useState("");
  const tools = form.watch("tools_list");

  const addTool = () => {
    const name = toolName.trim();
    if (!name) return;
    const current = form.getValues("tools_list");
    const entry: ToolEntry = { name, ...(toolPurpose.trim() ? { purpose: toolPurpose.trim() } : {}) };
    form.setValue("tools_list", [...current, entry], { shouldDirty: true });
    setToolName("");
    setToolPurpose("");
  };

  const removeTool = (index: number) => {
    const current = form.getValues("tools_list");
    form.setValue(
      "tools_list",
      current.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  return (
    <div className="space-y-6">
      <IntakeGuidanceCard title="Decisions, tools, and metrics">
        Understanding who holds decision-making power reveals hidden bottlenecks. The tool inventory shows where data lives (and gets duplicated). Current metrics — even imperfect ones — tell us what visibility exists today.
      </IntakeGuidanceCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Decision Bottlenecks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="decisions_bottleneck">
              What decisions route through one person (or get stuck)?
            </Label>
            <Textarea
              id="decisions_bottleneck"
              placeholder="Example: pricing exceptions, schedule changes, change order approval, job closeout."
              rows={4}
              {...form.register("decisions_bottleneck")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tool Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Tool name (e.g. Procore, Excel)"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTool())}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Purpose (optional)"
                value={toolPurpose}
                onChange={(e) => setToolPurpose(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTool())}
              />
            </div>
            <Button type="button" variant="outline" size="icon" onClick={addTool} disabled={!toolName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {tools.length > 0 && (
            <div className="space-y-2">
              {tools.map((tool, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{tool.name}</span>
                    {tool.purpose && (
                      <span className="text-muted-foreground"> — {tool.purpose}</span>
                    )}
                  </span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeTool(i)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="metrics_tracked_today">
              What do you track today (even if inconsistent)?
            </Label>
            <Textarea
              id="metrics_tracked_today"
              placeholder="Weekly KPIs, reports, dashboards, spreadsheets."
              rows={4}
              {...form.register("metrics_tracked_today")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
