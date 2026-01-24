import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Workspace, CompletionStatus, AppRole } from "@/types/database";

interface WorkspaceContextType {
  user: User | null;
  session: Session | null;
  workspace: Workspace | null;
  workspaceId: string | null;
  userRole: AppRole | null;
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
  const [userRole, setUserRole] = useState<AppRole | null>(null);
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

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user role and workspace membership in parallel
      const [roleResult, membershipResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle(),
      ]);

      // Set user role
      if (roleResult.data?.role) {
        setUserRole(roleResult.data.role as AppRole);
      } else {
        setUserRole(null);
      }

      // Handle workspace membership
      const wsId = membershipResult.data?.workspace_id ?? null;
      if (!wsId) {
        setWorkspaceId(null);
        setWorkspace(null);
        return;
      }

      setWorkspaceId(wsId);

      // Fetch workspace details
      const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", wsId)
        .maybeSingle();

      if (workspaceError) {
        // Keep workspaceId, but avoid blocking the UI with a stale workspace object
        console.error("Failed to load workspace", workspaceError);
        setWorkspace(null);
        return;
      }

      if (workspaceData) {
        setWorkspace(workspaceData as unknown as Workspace);
      }
    } catch (err) {
      console.error("Failed to fetch user workspace data", err);
      setUserRole(null);
      setWorkspaceId(null);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

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
        setUserRole(null);
        setLoading(false);
        return;
      }

      // When a user signs in, we must re-hydrate role + workspace state.
      setLoading(true);
      void fetchUserData(session.user.id);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      void fetchUserData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        userRole,
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
