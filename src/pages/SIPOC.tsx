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
import { Plus, Trash2, GitBranch } from "lucide-react";

interface SIPOCRecord {
  id: string;
  processName: string;
  suppliers: string;
  inputs: string;
  process: string;
  outputs: string;
  customers: string;
}

export default function SIPOC() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<SIPOCRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    processName: "",
    suppliers: "",
    inputs: "",
    process: "",
    outputs: "",
    customers: "",
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
    if (!formData.processName.trim()) {
      toast({
        title: "Process name required",
        description: "Please enter a process name.",
        variant: "destructive",
      });
      return;
    }

    const newRecord: SIPOCRecord = {
      id: crypto.randomUUID(),
      ...formData,
    };

    setRecords((prev) => [...prev, newRecord]);
    setFormData({
      processName: "",
      suppliers: "",
      inputs: "",
      process: "",
      outputs: "",
      customers: "",
    });
    setShowForm(false);
    toast({
      title: "SIPOC added",
      description: `"${newRecord.processName}" has been added.`,
    });
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast({
      title: "SIPOC removed",
      description: "The record has been removed.",
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
      <div className="mx-auto max-w-5xl animate-fade-in space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">SIPOC</h1>
            <p className="mt-1 text-muted-foreground">
              Map your core workflows. At least one SIPOC is required for completion.
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
                SIPOC = Suppliers, Inputs, Process, Outputs, Customers. This structures how work flows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="processName">Process name</Label>
                <Input
                  id="processName"
                  placeholder="e.g., Client Onboarding"
                  value={formData.processName}
                  onChange={(e) => handleChange("processName", e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="suppliers">Suppliers</Label>
                  <Textarea
                    id="suppliers"
                    placeholder="Who provides inputs? (people, teams, systems)"
                    rows={2}
                    value={formData.suppliers}
                    onChange={(e) => handleChange("suppliers", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inputs">Inputs</Label>
                  <Textarea
                    id="inputs"
                    placeholder="What do they provide? (data, materials, requests)"
                    rows={2}
                    value={formData.inputs}
                    onChange={(e) => handleChange("inputs", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="process">Process (high-level steps)</Label>
                <Textarea
                  id="process"
                  placeholder="List the 3-7 main steps in this process..."
                  rows={3}
                  value={formData.process}
                  onChange={(e) => handleChange("process", e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="outputs">Outputs</Label>
                  <Textarea
                    id="outputs"
                    placeholder="What does this process produce?"
                    rows={2}
                    value={formData.outputs}
                    onChange={(e) => handleChange("outputs", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customers">Customers</Label>
                  <Textarea
                    id="customers"
                    placeholder="Who receives the outputs?"
                    rows={2}
                    value={formData.customers}
                    onChange={(e) => handleChange("customers", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>Add SIPOC</Button>
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
                    <CardTitle className="text-lg">{record.processName}</CardTitle>
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
                      <p className="mt-1 text-muted-foreground">{record.suppliers || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Inputs</p>
                      <p className="mt-1 text-muted-foreground">{record.inputs || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Process</p>
                      <p className="mt-1 text-muted-foreground">{record.process || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Outputs</p>
                      <p className="mt-1 text-muted-foreground">{record.outputs || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Customers</p>
                      <p className="mt-1 text-muted-foreground">{record.customers || "—"}</p>
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
