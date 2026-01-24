import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, GitBranch, Loader2 } from "lucide-react";
import { SIPOC as SIPOCType } from "@/types/database";

export default function SIPOC() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspaceId, refreshCompletionStatus } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<SIPOCType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    workflow_name: "",
    suppliers: "",
    inputs: "",
    process_steps: "",
    outputs: "",
    customers: "",
  });

  useEffect(() => {
    if (workspaceId) {
      loadSIPOCs();
    }
  }, [workspaceId]);

  const loadSIPOCs = async () => {
    if (!workspaceId) return;
    
    const { data, error } = await supabase
      .from("sipocs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (data) {
      setRecords(data as unknown as SIPOCType[]);
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

    const { data, error } = await supabase
      .from("sipocs")
      .insert({
        workspace_id: workspaceId,
        workflow_name: formData.workflow_name,
        suppliers: formData.suppliers ? formData.suppliers.split(",").map((s) => s.trim()).filter(Boolean) : null,
        inputs: formData.inputs ? formData.inputs.split(",").map((s) => s.trim()).filter(Boolean) : null,
        process_steps: formData.process_steps ? formData.process_steps.split(",").map((s) => s.trim()).filter(Boolean) : null,
        outputs: formData.outputs ? formData.outputs.split(",").map((s) => s.trim()).filter(Boolean) : null,
        customers: formData.customers ? formData.customers.split(",").map((s) => s.trim()).filter(Boolean) : null,
      })
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
        title: "SIPOC added",
        description: `"${formData.workflow_name}" has been added.`,
      });
      setRecords((prev) => [data as unknown as SIPOCType, ...prev]);
      setFormData({ workflow_name: "", suppliers: "", inputs: "", process_steps: "", outputs: "", customers: "" });
      setShowForm(false);
      await refreshCompletionStatus();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("sipocs")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      toast({
        title: "SIPOC removed",
        description: "The record has been removed.",
      });
      await refreshCompletionStatus();
    }
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
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">SIPOC</h1>
            <p className="mt-1 text-muted-foreground">
              Suppliers → Inputs → Process → Outputs → Customers. This keeps mapping consistent.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add SIPOC
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">New SIPOC Record</CardTitle>
              <CardDescription>
                Map how work flows through your system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow_name">Workflow name *</Label>
                <Input
                  id="workflow_name"
                  placeholder="Example: Sale → Job setup → Scheduling → Delivery → Billing"
                  value={formData.workflow_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, workflow_name: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="suppliers">Suppliers (comma-separated)</Label>
                  <Textarea
                    id="suppliers"
                    placeholder="Sales, Client, Vendor, Field lead"
                    rows={2}
                    value={formData.suppliers}
                    onChange={(e) => setFormData((prev) => ({ ...prev, suppliers: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inputs">Inputs (comma-separated)</Label>
                  <Textarea
                    id="inputs"
                    placeholder="Scope, drawings, budget, selections, schedule constraints"
                    rows={2}
                    value={formData.inputs}
                    onChange={(e) => setFormData((prev) => ({ ...prev, inputs: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="process_steps">Process steps (comma-separated)</Label>
                <Textarea
                  id="process_steps"
                  placeholder="Handoff, schedule, execute, QC, bill"
                  rows={2}
                  value={formData.process_steps}
                  onChange={(e) => setFormData((prev) => ({ ...prev, process_steps: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="outputs">Outputs (comma-separated)</Label>
                  <Textarea
                    id="outputs"
                    placeholder="Completed work, invoice, closeout package"
                    rows={2}
                    value={formData.outputs}
                    onChange={(e) => setFormData((prev) => ({ ...prev, outputs: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customers">Customers (comma-separated)</Label>
                  <Textarea
                    id="customers"
                    placeholder="Client, finance, ops, warranty/service"
                    rows={2}
                    value={formData.customers}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customers: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add SIPOC
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {records.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <GitBranch className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                No SIPOC records yet. Add at least one to complete this gate.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <Card key={record.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{record.workflow_name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(record.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 text-sm sm:grid-cols-5">
                    <div>
                      <p className="font-medium text-foreground">Suppliers</p>
                      <p className="mt-1 text-muted-foreground">{record.suppliers?.join(", ") || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Inputs</p>
                      <p className="mt-1 text-muted-foreground">{record.inputs?.join(", ") || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Process</p>
                      <p className="mt-1 text-muted-foreground">{record.process_steps?.join(" → ") || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Outputs</p>
                      <p className="mt-1 text-muted-foreground">{record.outputs?.join(", ") || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Customers</p>
                      <p className="mt-1 text-muted-foreground">{record.customers?.join(", ") || "—"}</p>
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
          <Button variant="secondary" onClick={() => navigate("/workflow")}>
            Next: Workflow Capture
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
