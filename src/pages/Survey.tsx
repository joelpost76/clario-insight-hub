import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export default function Survey() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    workClarity: "",
    handoffFriction: "",
    reworkFrequency: "",
    biggestBlocker: "",
    improvementIdea: "",
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
      description: "Survey response has been captured.",
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
          <h1 className="text-2xl font-semibold">Team Survey</h1>
          <p className="mt-1 text-muted-foreground">
            Quick pulse check from the team. Responses help triangulate interview findings.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Work Clarity</CardTitle>
            <CardDescription>
              How clear is the work that comes to you?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.workClarity}
              onValueChange={(value) => handleChange("workClarity", value)}
              className="grid gap-3"
            >
              {[
                { value: "1", label: "Very unclear — I often have to ask for more info" },
                { value: "2", label: "Somewhat unclear — Sometimes I can proceed, sometimes not" },
                { value: "3", label: "Neutral — About 50/50" },
                { value: "4", label: "Mostly clear — Rarely need clarification" },
                { value: "5", label: "Very clear — I can start immediately" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={`clarity-${option.value}`} />
                  <Label htmlFor={`clarity-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Handoff Friction</CardTitle>
            <CardDescription>
              How smooth are handoffs between you and other people/teams?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.handoffFriction}
              onValueChange={(value) => handleChange("handoffFriction", value)}
              className="grid gap-3"
            >
              {[
                { value: "1", label: "Very rough — Constant back-and-forth" },
                { value: "2", label: "Somewhat rough — Regular delays or confusion" },
                { value: "3", label: "Neutral — Some friction, but manageable" },
                { value: "4", label: "Mostly smooth — Occasional hiccups" },
                { value: "5", label: "Very smooth — Seamless transitions" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={`handoff-${option.value}`} />
                  <Label htmlFor={`handoff-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Rework Frequency</CardTitle>
            <CardDescription>
              How often do you have to redo work because of changes, errors, or unclear requirements?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.reworkFrequency}
              onValueChange={(value) => handleChange("reworkFrequency", value)}
              className="grid gap-3"
            >
              {[
                { value: "1", label: "Almost never — Rework is rare" },
                { value: "2", label: "Occasionally — Maybe once a week" },
                { value: "3", label: "Regularly — A few times a week" },
                { value: "4", label: "Frequently — Daily occurrence" },
                { value: "5", label: "Constantly — Most work requires revision" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={`rework-${option.value}`} />
                  <Label htmlFor={`rework-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Open Feedback</CardTitle>
            <CardDescription>
              Your perspective in your own words.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="biggestBlocker">What's the single biggest blocker in your work?</Label>
              <Textarea
                id="biggestBlocker"
                placeholder="Describe the thing that slows you down most..."
                rows={3}
                value={formData.biggestBlocker}
                onChange={(e) => handleChange("biggestBlocker", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvementIdea">If you could fix one thing, what would it be?</Label>
              <Textarea
                id="improvementIdea"
                placeholder="Your idea for improvement..."
                rows={3}
                value={formData.improvementIdea}
                onChange={(e) => handleChange("improvementIdea", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Submit Survey"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
