import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Intake() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    whereWorkWaits: "",
    whereRePlanningHappens: "",
    ifWeFixedOneBottleneck: "",
    currentPainPoints: "",
    recentChanges: "",
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

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast({
      title: "Saved",
      description: "Intake has been captured.",
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

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Intake</h1>
          <p className="mt-1 text-muted-foreground">
            Capture the core constraints and bottlenecks. This drives the diagnostic focus.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Constraint Thinking</CardTitle>
            <CardDescription>
              Based on Theory of Constraints: Find where work waits, not where people are busy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whereWorkWaits">Where does work wait?</Label>
              <Textarea
                id="whereWorkWaits"
                placeholder="Describe queues, backlogs, or handoff delays..."
                rows={3}
                value={formData.whereWorkWaits}
                onChange={(e) => handleChange("whereWorkWaits", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Think about where tasks pile up, where approvals stall, where handoffs delay.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whereRePlanningHappens">Where does re-planning happen?</Label>
              <Textarea
                id="whereRePlanningHappens"
                placeholder="When do you have to change course mid-stream?"
                rows={3}
                value={formData.whereRePlanningHappens}
                onChange={(e) => handleChange("whereRePlanningHappens", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Frequent re-planning signals unclear inputs or shifting priorities.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifWeFixedOneBottleneck">
                If we fixed one bottleneck, what would shrink?
              </Label>
              <Textarea
                id="ifWeFixedOneBottleneck"
                placeholder="What metric or pain would improve?"
                rows={3}
                value={formData.ifWeFixedOneBottleneck}
                onChange={(e) => handleChange("ifWeFixedOneBottleneck", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This helps prioritize which constraint to attack first.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Context</CardTitle>
            <CardDescription>
              Additional background that helps us understand the current state.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPainPoints">Current pain points</Label>
              <Textarea
                id="currentPainPoints"
                placeholder="What's causing the most friction today?"
                rows={3}
                value={formData.currentPainPoints}
                onChange={(e) => handleChange("currentPainPoints", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recentChanges">Recent changes</Label>
              <Textarea
                id="recentChanges"
                placeholder="New tools, team changes, process shifts in the last 6 months..."
                rows={2}
                value={formData.recentChanges}
                onChange={(e) => handleChange("recentChanges", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Intake"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
