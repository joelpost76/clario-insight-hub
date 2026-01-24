import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const WORKFLOW_OPTIONS = [
  "Lead intake → Estimate → Sale",
  "Sale → Job setup → Scheduling",
  "Scheduling → Delivery execution",
  "Change orders / Variations",
  "Billing → Collections",
  "Closeout / Handoff",
  "Support / Service tickets",
];

export default function Kickoff() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspace, workspaceId, refreshWorkspace, refreshCompletionStatus } = useWorkspace();
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    outcomes_90_day: [""],
    scope_workflows: [] as string[],
    scope_teams: [""],
    constraints_nonnegotiables: [""],
    start_date: "",
    readout_date: "",
  });

  useEffect(() => {
    if (workspace) {
      setFormData({
        outcomes_90_day: workspace.outcomes_90_day?.length ? workspace.outcomes_90_day : [""],
        scope_workflows: workspace.scope_workflows ?? [],
        scope_teams: workspace.scope_teams?.length ? workspace.scope_teams : [""],
        constraints_nonnegotiables: workspace.constraints_nonnegotiables?.length ? workspace.constraints_nonnegotiables : [""],
        start_date: workspace.start_date ?? "",
        readout_date: workspace.readout_date ?? "",
      });
      setLoading(false);
    } else if (workspaceId) {
      setLoading(false);
    }
  }, [workspace, workspaceId]);

  const handleArrayChange = (field: "outcomes_90_day" | "scope_teams" | "constraints_nonnegotiables", index: number, value: string) => {
    setFormData((prev) => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addArrayItem = (field: "outcomes_90_day" | "scope_teams" | "constraints_nonnegotiables") => {
    const maxItems = field === "outcomes_90_day" ? 5 : 10;
    if (formData[field].length < maxItems) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], ""],
      }));
    }
  };

  const removeArrayItem = (field: "outcomes_90_day" | "scope_teams" | "constraints_nonnegotiables", index: number) => {
    if (formData[field].length > 1) {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    }
  };

  const handleWorkflowToggle = (workflow: string) => {
    setFormData((prev) => ({
      ...prev,
      scope_workflows: prev.scope_workflows.includes(workflow)
        ? prev.scope_workflows.filter((w) => w !== workflow)
        : [...prev.scope_workflows, workflow],
    }));
  };

  const handleSave = async () => {
    if (!workspaceId) return;

    // Validate
    const outcomes = formData.outcomes_90_day.filter((o) => o.trim());
    if (outcomes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Add at least one 90-day outcome.",
        variant: "destructive",
      });
      return;
    }
    if (formData.scope_workflows.length === 0) {
      toast({
        title: "Validation Error",
        description: "Select at least one workflow in scope.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.readout_date) {
      toast({
        title: "Validation Error",
        description: "Readout date is required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("workspaces")
      .update({
        outcomes_90_day: outcomes,
        scope_workflows: formData.scope_workflows,
        scope_teams: formData.scope_teams.filter((t) => t.trim()),
        constraints_nonnegotiables: formData.constraints_nonnegotiables.filter((c) => c.trim()),
        start_date: formData.start_date || null,
        readout_date: formData.readout_date,
      })
      .eq("id", workspaceId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Kickoff saved",
        description: "Your kickoff information has been saved.",
      });
      await refreshWorkspace();
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
          <h1 className="text-2xl font-semibold tracking-tight">Kickoff Setup</h1>
          <p className="mt-1 text-muted-foreground">
            Lock outcomes, scope, and the readout date.
          </p>
        </div>

        {/* 90-Day Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">90-Day Outcomes (Measurable)</CardTitle>
            <CardDescription>List up to 5 outcomes. Be specific and measurable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.outcomes_90_day.map((outcome, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Example: Billing cycle time under 5 days"
                  value={outcome}
                  onChange={(e) => handleArrayChange("outcomes_90_day", index, e.target.value)}
                />
                {formData.outcomes_90_day.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem("outcomes_90_day", index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {formData.outcomes_90_day.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem("outcomes_90_day")}
              >
                Add outcome
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Scope */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scope</CardTitle>
            <CardDescription>Select workflows and teams included in this diagnostic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Workflows in scope</Label>
              <div className="grid gap-2">
                {WORKFLOW_OPTIONS.map((workflow) => (
                  <div key={workflow} className="flex items-center space-x-2">
                    <Checkbox
                      id={workflow}
                      checked={formData.scope_workflows.includes(workflow)}
                      onCheckedChange={() => handleWorkflowToggle(workflow)}
                    />
                    <Label htmlFor={workflow} className="font-normal">
                      {workflow}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Teams in scope</Label>
              {formData.scope_teams.map((team, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Example: Sales, PMs, Finance"
                    value={team}
                    onChange={(e) => handleArrayChange("scope_teams", index, e.target.value)}
                  />
                  {formData.scope_teams.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem("scope_teams", index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem("scope_teams")}
              >
                Add team
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Constraints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Constraints / Non-Negotiables</CardTitle>
            <CardDescription>What can't change right now?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.constraints_nonnegotiables.map((constraint, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Example: No tool changes this quarter"
                  value={constraint}
                  onChange={(e) => handleArrayChange("constraints_nonnegotiables", index, e.target.value)}
                />
                {formData.constraints_nonnegotiables.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem("constraints_nonnegotiables", index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("constraints_nonnegotiables")}
            >
              Add constraint
            </Button>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
            <CardDescription>Set the start and readout dates.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="readout_date">Readout date *</Label>
              <Input
                id="readout_date"
                type="date"
                value={formData.readout_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, readout_date: e.target.value }))}
                required
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
            Save kickoff
          </Button>
          <Button variant="secondary" onClick={() => navigate("/intake")}>
            Next: Intake
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
