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

export default function Kickoff() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    projectName: "",
    scopeDescription: "",
    primaryContact: "",
    expectedOutcomes: "",
    constraints: "",
    startDate: "",
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
    // TODO: Save to database
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast({
      title: "Saved",
      description: "Kickoff setup has been saved.",
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
          <h1 className="text-2xl font-semibold">Kickoff Setup</h1>
          <p className="mt-1 text-muted-foreground">
            Define the scope and expected outcomes for your Clario™ Diagnostic.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Project Details</CardTitle>
            <CardDescription>
              What we need from you: Clear scope boundaries help us focus the diagnostic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project name</Label>
              <Input
                id="projectName"
                placeholder="e.g., Q1 Operations Review"
                value={formData.projectName}
                onChange={(e) => handleChange("projectName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryContact">Primary contact</Label>
              <Input
                id="primaryContact"
                placeholder="Name and role"
                value={formData.primaryContact}
                onChange={(e) => handleChange("primaryContact", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Diagnostic start date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scopeDescription">Scope description</Label>
              <Textarea
                id="scopeDescription"
                placeholder="Describe the process, team, or workflow in scope..."
                rows={3}
                value={formData.scopeDescription}
                onChange={(e) => handleChange("scopeDescription", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Be specific. What's included? What's explicitly out of scope?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedOutcomes">Expected outcomes</Label>
              <Textarea
                id="expectedOutcomes"
                placeholder="What does success look like at the end of 10 days?"
                rows={3}
                value={formData.expectedOutcomes}
                onChange={(e) => handleChange("expectedOutcomes", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraints">Known constraints</Label>
              <Textarea
                id="constraints"
                placeholder="Budget limits, timeline pressures, key dependencies..."
                rows={2}
                value={formData.constraints}
                onChange={(e) => handleChange("constraints", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Why it matters: Understanding constraints helps us prioritize findings.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Kickoff"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
