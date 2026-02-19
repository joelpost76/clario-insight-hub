import { useState } from "react";
import { useRPE } from "@/contexts/RPEContext";

const S = {
  green: "#4A5C3A",
  text: "#1A2018",
  muted: "#6B7A67",
  faint: "#9CA89A",
  border: "#EEF0EC",
  sans: "'DM Sans', sans-serif" as const,
  mono: "'DM Mono', monospace" as const,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: `1.5px solid ${S.border}`,
  borderRadius: 10,
  fontFamily: S.sans,
  fontSize: 14,
  color: S.text,
  background: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
};

export default function RPEStep5() {
  const { stepData, saveStepData, completeStep } = useRPE();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    backlog_months: stepData.backlog_months?.toString() ?? "",
    wip_jobs: stepData.wip_jobs?.toString() ?? "",
    throughput_per_month: stepData.throughput_per_month?.toString() ?? "",
  });

  // Derived capacity metrics
  const backlog = Number(form.backlog_months) || null;
  const wip = Number(form.wip_jobs) || null;
  const throughput = Number(form.throughput_per_month) || null;

  const impliedLeadTime = wip && throughput ? (wip / throughput).toFixed(1) : null;
  const capacityUtilization = backlog ? Math.min((backlog / 3) * 100, 100) : null;

  const getBacklogHealth = (months: number | null) => {
    if (months === null) return null;
    if (months >= 4) return { label: "Strong Pipeline", color: S.green };
    if (months >= 2) return { label: "Adequate Backlog", color: "#B8A94A" };
    return { label: "Thin Pipeline — Risk", color: "#C0392B" };
  };

  const backlogHealth = getBacklogHealth(backlog);

  const handleNext = async () => {
    setSaving(true);
    try {
      const data = {
        backlog_months: backlog,
        wip_jobs: wip,
        throughput_per_month: throughput,
      };
      saveStepData(data);
      await completeStep(5, data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Guidance card */}
      <div style={{ background: "#F7FAF5", border: "1.5px solid #C8D8C0", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 12 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
          <rect x="2" y="4" width="14" height="11" rx="1.5" stroke={S.green} strokeWidth="1.4"/>
          <path d="M6 4V2M12 4V2" stroke={S.green} strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M5 9h8M5 12h5" stroke={S.green} strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.green, marginBottom: 4, fontFamily: S.sans }}>Capacity & WIP</div>
          <div style={{ fontSize: 13, color: S.muted, fontFamily: S.sans, lineHeight: 1.6 }}>
            Backlog and WIP are leading indicators of future revenue and cash flow health.
            WIP ÷ Monthly Throughput = implied lead time — a key leverage point for improving RPE.
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Form */}
        <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: S.sans }}>
              Backlog (months) <span style={{ color: "#9CA89A", fontWeight: 400 }}>— optional</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={form.backlog_months}
              onChange={(e) => setForm({ ...form, backlog_months: e.target.value })}
              placeholder="e.g. 3.5"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: S.faint, marginTop: 4, fontFamily: S.sans }}>
              How many months of work is currently signed/contracted?
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: S.sans }}>
              Active WIP Jobs <span style={{ color: "#9CA89A", fontWeight: 400 }}>— optional</span>
            </label>
            <input
              type="number"
              min="0"
              value={form.wip_jobs}
              onChange={(e) => setForm({ ...form, wip_jobs: e.target.value })}
              placeholder="e.g. 12"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: S.faint, marginTop: 4, fontFamily: S.sans }}>
              Jobs currently in production / under construction
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: S.sans }}>
              Jobs Completed per Month <span style={{ color: "#9CA89A", fontWeight: 400 }}>— optional</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.throughput_per_month}
              onChange={(e) => setForm({ ...form, throughput_per_month: e.target.value })}
              placeholder="e.g. 4"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: S.faint, marginTop: 4, fontFamily: S.sans }}>
              Average number of jobs closed per month
            </div>
          </div>
        </div>

        {/* Derived metrics */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {backlogHealth && (
            <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8, fontFamily: S.sans }}>Backlog Health</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: backlogHealth.color, fontFamily: S.mono }}>{backlog}mo</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: backlogHealth.color, fontFamily: S.sans, marginTop: 4 }}>{backlogHealth.label}</div>
              <div style={{ fontSize: 11, color: S.faint, marginTop: 8, fontFamily: S.sans }}>Healthy target: 3–6 months</div>
            </div>
          )}

          {impliedLeadTime && (
            <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8, fontFamily: S.sans }}>Implied Lead Time</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: S.text, fontFamily: S.mono }}>{impliedLeadTime}<span style={{ fontSize: 14, fontWeight: 400, color: S.muted }}> mo</span></div>
              <div style={{ fontSize: 11, color: S.muted, fontFamily: S.sans, marginTop: 8 }}>
                WIP ÷ Throughput — client waits this long from start to handoff
              </div>
            </div>
          )}

          {capacityUtilization !== null && (
            <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8, fontFamily: S.sans }}>Capacity Signal</div>
              <div style={{ height: 8, background: "#F0F2EE", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${capacityUtilization}%`, height: "100%", background: capacityUtilization > 80 ? S.green : "#B8A94A", borderRadius: 4 }}/>
              </div>
              <div style={{ fontSize: 12, color: S.muted, fontFamily: S.sans }}>
                {capacityUtilization > 80 ? "Strong capacity utilization" : "Capacity available — check for demand constraints"}
              </div>
            </div>
          )}

          {!backlogHealth && !impliedLeadTime && (
            <div style={{ background: "#FAFAF9", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "24px 22px", textAlign: "center" as const }}>
              <div style={{ fontSize: 13, color: S.faint, fontFamily: S.sans }}>
                Enter values to see derived capacity metrics
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <button
          onClick={() => window.history.back()}
          style={{ padding: "11px 20px", background: "none", color: S.muted, border: `1.5px solid ${S.border}`, borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: S.sans }}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={saving}
          style={{ padding: "11px 28px", background: S.green, color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: saving ? "wait" : "pointer", fontFamily: S.sans, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Saving…" : "Next — Impact Model →"}
        </button>
      </div>
    </div>
  );
}
