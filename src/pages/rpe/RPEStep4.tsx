import { useState } from "react";
import { useRPE, SCORING_CATEGORIES, SCORE_LABELS } from "@/contexts/RPEContext";

const S = {
  green: "#4A5C3A",
  gold: "#B8A94A",
  red: "#C0392B",
  text: "#1A2018",
  muted: "#6B7A67",
  faint: "#9CA89A",
  border: "#EEF0EC",
  sans: "'DM Sans', sans-serif" as const,
  mono: "'DM Mono', monospace" as const,
};

export default function RPEStep4() {
  const { stepData, saveStepData, completeStep } = useRPE();
  const [saving, setSaving] = useState(false);

  // Find lowest-scored category automatically
  const scoreKeys = SCORING_CATEGORIES.map((c) => c.key);
  const scoredCategories = scoreKeys
    .map((k) => ({
      key: k,
      label: SCORING_CATEGORIES.find((c) => c.key === k)!.label,
      score: (stepData as any)[k] as number | null,
    }))
    .filter((c) => c.score !== null)
    .sort((a, b) => a.score! - b.score!);

  const primaryConstraint = scoredCategories[0] ?? null;

  const [form, setForm] = useState({
    primary_constraint: stepData.primary_constraint ?? primaryConstraint?.label ?? "",
    constraint_notes: stepData.constraint_notes ?? "",
  });

  const handleNext = async () => {
    setSaving(true);
    try {
      saveStepData(form);
      await completeStep(4, form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Guidance card */}
      <div style={{ background: "#F7FAF5", border: "1.5px solid #C8D8C0", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 12 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M9 2L2 7v9h5v-5h4v5h5V7L9 2z" stroke={S.green} strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.green, marginBottom: 4, fontFamily: S.sans }}>
            💡 CONSULTANT PLAYBOOK — Constraint Evidence
          </div>
          <div style={{ fontSize: 13, color: S.muted, fontFamily: S.sans, lineHeight: 1.6 }}>
            The scoring data points to the likely constraint. Your job now is to gather evidence that confirms or challenges it.
            Push past the client's surface answers — the constraint almost always lives upstream of where the pain is felt.
          </div>
        </div>
      </div>

      {/* Score summary radar */}
      {scoredCategories.length > 0 && (
        <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 16, fontFamily: S.sans }}>
            Category Score Summary
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {scoredCategories.map(({ key, label, score }) => {
              const info = SCORE_LABELS[score!];
              const barPct = ((score! / 4) * 100);
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: S.text, fontFamily: S.sans, fontWeight: score === scoredCategories[0].score ? 700 : 400 }}>
                      {label}
                      {score === scoredCategories[0].score && (
                        <span style={{ marginLeft: 8, fontSize: 10, background: "#FEF2F2", color: "#C0392B", padding: "2px 6px", borderRadius: 4, fontWeight: 600, fontFamily: S.sans }}>
                          Primary Constraint
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: info.color, fontFamily: S.mono }}>{score}/4</span>
                  </div>
                  <div style={{ height: 6, background: "#F0F2EE", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${barPct}%`, height: "100%", background: info.color, borderRadius: 3, transition: "width 0.4s ease" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evidence form */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: S.sans }}>
            Primary Constraint Area
          </label>
          <select
            value={form.primary_constraint}
            onChange={(e) => setForm({ ...form, primary_constraint: e.target.value })}
            style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${S.border}`, borderRadius: 10, fontFamily: S.sans, fontSize: 14, color: S.text, background: "#FFFFFF", outline: "none", cursor: "pointer", height: 42 }}
          >
            <option value="">Select the primary constraint…</option>
            {SCORING_CATEGORIES.map((c) => (
              <option key={c.key} value={c.label}>{c.label}</option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: S.faint, marginTop: 4, fontFamily: S.sans }}>
            Auto-populated from your lowest score — override if your field observation differs
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: S.sans }}>
            Constraint Evidence Notes
          </label>
          <textarea
            rows={6}
            value={form.constraint_notes}
            onChange={(e) => setForm({ ...form, constraint_notes: e.target.value })}
            placeholder="What specific observations from your interviews and intake data support this constraint identification?

Examples:
- No documented estimating process — each estimator uses their own spreadsheet
- 3 key decisions bottleneck through the owner daily
- AR aging shows 40%+ past 60 days — billing is reactive not proactive
- Rework rate unknown — no tracking system in place"
            style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${S.border}`, borderRadius: 10, fontFamily: S.sans, fontSize: 13, color: S.text, background: "#FFFFFF", outline: "none", resize: "vertical" as const, lineHeight: 1.6, boxSizing: "border-box" as const }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
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
          {saving ? "Saving…" : "Next — Capacity & WIP →"}
        </button>
      </div>
    </div>
  );
}
