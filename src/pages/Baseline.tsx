import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, Circle, Loader2 } from "lucide-react";

export default function Baseline() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspaceId, refreshCompletionStatus } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [baselineId, setBaselineId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    wip_count: "",
    throughput_per_week: "",
    lead_time_days: "",
    rework_rate: "",
    billing_cycle_days: "",
    ar_aging_30: "",
    ar_aging_60: "",
    ar_aging_90: "",
    confidence_level: "medium",
  });

  useEffect(() => {
    if (workspaceId) {
      loadBaseline();
    }
  }, [workspaceId]);

  const loadBaseline = async () => {
    if (!workspaceId) return;
    
    const { data, error } = await supabase
      .from("flow_baselines")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (data) {
      setBaselineId(data.id);
      setFormData({
        wip_count: data.wip_count?.toString() ?? "",
        throughput_per_week: data.throughput_per_week?.toString() ?? "",
        lead_time_days: data.lead_time_days?.toString() ?? "",
        rework_rate: data.rework_rate?.toString() ?? "",
        billing_cycle_days: data.billing_cycle_days?.toString() ?? "",
        ar_aging_30: data.ar_aging_30?.toString() ?? "",
        ar_aging_60: data.ar_aging_60?.toString() ?? "",
        ar_aging_90: data.ar_aging_90?.toString() ?? "",
        confidence_level: data.confidence_level ?? "medium",
      });
    }
    setLoading(false);
  };

  const completedFields = [
    formData.wip_count,
    formData.throughput_per_week,
    formData.lead_time_days,
    formData.rework_rate,
    formData.billing_cycle_days,
  ].filter((v) => v.trim() !== "").length;

  const isComplete = completedFields >= 3;

  const handleSave = async () => {
    if (!workspaceId) return;

    if (!isComplete) {
      toast({
        title: "More data needed",
        description: "Please complete at least 3 of the 5 baseline metrics.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const baselineData = {
      workspace_id: workspaceId,
      wip_count: formData.wip_count ? parseInt(formData.wip_count) : null,
      throughput_per_week: formData.throughput_per_week ? parseFloat(formData.throughput_per_week) : null,
      lead_time_days: formData.lead_time_days ? parseFloat(formData.lead_time_days) : null,
      rework_rate: formData.rework_rate ? parseFloat(formData.rework_rate) : null,
      billing_cycle_days: formData.billing_cycle_days ? parseFloat(formData.billing_cycle_days) : null,
      ar_aging_30: formData.ar_aging_30 ? parseFloat(formData.ar_aging_30) : null,
      ar_aging_60: formData.ar_aging_60 ? parseFloat(formData.ar_aging_60) : null,
      ar_aging_90: formData.ar_aging_90 ? parseFloat(formData.ar_aging_90) : null,
      confidence_level: formData.confidence_level,
    };

    let error;
    if (baselineId) {
      const result = await supabase
        .from("flow_baselines")
        .update(baselineData)
        .eq("id", baselineId);
      error = result.error;
    } else {
      const result = await supabase
        .from("flow_baselines")
        .insert(baselineData)
        .select()
        .single();
      error = result.error;
      if (result.data) {
        setBaselineId(result.data.id);
      }
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Baseline saved",
        description: "Flow baseline has been saved.",
      });
      await refreshCompletionStatus();
    }

    setSaving(false);
  };

  const metrics = [
    {
      key: "wip_count",
      label: "Work in Progress (WIP)",
      placeholder: "e.g., 45",
      description: "How many items are currently in flight?",
      type: "number" as const,
    },
    {
      key: "throughput_per_week",
      label: "Throughput",
      placeholder: "e.g., 12",
      description: "How many items complete per week?",
      type: "number" as const,
    },
    {
      key: "lead_time_days",
      label: "Lead Time (days)",
      placeholder: "e.g., 18",
      description: "How long from request to delivery?",
      type: "number" as const,
    },
    {
      key: "rework_rate",
      label: "Rework Rate (%)",
      placeholder: "e.g., 25",
      description: "What percentage of work needs to be redone?",
      type: "number" as const,
    },
    {
      key: "billing_cycle_days",
      label: "Billing Cycle (days)",
      placeholder: "e.g., 42",
      description: "How long from completion to getting paid?",
      type: "number" as const,
    },
  ];

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
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Flow Baseline</h1>
          <p className="mt-1 text-muted-foreground">
            We need rough baselines. Not perfect data. Enough to measure change.
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
          const value = formData[metric.key as keyof typeof formData];
          const hasValue = value.trim() !== "";
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
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor={metric.key}>Current value</Label>
                  <Input
                    id={metric.key}
                    type={metric.type}
                    placeholder={metric.placeholder}
                    value={value}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [metric.key]: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Optional A/R Aging */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">A/R Aging (Optional)</CardTitle>
            <CardDescription>Additional cash flow metrics if available.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ar_aging_30">A/R &gt;30 days</Label>
                <Input
                  id="ar_aging_30"
                  type="number"
                  placeholder="$"
                  value={formData.ar_aging_30}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ar_aging_30: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ar_aging_60">A/R &gt;60 days</Label>
                <Input
                  id="ar_aging_60"
                  type="number"
                  placeholder="$"
                  value={formData.ar_aging_60}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ar_aging_60: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ar_aging_90">A/R &gt;90 days</Label>
                <Input
                  id="ar_aging_90"
                  type="number"
                  placeholder="$"
                  value={formData.ar_aging_90}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ar_aging_90: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confidence Level */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Confidence Level</CardTitle>
            <CardDescription>How confident are you in these numbers?</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.confidence_level}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, confidence_level: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — rough estimates</SelectItem>
                <SelectItem value="medium">Medium — reasonably accurate</SelectItem>
                <SelectItem value="high">High — data-backed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !isComplete}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Baseline
          </Button>
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
