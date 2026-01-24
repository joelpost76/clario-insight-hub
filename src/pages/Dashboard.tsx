import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileStack, 
  Users, 
  BarChart3, 
  Check, 
  Circle,
  ArrowRight,
  Calendar
} from "lucide-react";

interface GateItem {
  id: string;
  label: string;
  complete: boolean;
  url: string;
}

interface NextAction {
  label: string;
  description: string;
  url: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dayNumber] = useState(1);

  // Placeholder stats - will be populated from database
  const [stats] = useState({
    artifacts: 0,
    interviews: 0,
    surveyResponses: 0,
  });

  const gates: GateItem[] = [
    { id: "kickoff", label: "Kickoff outcomes + scope saved", complete: false, url: "/kickoff" },
    { id: "intake", label: "Intake captured", complete: false, url: "/intake" },
    { id: "artifacts", label: "Artifacts added", complete: false, url: "/artifacts" },
    { id: "interviews", label: "Interview roster created", complete: false, url: "/interviews" },
    { id: "sipoc", label: "SIPOC created", complete: false, url: "/sipoc" },
    { id: "workflow", label: "Workflow captured", complete: false, url: "/workflow" },
    { id: "baseline", label: "Flow baseline started", complete: false, url: "/baseline" },
  ];

  const nextActions: NextAction[] = gates
    .filter((g) => !g.complete)
    .slice(0, 3)
    .map((g) => ({
      label: g.label.split(" ")[0],
      description: g.label,
      url: g.url,
    }));

  const completionStatus = gates.reduce((acc, gate) => {
    acc[gate.url] = gate.complete;
    return acc;
  }, {} as Record<string, boolean>);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <AppLayout completionStatus={completionStatus} dayNumber={dayNumber}>
      <div className="mx-auto max-w-5xl animate-fade-in space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Workspace Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Track your Clario™ Diagnostic progress. Complete each gate to finish on time.
          </p>
        </div>

        {/* Day Counter + Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">Day {dayNumber}</p>
                <p className="text-xs text-muted-foreground">of 10 business days</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                <FileStack className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.artifacts}</p>
                <p className="text-xs text-muted-foreground">Artifacts</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.interviews}</p>
                <p className="text-xs text-muted-foreground">Interviews</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.surveyResponses}</p>
                <p className="text-xs text-muted-foreground">Survey responses</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Completion Gates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Completion Gates</CardTitle>
              <CardDescription>
                Each gate must be passed before the diagnostic completes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {gates.map((gate) => (
                  <li
                    key={gate.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    {gate.complete ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40" />
                    )}
                    <span className={gate.complete ? "text-foreground" : "text-muted-foreground"}>
                      {gate.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Next Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Next Actions</CardTitle>
              <CardDescription>
                What we need from you to keep moving forward.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nextActions.length > 0 ? (
                <ul className="space-y-3">
                  {nextActions.map((action, index) => (
                    <li key={index}>
                      <Button
                        variant="ghost"
                        className="h-auto w-full justify-between p-3 text-left hover:bg-secondary"
                        onClick={() => navigate(action.url)}
                      >
                        <div>
                          <p className="font-medium">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  All gates complete. Ready for review.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
