import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientModules, ClientModule, ModuleId } from "@/hooks/useClientModules";

const WELCOME_SEEN_PREFIX = "welcome_seen_";

// ─── Module icons (matching wireframe) ───────────────────────────────────────
const moduleIcons: Record<ModuleId, React.ReactNode> = {
  rpe: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  scope: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  pl: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  cashflow: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v12M5 5h4.5a2.5 2.5 0 010 5H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Client {
  id: string;
  workspace_id: string;
  name: string;
  industry: string | null;
  revenue_range: string | null;
  headcount: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Health Ring (exact wireframe) ───────────────────────────────────────────
function HealthRing({ score, size = 48 }: { score: number | null; size?: number }) {
  if (!score) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", border: "2px dashed #E2E8E0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>—</span>
      </div>
    );
  }
  const color = score >= 80 ? "#4A5C3A" : score >= 60 ? "#B8A94A" : "#C0392B";
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F4EE" strokeWidth="3"/>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size >= 48 ? 13 : 11, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Module Pill (2-col card grid style from wireframe) ──────────────────────
function ModulePill({ module }: { module: ClientModule }) {
  const statusConfig: Record<string, { bg: string; border: string }> = {
    complete:    { bg: "#F0F4EE", border: "#C8D8C0" },
    in_progress: { bg: "#FAFDF8", border: "#4A5C3A" },
    available:   { bg: "#FAFAFA", border: "#E8EAE6" },
    locked:      { bg: "#F8F8F8", border: "#EEEEEE" },
  };
  const cfg = statusConfig[module.status] ?? statusConfig.locked;
  const isLocked = module.status === "locked";
  const isAvailable = module.status === "available";
  const iconColor = isLocked || isAvailable ? "#C0C8BC" : "#4A5C3A";

  const shortName: Record<ModuleId, string> = {
    rpe: "RPE Assessment",
    scope: "Scope Creep",
    pl: "P&L Margin",
    cashflow: "Cash Flow",
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 10px",
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 8,
      opacity: isLocked ? 0.5 : 1,
      minWidth: 0,
      cursor: isLocked ? "default" : "pointer",
      transition: "all 0.15s ease",
    }}>
      <div style={{ color: iconColor, flexShrink: 0 }}>
        {moduleIcons[module.id]}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: isLocked ? "#B8BDB6" : "#2C3828", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {shortName[module.id]}
        </div>
        {module.scoreLabel && !isAvailable && (
          <div style={{ fontSize: 10, color: "#4A5C3A", fontFamily: "'DM Mono', monospace", marginTop: 1 }}>
            {module.scoreLabel}
          </div>
        )}
        {module.status === "complete" && module.score != null && !module.scoreLabel && (
          <div style={{ fontSize: 10, color: "#4A5C3A", fontFamily: "'DM Mono', monospace", marginTop: 1 }}>
            {Math.round(module.score)}
          </div>
        )}
        {isAvailable && (
          <div style={{ fontSize: 10, color: "#4A5C3A", fontFamily: "'DM Sans', sans-serif", marginTop: 1, fontWeight: 600 }}>
            Run Module →
          </div>
        )}
      </div>
      {module.status === "in_progress" && (
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4A5C3A", flexShrink: 0, animation: "pulse 2s infinite" }}/>
      )}
    </div>
  );
}

// ─── Client Card ──────────────────────────────────────────────────────────────
function ClientCard({
  client,
  modules,
  healthScore,
  isSelected,
  onClick,
}: {
  client: Client;
  modules: ClientModule[];
  healthScore: number | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  const completedCount = modules.filter((m) => m.status === "complete").length;
  const totalActive = modules.filter((m) => m.status !== "locked").length;

  const lastActivity = useMemo(() => {
    const withDates = modules.filter((m) => m.date);
    if (!withDates.length) return null;
    return withDates.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0].date;
  }, [modules]);

  const lastActivityLabel = lastActivity
    ? new Date(lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div
      className="client-card"
      onClick={onClick}
      style={{
        background: "#FFFFFF",
        border: isSelected ? "1.5px solid #4A5C3A" : "1.5px solid #EEF0EC",
        borderRadius: 16,
        padding: "24px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isSelected ? "0 0 0 4px rgba(74,92,58,0.08), 0 4px 24px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isSelected && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #4A5C3A, #7A9A64)", borderRadius: "16px 16px 0 0" }}/>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1A2018", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.3px" }}>
            {client.name}
          </h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {client.industry && <span style={{ fontSize: 11, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>{client.industry}</span>}
            {client.industry && client.revenue_range && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#CBD5C8", flexShrink: 0 }}/>}
            {client.revenue_range && <span style={{ fontSize: 11, color: "#6B7A67", fontFamily: "'DM Mono', monospace" }}>{client.revenue_range}</span>}
            {client.headcount && <><span style={{ width: 3, height: 3, borderRadius: "50%", background: "#CBD5C8", flexShrink: 0 }}/><span style={{ fontSize: 11, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>{client.headcount} emp.</span></>}
          </div>
        </div>
        <HealthRing score={healthScore} size={48} />
      </div>

      {/* Module grid — 2 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        {modules.map((mod) => (
          <ModulePill key={mod.id} module={mod} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F0F2EE" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {modules.filter((m) => m.status !== "locked").map((m, i) => (
              <div key={i} style={{ width: 16, height: 3, borderRadius: 2, background: m.status === "complete" ? "#4A5C3A" : m.status === "in_progress" ? "#B8A94A" : "#E2E8E0" }}/>
            ))}
          </div>
          <span style={{ fontSize: 11, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>
            {completedCount}/{totalActive} complete
          </span>
        </div>
        {lastActivityLabel && (
          <span style={{ fontSize: 11, color: "#B8BDB6", fontFamily: "'DM Sans', sans-serif" }}>{lastActivityLabel}</span>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card (exact wireframe) ──────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 12, padding: "20px 24px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || "#1A2018", fontFamily: "'DM Mono', monospace", letterSpacing: "-1px", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({
  client,
  modules,
  healthScore,
  onRun,
}: {
  client: Client;
  modules: ClientModule[];
  healthScore: number | null;
  onRun: (mod: ClientModule) => void;
}) {
  const availableNext = modules.find((m) => m.status === "available" || m.status === "in_progress");
  const recentActivity = modules
    .filter((m) => m.date && (m.status === "complete" || m.status === "in_progress"))
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

  return (
    <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 16, overflow: "hidden", position: "sticky", top: 80 }}>
      {/* Header */}
      <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid #F0F2EE" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1A2018", letterSpacing: "-0.3px", fontFamily: "'DM Sans', sans-serif" }}>
            {client.name}
          </h2>
          <HealthRing score={healthScore} size={40} />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {client.industry && (
            <span style={{ fontSize: 11, background: "#F0F4EE", color: "#4A5C3A", padding: "2px 8px", borderRadius: 20, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              {client.industry}
            </span>
          )}
          <span style={{ fontSize: 11, color: "#9CA89A", fontFamily: "'DM Mono', monospace" }}>
            {[client.revenue_range, client.headcount ? `${client.headcount} emp.` : null].filter(Boolean).join(" · ")}
          </span>
        </div>
      </div>

      {/* Module list */}
      <div style={{ padding: "16px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA89A", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
          Diagnostic Modules
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {modules.map((mod) => {
            const isLocked = mod.status === "locked";
            const isComplete = mod.status === "complete";
            const isProgress = mod.status === "in_progress";
            const isAvailable = mod.status === "available";
            return (
              <div
                key={mod.id}
                className="module-row"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px",
                  borderRadius: 9,
                  background: isProgress ? "#FAFDF8" : "transparent",
                  border: isProgress ? "1px solid #DCE8D4" : "1px solid transparent",
                  opacity: isLocked ? 0.45 : 1,
                  cursor: isLocked ? "default" : "pointer",
                  transition: "all 0.15s",
                }}
                onClick={() => (isAvailable || isProgress) && onRun(mod)}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: isComplete ? "#F0F4EE" : isProgress ? "#EAF2E4" : "#F5F5F5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: isComplete || isProgress ? "#4A5C3A" : "#CBD5C8",
                  flexShrink: 0,
                }}>
                  {moduleIcons[mod.id]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isLocked ? "#B8BDB6" : "#1A2018", marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>
                    {mod.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: isComplete ? "#4A5C3A" : isProgress ? "#4A5C3A" : "#B8BDB6",
                    fontFamily: isComplete ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
                    fontWeight: isProgress ? 600 : 400,
                  }}>
                    {isComplete
                      ? `Score: ${mod.score != null ? Math.round(mod.score) : "—"}${mod.scoreLabel ? ` · ${mod.scoreLabel}` : ""}`
                      : isProgress
                      ? (mod.scoreLabel || "In progress")
                      : isAvailable
                      ? "Ready to run"
                      : "Locked"}
                  </div>
                </div>
                {isComplete && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" fill="#4A5C3A"/>
                    <path d="M4 7l2.5 2.5L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {isProgress && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4A5C3A", animation: "pulse 2s infinite", flexShrink: 0 }}/>
                )}
                {isAvailable && (
                  <button
                    className="run-btn"
                    onClick={(e) => { e.stopPropagation(); onRun(mod); }}
                    style={{ padding: "4px 10px", border: "1.5px solid #4A5C3A", borderRadius: 6, background: "transparent", color: "#4A5C3A", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" as const }}>
                    Run →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended next */}
      {availableNext && (
        <div style={{ margin: "0 24px 16px", background: "#F7FAF5", border: "1px solid #DCE8D4", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#4A5C3A", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
            Recommended Next
          </div>
          <div style={{ fontSize: 13, color: "#1A2018", fontWeight: 500, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
            {availableNext.name}
          </div>
          <div style={{ fontSize: 11, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>
            Based on current diagnostic gaps{client.industry ? ` and industry benchmarks for ${client.industry.toLowerCase()} companies` : ""}.
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div style={{ borderTop: "1px solid #F0F2EE", padding: "16px 24px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA89A", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
          Recent Activity
        </div>
        {recentActivity.length === 0 ? (
          <div style={{ fontSize: 12, color: "#B8BDB6", fontFamily: "'DM Sans', sans-serif" }}>No activity yet</div>
        ) : (
          recentActivity.slice(0, 3).map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: m.status === "complete" ? "#4A5C3A" : "#B8A94A", flexShrink: 0 }}/>
              <span style={{ fontSize: 12, color: "#4A5048", flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
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
  );
}

// ─── Add Client Modal (exact wireframe) ───────────────────────────────────────
function AddClientModal({ workspaceId, onClose, onSuccess }: { workspaceId: string; onClose: () => void; onSuccess: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", industry: "", revenue_range: "", headcount: "" });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ workspace_id: workspaceId, name: form.name.trim(), industry: form.industry || null, revenue_range: form.revenue_range || null, headcount: form.headcount ? parseInt(form.headcount) : null })
        .select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hub-clients"] });
      onSuccess(data.id);
    },
    onError: (err: any) => setError(err.message ?? "Failed to create client"),
  });

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1.5px solid #EEF0EC", borderRadius: 9, fontSize: 13, color: "#1A2018", background: "#FAFAFA", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(26,32,24,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: 20, padding: 32, width: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.16)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1A2018", letterSpacing: "-0.4px", fontFamily: "'DM Sans', sans-serif" }}>Add New Client</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #EEF0EC", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7A67" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {[
          { label: "Company Name", placeholder: "e.g. Harlow Design + Build", key: "name" },
          { label: "Industry", placeholder: "e.g. Design-Build, Remodeling...", key: "industry" },
          { label: "Annual Revenue", placeholder: "e.g. $12M", key: "revenue_range" },
          { label: "Employee Count", placeholder: "e.g. 34", key: "headcount" },
        ].map((field) => (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
              {field.label}{field.key === "name" ? " *" : ""}
            </label>
            <input
              style={inputStyle}
              placeholder={field.placeholder}
              value={form[field.key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              type={field.key === "headcount" ? "number" : "text"}
              autoFocus={field.key === "name"}
            />
          </div>
        ))}

        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>Start with module</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { id: "rpe", label: "RPE Assessment", desc: "Start here — baseline diagnostic", selected: true },
              { id: "scope", label: "Scope Creep", desc: "Upload QB job costing data", selected: false },
            ].map((m) => (
              <div key={m.id} style={{ padding: "12px 14px", border: `1.5px solid ${m.selected ? "#4A5C3A" : "#EEF0EC"}`, borderRadius: 10, cursor: "pointer", background: m.selected ? "#F7FAF5" : "#FAFAFA" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: m.selected ? "#4A5C3A" : "#1A2018", marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {error && <p style={{ color: "#C0392B", fontSize: 13, marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}

        <button
          onClick={() => { if (!form.name.trim()) { setError("Company name is required"); return; } setError(null); mutation.mutate(); }}
          disabled={mutation.isPending}
          style={{ width: "100%", marginTop: 20, padding: "12px", background: mutation.isPending ? "#7A9A64" : "#4A5C3A", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.2px", transition: "background 0.15s" }}
        >
          {mutation.isPending ? "Creating…" : "Create Client & Start Diagnostic →"}
        </button>
      </div>
    </div>
  );
}

// ─── ClientRow: fetches modules + derives health score ────────────────────────
function ClientRow({ client, selectedId, onSelect }: { client: Client; selectedId: string | null; onSelect: (id: string, modules: ClientModule[], health: number | null) => void }) {
  const { data: modules = [] } = useClientModules(client.id);
  const healthScore = useMemo(() => {
    const rpe = modules.find((m) => m.id === "rpe" && m.status === "complete");
    return rpe?.score != null ? Math.round(rpe.score) : null;
  }, [modules]);

  return (
    <ClientCard
      client={client}
      modules={modules}
      healthScore={healthScore}
      isSelected={client.id === selectedId}
      onClick={() => onSelect(client.id, modules, healthScore)}
    />
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { workspace, workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const welcomeSeen = workspaceId ? localStorage.getItem(`${WELCOME_SEEN_PREFIX}${workspaceId}`) === "true" : true;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "needs_attention">("all");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<ClientModule[]>([]);
  const [selectedHealth, setSelectedHealth] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["hub-clients", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase.from("clients").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspaceId,
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  const filtered = useMemo(() => clients.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [clients, search]);

  if (!welcomeSeen) return <Navigate to="/welcome" replace />;

  const handleSelect = (id: string, modules: ClientModule[], health: number | null) => {
    setSelectedClientId(id);
    setSelectedModules(modules);
    setSelectedHealth(health);
  };

  const handleRun = (mod: ClientModule) => {
    navigate(`/dashboard?client=${selectedClientId}&module=${mod.id}`);
  };

  const activeCount = clients.filter((c) => true).length; // placeholder
  const inProgressCount = 0; // will come from module data

  return (
    <AppLayout>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .client-card:hover { border-color: #C8D8C0 !important; box-shadow: 0 4px 16px rgba(0,0,0,0.07) !important; }
        .filter-btn:hover { background: #F0F4EE !important; }
        .add-btn:hover { background: #3A4A2E !important; box-shadow: 0 4px 12px rgba(74,92,58,0.3) !important; }
        .module-row:hover { background: #FAFDF8 !important; }
        .run-btn:hover { background: #4A5C3A !important; color: white !important; }
        .modal-overlay { animation: fadeIn 0.15s ease; }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#1A2018" }}>
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#1A2018", letterSpacing: "-0.6px", fontFamily: "'DM Sans', sans-serif" }}>
              Client Hub
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6B7A67" }}>
              {clients.length} active client{clients.length !== 1 ? "s" : ""} · {clients.length} diagnostics available
            </p>
          </div>
          <button
            className="add-btn"
            onClick={() => setShowAddModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#4A5C3A", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 8px rgba(74,92,58,0.2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            Add Client
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          <StatCard label="Total Clients" value={clients.length} sub="Active in workspace" />
          <StatCard label="Avg Health Score" value="—" sub="RPE assessments needed" accent="#4A5C3A" />
          <StatCard label="Modules Run" value="—" sub="Across all clients" />
          <StatCard label="Est. Margin Identified" value="—" sub="Complete RPE to calculate" accent="#B8A94A" />
        </div>

        {/* Main content */}
        <div style={{ display: "grid", gridTemplateColumns: selectedClient ? "1fr 380px" : "1fr", gap: 20, alignItems: "start" }}>

          {/* Left — client list */}
          <div>
            {/* Search + filter */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA89A" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M9.5 9.5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients..."
                  style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1.5px solid #EEF0EC", borderRadius: 9, fontSize: 13, color: "#1A2018", background: "#FFFFFF", outline: "none", fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
              <div style={{ display: "flex", gap: 4, background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 9, padding: 4 }}>
                {([["all", "All"], ["active", "Active"], ["needs_attention", "Needs Attention"]] as const).map(([val, lbl]) => (
                  <button
                    key={val}
                    className="filter-btn"
                    onClick={() => setFilter(val)}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: filter === val ? "#F0F4EE" : "transparent", color: filter === val ? "#4A5C3A" : "#6B7A67", fontSize: 12, fontWeight: filter === val ? 600 : 400, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.1s" }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Client cards — 2-column grid */}
            {isLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 16, height: 220, opacity: 0.5 }}/>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ background: "#FFFFFF", border: "2px dashed #EEF0EC", borderRadius: 16, padding: "60px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: "#1A2018", margin: "0 0 8px" }}>
                  {search ? "No clients match" : "No clients yet"}
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7A67", margin: "0 0 24px" }}>
                  {search ? "Try a different search term" : "Add your first client to begin the Clario™ diagnostic"}
                </p>
                {!search && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{ padding: "10px 24px", background: "#4A5C3A", color: "white", border: "none", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                  >
                    Add First Client
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {filtered.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    selectedId={selectedClientId}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right — detail panel */}
          {selectedClient && (
            <DetailPanel
              client={selectedClient}
              modules={selectedModules}
              healthScore={selectedHealth}
              onRun={handleRun}
            />
          )}
        </div>
      </div>

      {showAddModal && workspaceId && (
        <AddClientModal
          workspaceId={workspaceId}
          onClose={() => setShowAddModal(false)}
          onSuccess={(id) => { setShowAddModal(false); setSelectedClientId(id); }}
        />
      )}
    </AppLayout>
  );
}
