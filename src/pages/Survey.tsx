import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Link as LinkIcon, Copy } from "lucide-react";

export default function Survey() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspaceId, refreshCompletionStatus } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    share_link: "",
    sent_at: "",
    response_count: "",
    burnout_risk_avg: "",
    themes: "",
  });

  useEffect(() => {
    if (workspaceId) {
      loadSurvey();
    }
  }, [workspaceId]);

  const loadSurvey = async () => {
    if (!workspaceId) return;
    
    const { data, error } = await supabase
      .from("surveys")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (data) {
      setSurveyId(data.id);
      setFormData({
        share_link: data.share_link ?? "",
        sent_at: data.sent_at ?? "",
        response_count: data.response_count?.toString() ?? "",
        burnout_risk_avg: data.burnout_risk_avg?.toString() ?? "",
        themes: (data.themes as string[])?.join(", ") ?? "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!workspaceId) return;

    setSaving(true);

    const surveyData = {
      workspace_id: workspaceId,
      share_link: formData.share_link || null,
      sent_at: formData.sent_at || null,
      response_count: formData.response_count ? parseInt(formData.response_count) : 0,
      burnout_risk_avg: formData.burnout_risk_avg ? parseFloat(formData.burnout_risk_avg) : null,
      themes: formData.themes ? formData.themes.split(",").map((t) => t.trim()).filter(Boolean) : null,
    };

    let error;
    if (surveyId) {
      const result = await supabase
        .from("surveys")
        .update(surveyData)
        .eq("id", surveyId);
      error = result.error;
    } else {
      const result = await supabase
        .from("surveys")
        .insert(surveyData)
        .select()
        .single();
      error = result.error;
      if (result.data) {
        setSurveyId(result.data.id);
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
        title: "Survey saved",
        description: "Survey settings have been saved.",
      });
      await refreshCompletionStatus();
    }

    setSaving(false);
  };

  const copyToClipboard = () => {
    if (formData.share_link) {
      navigator.clipboard.writeText(formData.share_link);
      toast({
        title: "Copied",
        description: "Survey link copied to clipboard.",
      });
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
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Survey</h1>
          <p className="mt-1 text-muted-foreground">
            Symptom Snapshot. Short pulse. We use it to spot patterns and burnout risk signals.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Share Link</CardTitle>
            <CardDescription>
              The survey link to share with the team. This can be an external survey tool link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="https://forms.google.com/... or similar"
                  value={formData.share_link}
                  onChange={(e) => setFormData((prev) => ({ ...prev, share_link: e.target.value }))}
                  className="pl-10"
                />
              </div>
              {formData.share_link && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sent_at">Sent date (optional)</Label>
              <Input
                id="sent_at"
                type="date"
                value={formData.sent_at}
                onChange={(e) => setFormData((prev) => ({ ...prev, sent_at: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Summary</CardTitle>
            <CardDescription>
              Track responses and key metrics from the survey.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="response_count">Response count</Label>
                <Input
                  id="response_count"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.response_count}
                  onChange={(e) => setFormData((prev) => ({ ...prev, response_count: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="burnout_risk_avg">Burnout risk avg (0–10)</Label>
                <Input
                  id="burnout_risk_avg"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  placeholder="e.g., 6.5"
                  value={formData.burnout_risk_avg}
                  onChange={(e) => setFormData((prev) => ({ ...prev, burnout_risk_avg: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="themes">Themes (comma-separated)</Label>
              <Input
                id="themes"
                placeholder="missing inputs, rework, priority flips"
                value={formData.themes}
                onChange={(e) => setFormData((prev) => ({ ...prev, themes: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save survey
          </Button>
          <Button variant="secondary" onClick={() => navigate("/sipoc")}>
            Next: SIPOC
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
