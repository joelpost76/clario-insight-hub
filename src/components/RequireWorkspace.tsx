import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Loader2 } from "lucide-react";

interface RequireWorkspaceProps {
  children: ReactNode;
}

export function RequireWorkspace({ children }: RequireWorkspaceProps) {
  const { user, workspaceId, loading } = useWorkspace();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!workspaceId) {
    return <Navigate to="/no-workspace" replace />;
  }

  return <>{children}</>;
}
