import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientModules, ClientModule, ModuleId } from "@/hooks/useClientModules";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RPESummaryCard } from "@/modules/rpe/components/RPESummaryCard";

const WELCOME_SEEN_PREFIX = "welcome_seen_";

// ─── Module icons ─────────────────────────────────────────────────────────────
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

// ─── Health Ring ──────────────────────────────────────────────────────────────
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

// ─── Module Pill ──────────────────────────────────────────────────────────────
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
  onClick,
}: {
  client: Client;
  modules: ClientModule[];
  healthScore: number | null;
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
        border: "1.5px solid #EEF0EC",
        borderRadius: 16,
        padding: "24px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >

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

// ─── Stat Card ────────────────────────────────────────────────────────────────
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



// ─── Add Client Modal ─────────────────────────────────────────────────────────
function AddClientModal({ workspaceId, onClose, onSuccess }: { workspaceId: string; onClose: () => void; onSuccess: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", industry: "", revenue_range: "", headcount: "" });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          workspace_id: workspaceId,
          name: form.name.trim(),
          industry: form.industry || null,
          revenue_range: form.revenue_range || null,
          headcount: form.headcount ? parseInt(form.headcount) : null,
        })
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

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: "1.5px solid #EEF0EC",
    borderRadius: 9, fontSize: 13, color: "#1A2018", background: "#FAFAFA",
    outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
  };

  const INDUSTRIES = ["Design-Build", "Remodeling", "Custom Homes", "Renovation", "Other"];

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

        {/* Company Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
            Company Name *
          </label>
          <input
            style={inputStyle}
            placeholder="e.g. Harlow Design + Build"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
        </div>

        {/* Industry */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
            Industry
          </label>
          <Select value={form.industry} onValueChange={(val) => setForm({ ...form, industry: val })}>
            <SelectTrigger style={{ ...inputStyle, height: "auto" }}>
              <SelectValue placeholder="Select industry..." />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Annual Revenue */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
            Annual Revenue
          </label>
          <input
            style={inputStyle}
            placeholder="e.g. $12M"
            value={form.revenue_range}
            onChange={(e) => setForm({ ...form, revenue_range: e.target.value })}
          />
        </div>

        {/* Employee Count */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
            Employee Count
          </label>
          <input
            style={inputStyle}
            placeholder="e.g. 34"
            type="number"
            value={form.headcount}
            onChange={(e) => setForm({ ...form, headcount: e.target.value })}
          />
        </div>

        {error && <p style={{ color: "#C0392B", fontSize: 13, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}

        <button
          onClick={() => {
            if (!form.name.trim()) { setError("Company name is required"); return; }
            setError(null);
            mutation.mutate();
          }}
          disabled={mutation.isPending}
          style={{ width: "100%", marginTop: 20, padding: "12px", background: mutation.isPending ? "#7A9A64" : "#4A5C3A", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.2px", transition: "background 0.15s" }}
        >
          {mutation.isPending ? "Creating…" : "Add Client →"}
        </button>
      </div>
    </div>
  );
}

// ─── ClientRow: fetches modules + derives health score ────────────────────────
function ClientRow({
  client,
  onClick,
}: {
  client: Client;
  onClick: () => void;
}) {
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
      onClick={onClick}
    />
  );
}

// ─── Hub Stats aggregator ─────────────────────────────────────────────────────
function useHubStats(workspaceId: string | null) {
  return useQuery({
    queryKey: ["hub-stats", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { modulesRun: 0, activeDiagnostics: 0, avgHealthScore: null as number | null };

      const [rpeRes, scopeRes] = await Promise.all([
        supabase
          .from("assessments")
          .select("id, is_complete, total_weighted_score, client_id")
          .eq("workspace_id", workspaceId),
        supabase
          .from("scope_creep_assessments")
          .select("id, is_complete, client_id")
          .eq("workspace_id", workspaceId),
      ]);

      const rpeData = rpeRes.data ?? [];
      const scopeData = scopeRes.data ?? [];

      const modulesRun = rpeData.length + scopeData.length;
      const activeDiagnostics = rpeData.filter((a) => !a.is_complete).length + scopeData.filter((a) => !a.is_complete).length;

      // Avg health: most recent completed RPE per client
      const completedByClient: Record<string, number> = {};
      for (const a of rpeData) {
        if (a.is_complete && a.total_weighted_score != null) {
          if (!(a.client_id in completedByClient)) {
            completedByClient[a.client_id] = a.total_weighted_score;
          }
        }
      }
      const scores = Object.values(completedByClient);
      const avgHealthScore = scores.length > 0
        ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
        : null;

      return { modulesRun, activeDiagnostics, avgHealthScore };
    },
    enabled: !!workspaceId,
  });
}

// ─── Diagnostic Gates Card ────────────────────────────────────────────────────
function DiagnosticGatesCard() {
  const navigate = useNavigate();
  const { completionStatus } = useWorkspace();

  const gates = [
    { label: "Kickoff", key: "kickoff" as const, route: "/kickoff" },
    { label: "Intake", key: "intake" as const, route: "/intake" },
    { label: "Artifacts", key: "artifacts" as const, route: "/artifacts" },
    { label: "Interviews", key: "interviews" as const, route: "/interviews" },
    { label: "Survey", key: "survey" as const, route: "/survey" },
    { label: "SIPOC", key: "sipoc" as const, route: "/sipoc" },
    { label: "Workflow", key: "workflow" as const, route: "/workflow" },
    { label: "Baseline", key: "baseline" as const, route: "/baseline" },
    { label: "Synthesis", key: "synthesis" as const, route: "/synthesis" },
  ];

  const completed = gates.filter((g) => completionStatus?.[g.key]).length;
  const pct = Math.round((completed / gates.length) * 100);

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1.5px solid #EEF0EC",
      borderRadius: 16,
      padding: "20px 24px",
      marginBottom: 16,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: completed === gates.length ? "#4A5C3A" : "#F0F4EE",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7.5l3 3 7-7" stroke={completed === gates.length ? "#FFFFFF" : "#4A5C3A"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2018", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.2px" }}>
              Diagnostic Gates
            </div>
            <div style={{ fontSize: 11, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>
              {completed}/{gates.length} complete · {pct}%
            </div>
          </div>
        </div>
        {completed === gates.length && (
          <button
            onClick={() => navigate("/readout")}
            style={{
              padding: "6px 14px", background: "#4A5C3A", color: "white",
              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            View Readout →
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "#F0F4EE", borderRadius: 3, marginBottom: 14, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 3,
          background: completed === gates.length
            ? "#4A5C3A"
            : "linear-gradient(90deg, #4A5C3A, #AAAF55)",
          width: `${pct}%`,
          transition: "width 0.4s ease",
        }}/>
      </div>

      {/* Gate pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {gates.map((gate) => {
          const done = completionStatus?.[gate.key] ?? false;
          return (
            <button
              key={gate.key}
              onClick={() => navigate(gate.route)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px",
                background: done ? "#F0F4EE" : "#FAFAFA",
                border: `1px solid ${done ? "#C8D8C0" : "#EEF0EC"}`,
                borderRadius: 6, cursor: "pointer",
                fontSize: 11, fontWeight: done ? 600 : 400,
                color: done ? "#4A5C3A" : "#9CA89A",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}
            >
              {done ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" fill="#4A5C3A"/>
                  <path d="M3.5 6l1.5 1.5 3.5-3.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#D0D5CE" strokeWidth="1"/>
                </svg>
              )}
              {gate.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  // Mark welcome seen whenever hub loads
  if (workspaceId) {
    localStorage.setItem(`${WELCOME_SEEN_PREFIX}${workspaceId}`, "true");
  }

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "needs_attention">("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["hub-clients", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspaceId,
  });

  const { data: stats } = useHubStats(workspaceId);

  const filtered = useMemo(() => clients.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [clients, search]);

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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Crosshair/target icon badge */}
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#4A5C3A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(74,92,58,0.25)" }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="1.5"/>
                <circle cx="11" cy="11" r="3.5" stroke="white" strokeWidth="1.5"/>
                <line x1="11" y1="2" x2="11" y2="5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="11" y1="16.5" x2="11" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="2" y1="11" x2="5.5" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="16.5" y1="11" x2="20" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1A2018", letterSpacing: "-0.6px", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.1 }}>
                Clario<sup style={{ fontSize: 14, color: "#9CA89A", fontWeight: 500, letterSpacing: 0 }}>™</sup>
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>
                Diagnostic Platform
              </p>
            </div>
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

        {/* Stats row — client-centric */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          <StatCard label="Total Clients" value={clients.length} sub="Active in workspace" />
          <StatCard
            label="Avg Health Score"
            value={stats?.avgHealthScore ?? "—"}
            sub={stats?.avgHealthScore ? "Across completed RPE" : "RPE assessments needed"}
            accent="#4A5C3A"
          />
          <StatCard
            label="Modules Run"
            value={stats?.modulesRun ?? "—"}
            sub="Across all clients"
          />
          <StatCard
            label="Active Diagnostics"
            value={stats?.activeDiagnostics ?? "—"}
            sub="In progress now"
            accent="#B8A94A"
          />
        </div>

        {/* Diagnostic Gates Progress */}
        {workspaceId && <DiagnosticGatesCard />}

        {/* RPE Summary Card */}
        {workspaceId && (
          <div style={{ marginBottom: 28 }}>
            <RPESummaryCard
              workspaceId={workspaceId}
              onOpenDetails={() => navigate("/rpe")}
            />
          </div>
        )}

        {/* Main content */}
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

          {/* Client cards — 3-column grid */}
          {isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[1, 2, 3].map((i) => (
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {filtered.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onClick={() => navigate(`/client/${client.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && workspaceId && (
        <AddClientModal
          workspaceId={workspaceId}
          onClose={() => setShowAddModal(false)}
          onSuccess={(id) => {
            setShowAddModal(false);
            navigate(`/client/${id}`);
          }}
        />
      )}
    </AppLayout>
  );
}
