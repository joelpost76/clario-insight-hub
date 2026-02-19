import { useState } from "react";
import { useParams } from "react-router-dom";
import { useScopeCreep } from "@/contexts/ScopeCreepContext";
import { fmtPct } from "@/lib/calculations";

// ─── Step 4: Root Cause Analysis ──────────────────────────────────────────────

const ROOT_CAUSE_OPTIONS = [
  { id: "pre_construction", label: "Pre-Construction Gaps", desc: "Incomplete scope docs, allowances, spec assumptions" },
  { id: "field_change", label: "Field-Driven Changes", desc: "Conditions discovered on-site not in original scope" },
  { id: "client_requests", label: "Client-Requested Changes", desc: "Owner-directed scope additions or upgrades" },
  { id: "co_process", label: "CO Process Breakdown", desc: "Changes completed but not formally documented or signed" },
  { id: "estimating_skill", label: "Estimating Skill Gap", desc: "Systematic under-estimation by project type or person" },
  { id: "subcontractor", label: "Subcontractor Variability", desc: "Sub bids inaccurate or subs add scope without approval" },
];

export default function ScopeCreepStep4() {
  const { assessment, metrics, updateRootCause, completeStep, isLoading } = useScopeCreep();

  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState(assessment?.root_cause_notes ?? "");
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const handleContinue = async () => {
    setSaving(true);
    const combined = selected.length > 0
      ? `Primary drivers: ${selected.join(", ")}.\n\n${notes}`
      : notes;
    await updateRootCause({ root_cause_notes: combined });
    await completeStep(4);
    setSaving(false);
  };

  const leakage = metrics?.total_margin_leakage ?? 0;
  const captureRate = metrics?.co_capture_rate ?? 1;
  const accuracy = metrics?.avg_estimate_accuracy ?? 1;

  return (
    <div>
      {/* Context recap */}
      <div style={{ background: "#F7FAF5", border: "1px solid #DCE8D4", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 24 }}>
        {[
          { label: "Leakage Source", value: leakage > 0 ? `$${Math.round(leakage).toLocaleString()}` : "None detected", color: leakage > 0 ? "#C0392B" : "#4A5C3A" },
          { label: "Estimation Accuracy", value: `${((accuracy - 1) * 100).toFixed(1)}% overrun`, color: accuracy > 1.1 ? "#C0392B" : "#4A5C3A" },
          { label: "CO Capture", value: fmtPct(captureRate), color: captureRate < 0.8 ? "#C0392B" : "#4A5C3A" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA89A", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Root cause selector */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#1A2018", fontFamily: "'DM Sans', sans-serif" }}>
          What is driving scope creep?
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>
          Select all that apply based on the analysis results and your field observations.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {ROOT_CAUSE_OPTIONS.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <div
                key={opt.id}
                onClick={() => toggle(opt.id)}
                style={{
                  padding: "14px 16px",
                  border: `1.5px solid ${isSelected ? "#4A5C3A" : "#EEF0EC"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  background: isSelected ? "#F7FAF5" : "#FAFAFA",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${isSelected ? "#4A5C3A" : "#D0D8CC"}`,
                    background: isSelected ? "#4A5C3A" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l3 3L8.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#4A5C3A" : "#1A2018", fontFamily: "'DM Sans', sans-serif" }}>{opt.label}</span>
                </div>
                <div style={{ fontSize: 11, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif", paddingLeft: 28 }}>{opt.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1A2018", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
          Consultant observations (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Document specific patterns, conversations with estimators, field conditions, or any additional context about what's driving these numbers…"
          style={{
            width: "100%", padding: "12px 14px", border: "1.5px solid #EEF0EC", borderRadius: 8,
            fontSize: 13, color: "#1A2018", resize: "vertical" as const, outline: "none",
            fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, boxSizing: "border-box" as const,
          }}
        />
      </div>

      <button
        onClick={handleContinue}
        disabled={saving || isLoading}
        style={{
          width: "100%", padding: "13px", background: saving ? "#B8C8B0" : "#4A5C3A",
          color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {saving ? "Saving…" : "Build Recovery Model →"}
      </button>
    </div>
  );
}
