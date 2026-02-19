import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function RPEInit() {
  const { clientId } = useParams<{ clientId: string }>();
  const { workspaceId } = useWorkspace();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId || !workspaceId) return;

    async function init() {
      try {
        // Check for an existing in-progress RPE assessment for this client
        const { data: existing } = await supabase
          .from("assessments")
          .select("id, is_complete, current_step")
          .eq("client_id", clientId)
          .eq("workspace_id", workspaceId)
          .eq("module_type", "rpe")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          // Resume existing
          navigate(`/rpe/assessment/${existing.id}/step/${existing.current_step}`, { replace: true });
          return;
        }

        // Create new assessment record
        const { data: newRec, error: createErr } = await supabase
          .from("assessments")
          .insert({
            client_id: clientId,
            workspace_id: workspaceId,
            module_type: "rpe",
            current_step: 1,
            is_complete: false,
            status: "in_progress",
          })
          .select("id")
          .single();

        if (createErr) throw createErr;
        navigate(`/rpe/assessment/${newRec.id}/step/1`, { replace: true });
      } catch (e: any) {
        setError(e.message ?? "Failed to start RPE assessment");
      }
    }

    init();
  }, [clientId, workspaceId, navigate]);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: "#C0392B", marginBottom: 16 }}>{error}</p>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "10px 24px", background: "#4A5C3A", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}>
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #4A5C3A", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }}/>
        <p style={{ color: "#6B7A67", fontSize: 14 }}>Starting RPE Assessment…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
