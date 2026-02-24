import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientModules, ClientModule, ModuleId } from "@/hooks/useClientModules";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";

// ─── Module icons (shared with Dashboard) ─────────────────────────────────────
const moduleIcons: Record<ModuleId, React.ReactNode> = {
  rpe: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  scope: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
      <path d="M2 12l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  pl: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  cashflow: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v12M5 5h4.5a2.5 2.5 0 010 5H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

// ─── Health Ring ──────────────────────────────────────────────────────────────
function HealthRing({ score, size = 64 }: { score: number | null; size?: number }) {
  if (!score) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", border: "2px dashed var(--hub-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: "var(--hub-text-muted)", fontFamily: "'DM Sans', sans-serif" }}>—</span>
      </div>
    );
  }
  const color = score >= 80 ? "var(--hub-green)" : score >= 60 ? "var(--hub-gold)" : "var(--hub-red)";
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F4EE" strokeWidth="4"/>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size >= 64 ? 18 : 14, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({ module, onRun }: { module: ClientModule; onRun: (mod: ClientModule) => void }) {
  const isLocked = module.status === "locked";
  const isComplete = module.status === "complete";
  const isProgress = module.status === "in_progress";
  const isAvailable = module.status === "available";

  const statusColors = {
    complete:    { bg: "#F0F4EE", border: "#C8D8C0", iconBg: "#E4EDE0" },
    in_progress: { bg: "#FAFDF8", border: "#4A5C3A", iconBg: "#EAF2E4" },
    available:   { bg: "#FFFFFF", border: "#E8EAE6", iconBg: "#F5F5F5" },
    locked:      { bg: "#F8F8F8", border: "#EEEEEE", iconBg: "#F0F0F0" },
  };
  const cfg = statusColors[module.status] ?? statusColors.locked;

  return (
    <div
      onClick={() => !isLocked && onRun(module)}
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 14,
        padding: "20px",
        opacity: isLocked ? 0.45 : 1,
        cursor: isLocked ? "default" : "pointer",
        transition: "all 0.2s ease",
      }}
      className="module-card"
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: cfg.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isLocked ? "#CBD5C8" : "var(--hub-green)",
        }}>
          {moduleIcons[module.id]}
        </div>
        {isComplete && (
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" fill="var(--hub-green)"/>
            <path d="M4 7l2.5 2.5L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {isProgress && (
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--hub-green)", animation: "pulse 2s infinite" }}/>
        )}
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: isLocked ? "#B8BDB6" : "var(--hub-text)", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
        {module.name}
      </div>

      <div style={{
        fontSize: 12,
        color: isComplete || isProgress ? "var(--hub-green)" : "#B8BDB6",
        fontFamily: isComplete ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
        fontWeight: isProgress ? 600 : 400,
        marginBottom: (isAvailable || isProgress) ? 12 : 0,
      }}>
        {isComplete
          ? `Score: ${module.score != null ? Math.round(module.score) : "—"}${module.scoreLabel ? ` · ${module.scoreLabel}` : ""}`
          : isProgress
          ? (module.scoreLabel || "In progress")
          : isAvailable
          ? "Ready to run"
          : "Locked"}
      </div>

      {(isAvailable || isProgress) && (
        <button
          onClick={(e) => { e.stopPropagation(); onRun(module); }}
          className="run-btn"
          style={{
            padding: "6px 14px",
            border: `1.5px solid var(--hub-green)`,
            borderRadius: 8,
            background: "transparent",
            color: "var(--hub-green)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s",
          }}
        >
          {isProgress ? "Resume →" : "Run →"}
        </button>
      )}
    </div>
  );
}

// ─── Client Hub Page ──────────────────────────────────────────────────────────
export default function ClientHub() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ["client-detail", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const { data: modules = [] } = useClientModules(clientId ?? null);

  const healthScore = useMemo(() => {
    const rpe = modules.find((m) => m.id === "rpe" && m.status === "complete");
    return rpe?.score != null ? Math.round(rpe.score) : null;
  }, [modules]);

  const completedCount = modules.filter((m) => m.status === "complete").length;
  const totalActive = modules.filter((m) => m.status !== "locked").length;

  const recentActivity = useMemo(() => {
    return modules
      .filter((m) => m.date && (m.status === "complete" || m.status === "in_progress"))
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
  }, [modules]);

  const recommendedNext = modules.find((m) => m.status === "available" || m.status === "in_progress");

  const handleRun = (mod: ClientModule) => {
    if (!clientId) return;
    if (mod.id === "rpe") {
      navigate(`/rpe/${clientId}`);
    } else if (mod.id === "scope") {
      navigate(`/scope-creep/${clientId}`);
    } else {
      toast(`${mod.name} — Coming Soon`, { description: "This module will be available in the next release." });
    }
  };

  if (clientLoading) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
          <div style={{ fontSize: 14, color: "var(--hub-text-muted)", fontFamily: "'DM Sans', sans-serif" }}>Loading client…</div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 20, color: "var(--hub-text)", margin: "0 0 8px" }}>
            Client not found
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--hub-text-muted)", margin: "0 0 24px" }}>
            This client may have been removed or you don't have access.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ padding: "10px 24px", background: "var(--hub-green)", color: "white", border: "none", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Back to Dashboard
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .module-card:hover:not([style*="opacity: 0.45"]) { box-shadow: 0 4px 16px rgba(0,0,0,0.07); border-color: #C8D8C0 !important; }
        .run-btn:hover { background: var(--hub-green) !important; color: white !important; }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', sans-serif", color: "var(--hub-text)", animation: "fadeIn 0.2s ease" }}>

        {/* Back navigation */}
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 0", marginBottom: 24,
            background: "none", border: "none",
            color: "var(--hub-text-muted)", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            cursor: "pointer", transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--hub-green)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--hub-text-muted)")}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Dashboard
        </button>

        {/* Client header */}
        <div style={{
          background: "#FFFFFF", border: "1.5px solid var(--hub-border)", borderRadius: 16,
          padding: "28px 32px", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: "var(--hub-text)", letterSpacing: "-0.5px", fontFamily: "'DM Sans', sans-serif" }}>
              {client.name}
            </h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {client.industry && (
                <span style={{ fontSize: 12, background: "#F0F4EE", color: "var(--hub-green)", padding: "3px 10px", borderRadius: 20, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                  {client.industry}
                </span>
              )}
              {client.revenue_range && (
                <span style={{ fontSize: 12, color: "var(--hub-text-muted)", fontFamily: "'DM Mono', monospace" }}>
                  {client.revenue_range}
                </span>
              )}
              {client.headcount && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#CBD5C8" }}/>
                  <span style={{ fontSize: 12, color: "var(--hub-text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
                    {client.headcount} employees
                  </span>
                </>
              )}
            </div>
            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
              <div style={{ display: "flex", gap: 3 }}>
                {modules.filter((m) => m.status !== "locked").map((m, i) => (
                  <div key={i} style={{ width: 24, height: 4, borderRadius: 2, background: m.status === "complete" ? "var(--hub-green)" : m.status === "in_progress" ? "var(--hub-gold)" : "#E2E8E0" }}/>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>
                {completedCount}/{totalActive} modules complete
              </span>
            </div>
          </div>
          <HealthRing score={healthScore} size={72} />
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

          {/* Left — Diagnostic Modules */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#9CA89A", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>
              Diagnostic Modules
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {modules.map((mod) => (
                <ModuleCard key={mod.id} module={mod} onRun={handleRun} />
              ))}
            </div>
          </div>

          {/* Right — Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Recommended next */}
            {recommendedNext && (
              <div style={{ background: "#F7FAF5", border: "1px solid #DCE8D4", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--hub-green)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Recommended Next
                </div>
                <div style={{ fontSize: 14, color: "var(--hub-text)", fontWeight: 600, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
                  {recommendedNext.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--hub-text-muted)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                  Based on current diagnostic gaps{client.industry ? ` and industry benchmarks for ${client.industry.toLowerCase()} companies` : ""}.
                </div>
                <button
                  onClick={() => handleRun(recommendedNext)}
                  className="run-btn"
                  style={{
                    marginTop: 12, padding: "8px 16px",
                    border: `1.5px solid var(--hub-green)`,
                    borderRadius: 8, background: "transparent",
                    color: "var(--hub-green)", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {recommendedNext.status === "in_progress" ? "Resume →" : "Start →"}
                </button>
              </div>
            )}

            {/* Recent activity */}
            <div style={{ background: "#FFFFFF", border: "1.5px solid var(--hub-border)", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA89A", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
                Recent Activity
              </div>
              {recentActivity.length === 0 ? (
                <div style={{ fontSize: 13, color: "#B8BDB6", fontFamily: "'DM Sans', sans-serif" }}>No activity yet</div>
              ) : (
                recentActivity.slice(0, 5).map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: m.status === "complete" ? "var(--hub-green)" : "var(--hub-gold)", flexShrink: 0 }}/>
                    <span style={{ fontSize: 13, color: "#4A5048", flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
                      {m.name} {m.status === "complete" ? "completed" : "in progress"}
                    </span>
                    <span style={{ fontSize: 11, color: "#B8BDB6", fontFamily: "'DM Mono', monospace" }}>
                      {new Date(m.date!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
