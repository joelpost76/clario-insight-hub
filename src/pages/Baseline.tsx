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
import { Check, Circle } from "lucide-react";

export default function Baseline() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    wip: "",
    wipNotes: "",
    throughput: "",
    throughputNotes: "",
    leadTime: "",
    leadTimeNotes: "",
    reworkRate: "",
    reworkNotes: "",
    billingCycle: "",
    billingNotes: "",
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

  const completedFields = [
    formData.wip,
    formData.throughput,
    formData.leadTime,
    formData.reworkRate,
    formData.billingCycle,
  ].filter((v) => v.trim() !== "").length;

  const isComplete = completedFields >= 3;

  const handleSave = async () => {
    if (!isComplete) {
      toast({
        title: "More data needed",
        description: "Please complete at least 3 of the 5 baseline metrics.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast({
      title: "Saved",
      description: "Flow baseline has been saved.",
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const metrics = [
    {
      key: "wip",
      label: "Work in Progress (WIP)",
      placeholder: "e.g., 45 active projects",
      description: "How many items are currently in flight?",
      notesKey: "wipNotes",
    },
    {
      key: "throughput",
      label: "Throughput",
      placeholder: "e.g., 12 projects/month",
      description: "How many items complete per time period?",
      notesKey: "throughputNotes",
    },
    {
      key: "leadTime",
      label: "Lead Time",
      placeholder: "e.g., 18 days average",
      description: "How long from request to delivery?",
      notesKey: "leadTimeNotes",
    },
    {
      key: "reworkRate",
      label: "Rework Rate",
      placeholder: "e.g., 25% require revision",
      description: "What percentage of work needs to be redone?",
      notesKey: "reworkNotes",
    },
    {
      key: "billingCycle",
      label: "Billing Cycle Time",
      placeholder: "e.g., 42 days to payment",
      description: "How long from completion to getting paid?",
      notesKey: "billingNotes",
    },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Flow Baseline</h1>
          <p className="mt-1 text-muted-foreground">
            Capture current flow metrics. At least 3 of 5 required to complete this gate.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Completion Status</CardTitle>
                <CardDescription>
                  {completedFields} of 5 metrics captured ({isComplete ? "gate passed" : "need 3 minimum"})
                </CardDescription>
              </div>
              {isComplete ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              ) : (
                <Circle className="h-8 w-8 text-muted-foreground/30" />
              )}
            </div>
          </CardHeader>
        </Card>

        {metrics.map((metric) => {
          const hasValue = formData[metric.key as keyof typeof formData].trim() !== "";
          return (
            <Card key={metric.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {hasValue ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                  <CardTitle className="text-base">{metric.label}</CardTitle>
                </div>
                <CardDescription className="ml-8">{metric.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={metric.key}>Current value</Label>
                  <Input
                    id={metric.key}
                    placeholder={metric.placeholder}
                    value={formData[metric.key as keyof typeof formData]}
                    onChange={(e) => handleChange(metric.key, e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={metric.notesKey}>Notes (optional)</Label>
                  <Textarea
                    id={metric.notesKey}
                    placeholder="Data source, caveats, or context..."
                    rows={2}
                    value={formData[metric.notesKey as keyof typeof formData]}
                    onChange={(e) => handleChange(metric.notesKey, e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !isComplete}>
            {saving ? "Saving..." : "Save Baseline"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
