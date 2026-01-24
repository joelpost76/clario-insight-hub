import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Workflow as WorkflowIcon, Loader2 } from "lucide-react";
import { WorkflowMap, WorkflowStep, WorkflowHandoff, WorkflowQueue, WorkflowReworkLoop } from "@/types/database";

export default function Workflow() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspaceId, refreshCompletionStatus } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowMap[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    workflow_name: "",
    steps: [{ step_name: "", owner_role: "", tool: "", inputs_required: "" }],
    handoffs: [{ from_step: "", to_step: "", missing_inputs_common: "" }],
    queues: [{ where_work_waits: "", typical_delay: "" }],
    rework_loops: [{ loop_name: "", trigger: "", frequency: "" as "" | "daily" | "weekly" | "monthly" | "rare" }],
  });

  useEffect(() => {
    if (workspaceId) {
      loadWorkflows();
    }
  }, [workspaceId]);

  const loadWorkflows = async () => {
    if (!workspaceId) return;
    
    const { data, error } = await supabase
      .from("workflow_maps")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (data) {
      setWorkflows(data as unknown as WorkflowMap[]);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.workflow_name.trim()) {
      toast({
        title: "Workflow name required",
        description: "Please enter a workflow name.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const steps: WorkflowStep[] = formData.steps
      .filter((s) => s.step_name.trim())
      .map((s) => ({
        step_name: s.step_name,
        owner_role: s.owner_role || undefined,
        tool: s.tool || undefined,
        inputs_required: s.inputs_required ? s.inputs_required.split(",").map((i) => i.trim()).filter(Boolean) : undefined,
      }));

    const handoffs: WorkflowHandoff[] = formData.handoffs
      .filter((h) => h.from_step.trim() && h.to_step.trim())
      .map((h) => ({
        from_step: h.from_step,
        to_step: h.to_step,
        missing_inputs_common: h.missing_inputs_common ? h.missing_inputs_common.split(",").map((i) => i.trim()).filter(Boolean) : undefined,
      }));

    const queues: WorkflowQueue[] = formData.queues
      .filter((q) => q.where_work_waits.trim())
      .map((q) => ({
        where_work_waits: q.where_work_waits,
        typical_delay: q.typical_delay ? parseInt(q.typical_delay) : undefined,
      }));

    const rework_loops: WorkflowReworkLoop[] = formData.rework_loops
      .filter((r) => r.loop_name.trim())
      .map((r) => ({
        loop_name: r.loop_name,
        trigger: r.trigger || undefined,
        frequency: r.frequency || undefined,
      }));

    const insertData = {
      workspace_id: workspaceId!,
      workflow_name: formData.workflow_name,
      steps: steps.length > 0 ? JSON.parse(JSON.stringify(steps)) : null,
      handoffs: handoffs.length > 0 ? JSON.parse(JSON.stringify(handoffs)) : null,
      queues: queues.length > 0 ? JSON.parse(JSON.stringify(queues)) : null,
      rework_loops: rework_loops.length > 0 ? JSON.parse(JSON.stringify(rework_loops)) : null,
    };

    const { data, error } = await supabase
      .from("workflow_maps")
      .insert(insertData as any)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Workflow added",
        description: `"${formData.workflow_name}" has been added.`,
      });
      setWorkflows((prev) => [data as unknown as WorkflowMap, ...prev]);
      resetForm();
      setShowForm(false);
      await refreshCompletionStatus();
    }

    setSaving(false);
  };

  const resetForm = () => {
    setFormData({
      workflow_name: "",
      steps: [{ step_name: "", owner_role: "", tool: "", inputs_required: "" }],
      handoffs: [{ from_step: "", to_step: "", missing_inputs_common: "" }],
      queues: [{ where_work_waits: "", typical_delay: "" }],
      rework_loops: [{ loop_name: "", trigger: "", frequency: "" }],
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("workflow_maps")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      toast({
        title: "Workflow removed",
        description: "The workflow has been removed.",
      });
      await refreshCompletionStatus();
    }
  };

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { step_name: "", owner_role: "", tool: "", inputs_required: "" }],
    }));
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      setFormData((prev) => ({
        ...prev,
        steps: prev.steps.filter((_, i) => i !== index),
      }));
    }
  };

  const updateStep = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) => (i === index ? { ...step, [field]: value } : step)),
    }));
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
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Workflow Capture</h1>
            <p className="mt-1 text-muted-foreground">
              Map how work actually runs. Capture steps, handoffs, waits, and rework loops.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Workflow
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">New Workflow Map</CardTitle>
              <CardDescription>
                This is where the constraint shows itself.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="workflow_name">Workflow name *</Label>
                <Input
                  id="workflow_name"
                  placeholder="e.g., Job Delivery Process"
                  value={formData.workflow_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, workflow_name: e.target.value }))}
                />
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Steps</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addStep}>
                    Add step
                  </Button>
                </div>
                {formData.steps.map((step, index) => (
                  <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-4">
                    <Input
                      placeholder="Step name"
                      value={step.step_name}
                      onChange={(e) => updateStep(index, "step_name", e.target.value)}
                    />
                    <Input
                      placeholder="Owner role"
                      value={step.owner_role}
                      onChange={(e) => updateStep(index, "owner_role", e.target.value)}
                    />
                    <Input
                      placeholder="Tool used"
                      value={step.tool}
                      onChange={(e) => updateStep(index, "tool", e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Inputs (comma-sep)"
                        value={step.inputs_required}
                        onChange={(e) => updateStep(index, "inputs_required", e.target.value)}
                      />
                      {formData.steps.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeStep(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Handoffs */}
              <div className="space-y-3">
                <Label>Handoffs</Label>
                {formData.handoffs.map((handoff, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-3">
                    <Input
                      placeholder="From step"
                      value={handoff.from_step}
                      onChange={(e) => {
                        const newHandoffs = [...formData.handoffs];
                        newHandoffs[index].from_step = e.target.value;
                        setFormData((prev) => ({ ...prev, handoffs: newHandoffs }));
                      }}
                    />
                    <Input
                      placeholder="To step"
                      value={handoff.to_step}
                      onChange={(e) => {
                        const newHandoffs = [...formData.handoffs];
                        newHandoffs[index].to_step = e.target.value;
                        setFormData((prev) => ({ ...prev, handoffs: newHandoffs }));
                      }}
                    />
                    <Input
                      placeholder="Missing inputs (comma-sep)"
                      value={handoff.missing_inputs_common}
                      onChange={(e) => {
                        const newHandoffs = [...formData.handoffs];
                        newHandoffs[index].missing_inputs_common = e.target.value;
                        setFormData((prev) => ({ ...prev, handoffs: newHandoffs }));
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Queues */}
              <div className="space-y-3">
                <Label>Queues / Waits</Label>
                {formData.queues.map((queue, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Where work waits"
                      value={queue.where_work_waits}
                      onChange={(e) => {
                        const newQueues = [...formData.queues];
                        newQueues[index].where_work_waits = e.target.value;
                        setFormData((prev) => ({ ...prev, queues: newQueues }));
                      }}
                    />
                    <Input
                      placeholder="Typical delay (days)"
                      type="number"
                      value={queue.typical_delay}
                      onChange={(e) => {
                        const newQueues = [...formData.queues];
                        newQueues[index].typical_delay = e.target.value;
                        setFormData((prev) => ({ ...prev, queues: newQueues }));
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Rework Loops */}
              <div className="space-y-3">
                <Label>Rework Loops</Label>
                {formData.rework_loops.map((loop, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-3">
                    <Input
                      placeholder="Loop name"
                      value={loop.loop_name}
                      onChange={(e) => {
                        const newLoops = [...formData.rework_loops];
                        newLoops[index].loop_name = e.target.value;
                        setFormData((prev) => ({ ...prev, rework_loops: newLoops }));
                      }}
                    />
                    <Input
                      placeholder="Trigger"
                      value={loop.trigger}
                      onChange={(e) => {
                        const newLoops = [...formData.rework_loops];
                        newLoops[index].trigger = e.target.value;
                        setFormData((prev) => ({ ...prev, rework_loops: newLoops }));
                      }}
                    />
                    <Select
                      value={loop.frequency}
                      onValueChange={(v) => {
                        const newLoops = [...formData.rework_loops];
                        newLoops[index].frequency = v as "" | "daily" | "weekly" | "monthly" | "rare";
                        setFormData((prev) => ({ ...prev, rework_loops: newLoops }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {workflows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <WorkflowIcon className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                No workflow maps yet. Map the actual work sequence, including waits and rework.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{workflow.workflow_name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(workflow.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 text-sm sm:grid-cols-4">
                    <div>
                      <p className="font-medium text-foreground">Steps</p>
                      <p className="mt-1 text-muted-foreground">
                        {workflow.steps?.length ?? 0} defined
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Handoffs</p>
                      <p className="mt-1 text-muted-foreground">
                        {workflow.handoffs?.length ?? 0} identified
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Queues</p>
                      <p className="mt-1 text-muted-foreground">
                        {workflow.queues?.length ?? 0} wait points
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Rework Loops</p>
                      <p className="mt-1 text-muted-foreground">
                        {workflow.rework_loops?.length ?? 0} loops
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button variant="secondary" onClick={() => navigate("/baseline")}>
            Next: Flow Baseline
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
