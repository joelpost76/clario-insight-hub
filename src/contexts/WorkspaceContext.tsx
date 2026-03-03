import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Workspace, CompletionStatus, AppRole } from "@/types/database";

const WORKSPACE_STORAGE_KEY = "selected_workspace_id";

interface WorkspaceWithAccount extends Workspace {
  account_name?: string;
}

interface WorkspaceContextType {
  user: User | null;
  session: Session | null;
  workspace: WorkspaceWithAccount | null;
  workspaceId: string | null;
  userRole: AppRole | null;
  loading: boolean;
  completionStatus: CompletionStatus;
  availableWorkspaces: WorkspaceWithAccount[];
  refreshWorkspace: () => Promise<void>;
  refreshCompletionStatus: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceWithAccount | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<WorkspaceWithAccount[]>([]);
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
      // Fetch user role and ALL workspace memberships in parallel
      const [roleResult, membershipsResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", userId),
      ]);

      // Set user role
      if (roleResult.data?.role) {
        setUserRole(roleResult.data.role as AppRole);
      } else {
        setUserRole(null);
      }

      // Handle workspace memberships
      const workspaceIds = membershipsResult.data?.map((m) => m.workspace_id) ?? [];
      
      if (workspaceIds.length === 0) {
        setWorkspaceId(null);
        setWorkspace(null);
        setAvailableWorkspaces([]);
        return;
      }

      // Fetch all workspaces with account names
      const { data: workspacesData, error: workspacesError } = await supabase
        .from("workspaces")
        .select("*, accounts(name)")
        .in("id", workspaceIds);

      if (workspacesError) {
        console.error("Failed to load workspaces", workspacesError);
        setWorkspace(null);
        setAvailableWorkspaces([]);
        return;
      }

      // Transform to include account_name
      const workspacesWithAccount: WorkspaceWithAccount[] = (workspacesData || []).map((ws: any) => ({
        ...ws,
        account_name: ws.accounts?.name,
      }));

      setAvailableWorkspaces(workspacesWithAccount);

      // Check for persisted workspace selection
      const storedWorkspaceId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      let selectedWsId = storedWorkspaceId && workspaceIds.includes(storedWorkspaceId)
        ? storedWorkspaceId
        : workspaceIds[0];

      setWorkspaceId(selectedWsId);
      
      const selectedWorkspace = workspacesWithAccount.find((ws) => ws.id === selectedWsId) || null;
      setWorkspace(selectedWorkspace);
      
      // Persist the selection
      if (selectedWsId) {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, selectedWsId);
      }
    } catch (err) {
      console.error("Failed to fetch user workspace data", err);
      setUserRole(null);
      setWorkspaceId(null);
      setWorkspace(null);
      setAvailableWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = async (newWorkspaceId: string) => {
    // Check if workspace is in the user's available workspaces (member)
    const targetWorkspace = availableWorkspaces.find((ws) => ws.id === newWorkspaceId);
    
    if (targetWorkspace) {
      setWorkspaceId(newWorkspaceId);
      setWorkspace(targetWorkspace);
      localStorage.setItem(WORKSPACE_STORAGE_KEY, newWorkspaceId);
      navigate("/dashboard");
      return;
    }

    // Admin override: fetch any workspace directly from DB
    if (userRole === "unburnt_admin") {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*, accounts(name)")
        .eq("id", newWorkspaceId)
        .maybeSingle();

      if (error || !data) {
        console.error("Failed to fetch workspace for admin override", error);
        return;
      }

      const wsWithAccount: WorkspaceWithAccount = {
        ...(data as any),
        account_name: (data as any).accounts?.name,
      };

      setWorkspaceId(newWorkspaceId);
      setWorkspace(wsWithAccount);
      localStorage.setItem(WORKSPACE_STORAGE_KEY, newWorkspaceId);
      navigate("/dashboard");
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
        availableWorkspaces,
        refreshWorkspace,
        refreshCompletionStatus,
        switchWorkspace,
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
