import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientModules, ClientModule, ModuleId } from "@/hooks/useClientModules";
import {
  Search,
  Plus,
  Users,
  TrendingUp,
  Activity,
  DollarSign,
  X,
  ChevronRight,
  Clock,
} from "lucide-react";

const WELCOME_SEEN_PREFIX = "welcome_seen_";

// ── Brand tokens ─────────────────────────────────────────────────────────────
const B = {
  green: "#4A5C3A",
  greenLight: "#F0F4EE",
  greenBorder: "#C8D8C0",
  gold: "#B8A94A",
  red: "#C0392B",
  bg: "#F7F9F5",
  card: "#FFFFFF",
  border: "#EEF0EC",
  textPrimary: "#1A2018",
  textSecondary: "#6B7A67",
  textMuted: "#9CA89A",
};

// ── Types ─────────────────────────────────────────────────────────────────────
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

type FilterTab = "all" | "active" | "attention";

// ── Health Score Ring ─────────────────────────────────────────────────────────
function HealthRing({
  score,
  size = 52,
  selected = false,
}: {
  score: number | null;
  size?: number;
  selected?: boolean;
}) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score != null ? Math.min(Math.max(score, 0), 100) / 100 : null;

  const strokeColor =
    score == null ? B.textMuted : score >= 70 ? B.green : score >= 40 ? B.gold : B.red;

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={B.border}
        strokeWidth={5}
      />
      {pct != null ? (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={5}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ) : (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={B.textMuted}
          strokeWidth={5}
          strokeDasharray="4 4"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={score != null && score >= 100 ? 9 : 11}
        fontWeight={600}
        fontFamily="DM Mono, monospace"
        fill={selected ? B.green : B.textPrimary}
      >
        {score != null ? score : "—"}
      </text>
    </svg>
  );
}

// ── Module Pill ───────────────────────────────────────────────────────────────
function ModulePill({ mod }: { mod: ClientModule }) {
  const styles: Record<string, React.CSSProperties> = {
    complete: {
      background: B.greenLight,
      border: `1px solid ${B.greenBorder}`,
      color: B.green,
    },
    in_progress: {
      background: "#FAFDF8",
      border: `1px solid ${B.green}`,
      color: B.green,
    },
    available: {
      background: "#FAFAFA",
      border: `1px solid #E8EAE6`,
      color: B.textSecondary,
    },
    locked: {
      background: "#F8F8F8",
      border: `1px solid #EEEEEE`,
      color: B.textMuted,
      opacity: 0.5,
    },
  };

  const shortName: Record<ModuleId, string> = {
    rpe: "RPE",
    scope: "Scope",
    pl: "P&L",
    cashflow: "Cash Flow",
  };

  return (
    <span
      style={{
        ...styles[mod.status],
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {mod.status === "in_progress" && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: B.green,
            flexShrink: 0,
            animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
          }}
        />
      )}
      {shortName[mod.id]}
      {mod.status === "complete" && mod.scoreLabel ? (
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, marginLeft: 2 }}>
          {mod.scoreLabel}
        </span>
      ) : mod.status === "complete" && mod.score != null ? (
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, marginLeft: 2 }}>
          {Math.round(mod.score)}
        </span>
      ) : null}
    </span>
  );
}

// ── Client Card ───────────────────────────────────────────────────────────────
function ClientCard({
  client,
  modules,
  healthScore,
  selected,
  onClick,
}: {
  client: Client;
  modules: ClientModule[];
  healthScore: number | null;
  selected: boolean;
  onClick: () => void;
}) {
  const completedCount = modules.filter((m) => m.status === "complete").length;
  const progressPct = (completedCount / 4) * 100;

  const lastActivity = modules
    .filter((m) => m.date)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0]?.date;

  const attentionNeeded = modules.some((m) => m.status === "in_progress");

  return (
    <button
      onClick={onClick}
      style={{
        background: B.card,
        border: `1px solid ${selected ? B.green : B.border}`,
        borderTop: `3px solid ${selected ? B.green : B.border}`,
        borderRadius: 8,
        padding: "16px",
        textAlign: "left",
        cursor: "pointer",
        width: "100%",
        boxShadow: selected
          ? `0 0 0 2px ${B.green}22, 0 2px 12px rgba(74,92,58,0.12)`
          : "0 1px 4px rgba(0,0,0,0.05)",
        transition: "all 0.15s ease",
        position: "relative",
      }}
    >
      {attentionNeeded && !selected && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: B.gold,
          }}
        />
      )}

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
          <div
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              color: B.textPrimary,
              marginBottom: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {client.name}
          </div>
          <div
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              color: B.textSecondary,
            }}
          >
            {[client.industry, client.revenue_range, client.headcount ? `${client.headcount} emp` : null]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <HealthRing score={healthScore} size={48} selected={selected} />
      </div>

      {/* Module pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {modules.map((m) => (
          <ModulePill key={m.id} mod={m} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            height: 3,
            background: B.border,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: progressPct === 100 ? B.green : B.gold,
              borderRadius: 999,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
            fontFamily: "DM Mono, monospace",
            fontSize: 10,
            color: B.textMuted,
          }}
        >
          <span>{completedCount}/4 modules</span>
          {lastActivity && (
            <span>
              {new Date(lastActivity).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Detail Panel Module Row ───────────────────────────────────────────────────
function DetailModuleRow({
  mod,
  clientId,
  onRun,
}: {
  mod: ClientModule;
  clientId: string;
  onRun: (mod: ClientModule) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: `1px solid ${B.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
        <div
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 500,
            fontSize: 13,
            color: mod.status === "locked" ? B.textMuted : B.textPrimary,
          }}
        >
          {mod.name}
        </div>
        {mod.status === "complete" && (
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: B.textSecondary, marginTop: 2 }}>
            Score: {mod.score != null ? Math.round(mod.score) : "—"}
            {mod.scoreLabel ? ` · ${mod.scoreLabel}` : ""}
          </div>
        )}
        {mod.status === "in_progress" && (
          <div style={{ fontSize: 11, color: B.green, marginTop: 2 }}>In progress</div>
        )}
      </div>
      <div>
        {mod.status === "available" && (
          <button
            onClick={() => onRun(mod)}
            style={{
              padding: "4px 12px",
              background: B.green,
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            Run <ChevronRight size={12} />
          </button>
        )}
        {mod.status === "in_progress" && (
          <button
            onClick={() => onRun(mod)}
            style={{
              padding: "4px 12px",
              background: "transparent",
              color: B.green,
              border: `1px solid ${B.green}`,
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            Continue <ChevronRight size={12} />
          </button>
        )}
        {mod.status === "complete" && (
          <span
            style={{
              padding: "3px 10px",
              background: B.greenLight,
              color: B.green,
              border: `1px solid ${B.greenBorder}`,
              borderRadius: 4,
              fontSize: 11,
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
            }}
          >
            ✓ Done
          </span>
        )}
        {mod.status === "locked" && (
          <span style={{ fontSize: 12, color: B.textMuted, fontFamily: "DM Mono, monospace" }}>
            🔒 Locked
          </span>
        )}
      </div>
    </div>
  );
}

// ── Add Client Modal ──────────────────────────────────────────────────────────
const INDUSTRIES = [
  "Consulting", "Technology", "Healthcare", "Finance", "Manufacturing",
  "Retail", "Real Estate", "Legal", "Marketing", "Other",
];
const REVENUE_RANGES = [
  { value: "under_1m", label: "Under $1M" },
  { value: "1m-5m", label: "$1M–$5M" },
  { value: "5m-10m", label: "$5M–$10M" },
  { value: "10m-25m", label: "$10M–$25M" },
  { value: "25m_plus", label: "$25M+" },
];

function AddClientModal({
  workspaceId,
  onClose,
  onSuccess,
}: {
  workspaceId: string;
  onClose: () => void;
  onSuccess: (clientId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    industry: "",
    revenue_range: "",
    headcount: "",
  });
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
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hub-clients"] });
      onSuccess(data.id);
    },
    onError: (err: any) => {
      setError(err.message ?? "Failed to create client");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Client name is required"); return; }
    setError(null);
    mutation.mutate();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: `1px solid ${B.border}`,
    borderRadius: 6,
    fontFamily: "DM Sans, sans-serif",
    fontSize: 13,
    color: B.textPrimary,
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "DM Sans, sans-serif",
    fontWeight: 500,
    fontSize: 12,
    color: B.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: 480,
          padding: "28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: 18, color: B.textPrimary, margin: 0 }}>
            Add New Client
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Company Name *</label>
            <input
              style={inputStyle}
              placeholder="Acme Corp"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>Industry</label>
            <select
              style={{ ...inputStyle, appearance: "none" }}
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            >
              <option value="">Select industry…</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Revenue Range</label>
            <select
              style={{ ...inputStyle, appearance: "none" }}
              value={form.revenue_range}
              onChange={(e) => setForm({ ...form, revenue_range: e.target.value })}
            >
              <option value="">Select range…</option>
              {REVENUE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Employee Count</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="e.g. 45"
              value={form.headcount}
              onChange={(e) => setForm({ ...form, headcount: e.target.value })}
              min={1}
            />
          </div>

          <div
            style={{
              background: B.greenLight,
              border: `1px solid ${B.greenBorder}`,
              borderRadius: 6,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, color: B.green, fontFamily: "DM Sans, sans-serif" }}>
              ✓ <strong>RPE Assessment</strong> will be unlocked immediately after creation
            </span>
          </div>

          {error && (
            <p style={{ color: B.red, fontFamily: "DM Sans, sans-serif", fontSize: 13, margin: 0 }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 18px",
                background: "transparent",
                border: `1px solid ${B.border}`,
                borderRadius: 6,
                fontFamily: "DM Sans, sans-serif",
                fontSize: 14,
                color: B.textSecondary,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                padding: "8px 20px",
                background: B.green,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                opacity: mutation.isPending ? 0.7 : 1,
              }}
            >
              {mutation.isPending ? "Creating…" : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── ClientRow: fetches modules, computes health ───────────────────────────────
function ClientRow({
  client,
  selected,
  onClick,
}: {
  client: Client;
  selected: boolean;
  onClick: (modules: ClientModule[], healthScore: number | null) => void;
}) {
  const { data: modules = [] } = useClientModules(client.id);

  const healthScore = useMemo(() => {
    const rpeComplete = modules.find((m) => m.id === "rpe" && m.status === "complete");
    return rpeComplete?.score != null ? Math.round(rpeComplete.score) : null;
  }, [modules]);

  return (
    <ClientCard
      client={client}
      modules={modules}
      healthScore={healthScore}
      selected={selected}
      onClick={() => onClick(modules, healthScore)}
    />
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({
  client,
  modules,
  healthScore,
  onClose,
  onRun,
}: {
  client: Client;
  modules: ClientModule[];
  healthScore: number | null;
  onClose: () => void;
  onRun: (mod: ClientModule) => void;
}) {
  const nextModule = modules.find((m) => m.status === "available" || m.status === "in_progress");

  return (
    <div
      style={{
        background: B.card,
        border: `1px solid ${B.border}`,
        borderRadius: 10,
        padding: "20px",
        position: "sticky",
        top: 16,
        maxHeight: "calc(100vh - 200px)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: 16, color: B.textPrimary, margin: 0 }}>
            {client.name}
          </h3>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: B.textSecondary, margin: "2px 0 0" }}>
            {[client.industry, client.revenue_range].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HealthRing score={healthScore} size={44} />
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Recommended next */}
      {nextModule && (
        <div
          style={{
            background: B.greenLight,
            border: `1px solid ${B.greenBorder}`,
            borderRadius: 6,
            padding: "10px 14px",
            marginBottom: 16,
          }}
        >
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, color: B.green, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Recommended Next
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: B.textPrimary, fontWeight: 500 }}>
              {nextModule.name}
            </span>
            <button
              onClick={() => onRun(nextModule)}
              style={{
                padding: "4px 12px",
                background: B.green,
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {nextModule.status === "in_progress" ? "Continue" : "Run"} <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Module list */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, color: B.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Modules
        </div>
        {modules.map((mod) => (
          <DetailModuleRow key={mod.id} mod={mod} clientId={client.id} onRun={onRun} />
        ))}
      </div>

      {/* Activity */}
      <div>
        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, color: B.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Recent Activity
        </div>
        {modules
          .filter((m) => m.date && m.status !== "locked" && m.status !== "available")
          .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
          .slice(0, 4)
          .map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
              <Clock size={12} style={{ color: B.textMuted, marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: B.textPrimary }}>
                  {m.name}{" "}
                  <span style={{ color: m.status === "complete" ? B.green : B.gold }}>
                    {m.status === "complete" ? "completed" : "started"}
                  </span>
                </div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: B.textMuted }}>
                  {new Date(m.date!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>
          ))}
        {modules.every((m) => !m.date || m.status === "available" || m.status === "locked") && (
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: B.textMuted }}>No activity yet</p>
        )}
      </div>
    </div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ clients }: { clients: Client[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        marginBottom: 20,
      }}
    >
      {[
        { label: "Total Clients", value: clients.length, icon: <Users size={16} color={B.green} />, mono: true },
        { label: "Avg Health Score", value: "—", icon: <TrendingUp size={16} color={B.gold} />, mono: true },
        { label: "Modules Run", value: "—", icon: <Activity size={16} color={B.textSecondary} />, mono: true },
        { label: "Est. Margin", value: "—", icon: <DollarSign size={16} color={B.green} />, mono: true },
      ].map((stat) => (
        <div
          key={stat.label}
          style={{
            background: B.card,
            border: `1px solid ${B.border}`,
            borderRadius: 8,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: B.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              {stat.label}
            </span>
            {stat.icon}
          </div>
          <div
            style={{
              fontFamily: stat.mono ? "DM Mono, monospace" : "DM Sans, sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: B.textPrimary,
            }}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { workspace, workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const welcomeSeen = workspaceId
    ? localStorage.getItem(`${WELCOME_SEEN_PREFIX}${workspaceId}`) === "true"
    : true;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<ClientModule[]>([]);
  const [selectedHealthScore, setSelectedHealthScore] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["hub-clients", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspaceId,
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [clients, search, filter]);

  if (!welcomeSeen) {
    return <Navigate to="/welcome" replace />;
  }

  const handleClientClick = (client: Client, modules: ClientModule[], healthScore: number | null) => {
    setSelectedClientId(client.id);
    setSelectedModules(modules);
    setSelectedHealthScore(healthScore);
  };

  const handleRun = (clientId: string, mod: ClientModule) => {
    navigate(`/dashboard?client=${clientId}&module=${mod.id}`);
  };

  const handleAddSuccess = (clientId: string) => {
    setShowAddModal(false);
    setSelectedClientId(clientId);
  };

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "attention", label: "Needs Attention" },
  ];

  return (
    <AppLayout>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ fontFamily: "DM Sans, sans-serif", color: B.textPrimary }}>
        {/* Page Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: B.textPrimary,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Client Hub
            </h1>
            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13,
                color: B.textSecondary,
                margin: "4px 0 0",
              }}
            >
              {workspace?.account_name ? `${workspace.account_name} · ` : ""}
              {clients.length} client{clients.length !== 1 ? "s" : ""} · Clario™ Diagnostic Platform
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              background: B.green,
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(74,92,58,0.2)",
            }}
          >
            <Plus size={16} />
            Add Client
          </button>
        </div>

        {/* Stats Bar */}
        <StatsBar clients={clients} />

        {/* Search + Filter Row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: B.card,
              border: `1px solid ${B.border}`,
              borderRadius: 7,
              padding: "7px 12px",
              flex: 1,
              minWidth: 180,
              maxWidth: 320,
            }}
          >
            <Search size={14} color={B.textMuted} />
            <input
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13,
                color: B.textPrimary,
                width: "100%",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: "7px 14px",
                  background: filter === tab.id ? B.green : B.card,
                  color: filter === tab.id ? "#fff" : B.textSecondary,
                  border: `1px solid ${filter === tab.id ? B.green : B.border}`,
                  borderRadius: 6,
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 13,
                  fontWeight: filter === tab.id ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content: grid + panel */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: selectedClient ? "1fr 340px" : "1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* Client Grid */}
          <div>
            {isLoading ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 14,
                }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      background: B.card,
                      border: `1px solid ${B.border}`,
                      borderRadius: 8,
                      height: 160,
                      opacity: 0.5,
                    }}
                  />
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <div
                style={{
                  background: B.card,
                  border: `2px dashed ${B.border}`,
                  borderRadius: 10,
                  padding: "60px 24px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                <h3 style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 16, color: B.textPrimary, margin: "0 0 8px" }}>
                  {search ? "No clients match your search" : "No clients yet"}
                </h3>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: B.textSecondary, margin: "0 0 20px" }}>
                  {search ? "Try a different search term" : "Add your first client to get started with the Clario™ diagnostic"}
                </p>
                {!search && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                      padding: "9px 20px",
                      background: B.green,
                      color: "#fff",
                      border: "none",
                      borderRadius: 7,
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Add First Client
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(auto-fill, minmax(${selectedClient ? "260px" : "290px"}, 1fr))`,
                  gap: 14,
                }}
              >
                {filteredClients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    selected={client.id === selectedClientId}
                    onClick={(modules, healthScore) =>
                      handleClientClick(client, modules, healthScore)
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedClient && (
            <DetailPanel
              client={selectedClient}
              modules={selectedModules}
              healthScore={selectedHealthScore}
              onClose={() => setSelectedClientId(null)}
              onRun={(mod) => handleRun(selectedClient.id, mod)}
            />
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && workspaceId && (
        <AddClientModal
          workspaceId={workspaceId}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </AppLayout>
  );
}
