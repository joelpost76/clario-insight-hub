import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Workspace, CompletionStatus } from "@/types/database";

interface WorkspaceContextType {
  user: User | null;
  session: Session | null;
  workspace: Workspace | null;
  workspaceId: string | null;
  loading: boolean;
  completionStatus: CompletionStatus;
  refreshWorkspace: () => Promise<void>;
  refreshCompletionStatus: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    kickoff: false,
    intake: false,
    artifacts: false,
    interviews: false,
    survey: false,
    sipoc: false,
    workflow: false,
    baseline: false,
  });
  const navigate = useNavigate();

  const refreshWorkspace = async () => {
    if (!workspaceId) return;
    
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .maybeSingle();
    
    if (!error && data) {
      setWorkspace(data as unknown as Workspace);
    }
  };

  const refreshCompletionStatus = async () => {
    if (!workspaceId) return;

    // Check each section for completion
    const [
      intakeRes,
      artifactsRes,
      interviewsRes,
      surveyRes,
      sipocRes,
      workflowRes,
      baselineRes,
      workspaceRes,
    ] = await Promise.all([
      supabase.from("intake_responses").select("id").eq("workspace_id", workspaceId).maybeSingle(),
      supabase.from("artifacts").select("id").eq("workspace_id", workspaceId).limit(1),
      supabase.from("interviews").select("id").eq("workspace_id", workspaceId).limit(1),
      supabase.from("surveys").select("id").eq("workspace_id", workspaceId).maybeSingle(),
      supabase.from("sipocs").select("id").eq("workspace_id", workspaceId).limit(1),
      supabase.from("workflow_maps").select("id").eq("workspace_id", workspaceId).limit(1),
      supabase.from("flow_baselines").select("wip_count, throughput_per_week, lead_time_days, rework_rate, billing_cycle_days").eq("workspace_id", workspaceId).maybeSingle(),
      supabase.from("workspaces").select("outcomes_90_day, scope_workflows").eq("id", workspaceId).maybeSingle(),
    ]);

    // Kickoff is complete if outcomes and scope are set
    const kickoffComplete = !!(
      workspaceRes.data?.outcomes_90_day?.length &&
      workspaceRes.data?.scope_workflows?.length
    );

    // Baseline requires at least 3 of 5 metrics
    let baselineComplete = false;
    if (baselineRes.data) {
      const metrics = [
        baselineRes.data.wip_count,
        baselineRes.data.throughput_per_week,
        baselineRes.data.lead_time_days,
        baselineRes.data.rework_rate,
        baselineRes.data.billing_cycle_days,
      ];
      const filledCount = metrics.filter((m) => m !== null && m !== undefined).length;
      baselineComplete = filledCount >= 3;
    }

    setCompletionStatus({
      kickoff: kickoffComplete,
      intake: !!intakeRes.data,
      artifacts: !!(artifactsRes.data && artifactsRes.data.length > 0),
      interviews: !!(interviewsRes.data && interviewsRes.data.length > 0),
      survey: !!surveyRes.data,
      sipoc: !!(sipocRes.data && sipocRes.data.length > 0),
      workflow: !!(workflowRes.data && workflowRes.data.length > 0),
      baseline: baselineComplete,
    });
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        setWorkspace(null);
        setWorkspaceId(null);
        setLoading(false);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user's workspace membership
        setTimeout(() => {
          fetchUserWorkspace(session.user.id);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserWorkspace = async (userId: string) => {
    // Get the user's workspace membership
    const { data: membershipData, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (membershipError || !membershipData) {
      // User has no workspace yet - this is okay for new users
      setLoading(false);
      return;
    }

    const wsId = membershipData.workspace_id;
    setWorkspaceId(wsId);

    // Fetch workspace details
    const { data: workspaceData, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", wsId)
      .maybeSingle();

    if (!workspaceError && workspaceData) {
      setWorkspace(workspaceData as unknown as Workspace);
    }

    setLoading(false);
  };

  // Refresh completion status when workspace changes
  useEffect(() => {
    if (workspaceId) {
      refreshCompletionStatus();
    }
  }, [workspaceId]);

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        session,
        workspace,
        workspaceId,
        loading,
        completionStatus,
        refreshWorkspace,
        refreshCompletionStatus,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
