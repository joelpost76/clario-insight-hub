import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScopeCreepProvider, useScopeCreep } from "@/contexts/ScopeCreepContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";

// ─── /scope-creep/:clientId ───────────────────────────────────────────────────
// Creates a new assessment and redirects to the wizard

function ScopeCreepInitInner() {
  const { clientId } = useParams<{ clientId: string }>();
  const { workspaceId } = useWorkspace();
  const { createAssessment, error } = useScopeCreep();
  const navigate = useNavigate();

  useEffect(() => {
    if (clientId && workspaceId) {
      createAssessment(clientId, workspaceId).then((id) => {
        navigate(`/scope-creep/assessment/${id}/step/1`, { replace: true });
      }).catch(() => {
        // error is set in context
      });
    }
  }, [clientId, workspaceId]);

  if (error) {
    return (
      <AppLayout>
        <div style={{ padding: 40, textAlign: "center" }}>
          <p style={{ color: "#C0392B", fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>{error}</p>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "10px 20px", background: "#4A5C3A", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Back to Hub
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #4A5C3A", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B7A67", fontSize: 14 }}>Creating assessment…</p>
        </div>
      </div>
    </AppLayout>
  );
}

export default function ScopeCreepInit() {
  return (
    <ScopeCreepProvider>
      <ScopeCreepInitInner />
    </ScopeCreepProvider>
  );
}
