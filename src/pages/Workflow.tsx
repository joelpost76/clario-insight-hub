import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Workflow as WorkflowIcon } from "lucide-react";

interface WorkflowStep {
  id: string;
  stepName: string;
  owner: string;
  description: string;
  handoffTo: string;
  queueWait: string;
  reworkLoop: string;
}

export default function Workflow() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    stepName: "",
    owner: "",
    description: "",
    handoffTo: "",
    queueWait: "",
    reworkLoop: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    if (!formData.stepName.trim()) {
      toast({
        title: "Step name required",
        description: "Please enter a step name.",
        variant: "destructive",
      });
      return;
    }

    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      ...formData,
    };

    setSteps((prev) => [...prev, newStep]);
    setFormData({
      stepName: "",
      owner: "",
      description: "",
      handoffTo: "",
      queueWait: "",
      reworkLoop: "",
    });
    setShowForm(false);
    toast({
      title: "Step added",
      description: `"${newStep.stepName}" has been added.`,
    });
  };

  const handleDelete = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    toast({
      title: "Step removed",
      description: "The workflow step has been removed.",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl animate-fade-in space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Workflow Capture</h1>
            <p className="mt-1 text-muted-foreground">
              Map each step, handoff, queue, and rework loop. This is where constraints hide.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Step
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">New Workflow Step</CardTitle>
              <CardDescription>
                Capture what happens, who does it, and where work waits or loops back.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stepName">Step name</Label>
                  <Input
                    id="stepName"
                    placeholder="e.g., Review proposal"
                    value={formData.stepName}
                    onChange={(e) => handleChange("stepName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner">Owner / role</Label>
                  <Input
                    id="owner"
                    placeholder="Who performs this step?"
                    value={formData.owner}
                    onChange={(e) => handleChange("owner", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">What happens in this step?</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the work performed..."
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="handoffTo">Handoff to</Label>
                  <Input
                    id="handoffTo"
                    placeholder="Next person/team"
                    value={formData.handoffTo}
                    onChange={(e) => handleChange("handoffTo", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="queueWait">Queue / wait time</Label>
                  <Input
                    id="queueWait"
                    placeholder="e.g., 2-3 days typical"
                    value={formData.queueWait}
                    onChange={(e) => handleChange("queueWait", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Where does work wait before this step?
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reworkLoop">Rework loop?</Label>
                  <Input
                    id="reworkLoop"
                    placeholder="e.g., Back to Step 2"
                    value={formData.reworkLoop}
                    onChange={(e) => handleChange("reworkLoop", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Does this step ever send work backwards?
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>Add Step</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {steps.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <WorkflowIcon className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                No workflow steps yet. Map the actual work sequence, including waits and rework.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <Card key={step.id}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{step.stepName}</p>
                        <p className="text-sm text-muted-foreground">Owner: {step.owner || "—"}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(step.id)}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {step.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-4 text-xs">
                      {step.handoffTo && (
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">Handoff:</span> {step.handoffTo}
                        </span>
                      )}
                      {step.queueWait && (
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">Queue:</span> {step.queueWait}
                        </span>
                      )}
                      {step.reworkLoop && (
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">Rework:</span> {step.reworkLoop}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
