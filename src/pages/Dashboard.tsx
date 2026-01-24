import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  Circle,
  ArrowRight,
  Calendar,
  FileStack,
  Users,
  BarChart3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { workspace, workspaceId, completionStatus } = useWorkspace();

  // Fetch counts for stats
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { artifacts: 0, interviews: 0, surveyResponses: 0 };
      
      const [artifactsRes, interviewsRes, surveyRes] = await Promise.all([
        supabase.from("artifacts").select("id", { count: "exact" }).eq("workspace_id", workspaceId),
        supabase.from("interviews").select("id", { count: "exact" }).eq("workspace_id", workspaceId),
        supabase.from("surveys").select("response_count").eq("workspace_id", workspaceId).maybeSingle(),
      ]);

      return {
        artifacts: artifactsRes.count ?? 0,
        interviews: interviewsRes.count ?? 0,
        surveyResponses: surveyRes.data?.response_count ?? 0,
      };
    },
    enabled: !!workspaceId,
  });

  const gates: GateItem[] = [
    { id: "kickoff", label: "Kickoff outcomes + scope saved", complete: completionStatus.kickoff, url: "/kickoff" },
    { id: "intake", label: "Intake captured", complete: completionStatus.intake, url: "/intake" },
    { id: "artifacts", label: "Artifacts uploaded/linked", complete: completionStatus.artifacts, url: "/artifacts" },
    { id: "interviews", label: "Interview roster created", complete: completionStatus.interviews, url: "/interviews" },
    { id: "survey", label: "Team survey configured", complete: completionStatus.survey, url: "/survey" },
    { id: "sipoc", label: "SIPOC created", complete: completionStatus.sipoc, url: "/sipoc" },
    { id: "workflow", label: "Workflow captured", complete: completionStatus.workflow, url: "/workflow" },
    { id: "baseline", label: "Flow baseline started", complete: completionStatus.baseline, url: "/baseline" },
  ];

  const nextActions: NextAction[] = gates
    .filter((gate) => !gate.complete)
    .slice(0, 3)
    .map((gate) => ({
      label: gate.label.replace(" + ", " and ").replace("saved", "").replace("created", "").replace("captured", "").trim(),
      description: `Complete the ${gate.id} section`,
      url: gate.url,
    }));

  const completedCount = gates.filter((g) => g.complete).length;
  const allComplete = completedCount === gates.length;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Clario™ Diagnostic Workspace
          </h1>
          <p className="mt-1 text-muted-foreground">
            From smoke to source. Then we build the fix.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Day</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workspace?.day_counter ?? 1}</div>
              <p className="text-xs text-muted-foreground">of 10</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Artifacts</CardTitle>
              <FileStack className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.artifacts ?? 0}</div>
              <p className="text-xs text-muted-foreground">uploaded</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.interviews ?? 0}</div>
              <p className="text-xs text-muted-foreground">scheduled</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Survey Responses</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.surveyResponses ?? 0}</div>
              <p className="text-xs text-muted-foreground">received</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Completion Gates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completion Gates</CardTitle>
              <CardDescription>
                {completedCount} of {gates.length} complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gates.map((gate) => (
                  <button
                    key={gate.id}
                    onClick={() => navigate(gate.url)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    {gate.complete ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                    <span className={gate.complete ? "text-foreground" : "text-muted-foreground"}>
                      {gate.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Actions</CardTitle>
              <CardDescription>
                {allComplete ? "All gates complete!" : "Focus on these next"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allComplete ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium">Diagnostic Complete</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    All sections have been completed. Ready for readout.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nextActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto w-full justify-between p-4 text-left"
                      onClick={() => navigate(action.url)}
                    >
                      <div>
                        <p className="font-medium">{action.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Readout Date */}
        {workspace?.readout_date && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-4 py-4">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Readout Scheduled</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(workspace.readout_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
