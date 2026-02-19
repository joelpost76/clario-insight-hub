import { useState } from "react";
import { useRPE, SCORING_CATEGORIES, SCORE_LABELS } from "@/contexts/RPEContext";

const S = {
  green: "#4A5C3A",
  text: "#1A2018",
  muted: "#6B7A67",
  faint: "#9CA89A",
  border: "#EEF0EC",
  sans: "'DM Sans', sans-serif" as const,
  mono: "'DM Mono', monospace" as const,
};

const SCORE_OPTIONS = [
  { value: 4, label: "4 — Performing", desc: "Process is documented, consistent, and producing strong results" },
  { value: 3, label: "3 — Adequate", desc: "Works most of the time with occasional breakdowns" },
  { value: 2, label: "2 — At Risk", desc: "Inconsistent performance with visible gaps" },
  { value: 1, label: "1 — Constrained", desc: "Frequent failures, workarounds are the norm" },
  { value: 0, label: "0 — Critical", desc: "Process is broken or essentially non-existent" },
];

function ScoreSelector({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  const info = value !== null ? SCORE_LABELS[value] : null;

  return (
    <div style={{ background: "#FFFFFF", border: `1.5px solid ${info?.border ?? S.border}`, borderRadius: 14, padding: "20px 22px", transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: S.text, marginBottom: 4, fontFamily: S.sans }}>{label}</div>
          <div style={{ fontSize: 12, color: S.muted, fontFamily: S.sans }}>{description}</div>
        </div>
        {value !== null && (
          <div style={{ textAlign: "right" as const, flexShrink: 0, marginLeft: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: info?.color, fontFamily: S.mono, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: info?.color, fontFamily: S.sans }}>{info?.label}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {SCORE_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          const optInfo = SCORE_LABELS[opt.value];
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              title={opt.desc}
              style={{
                flex: 1,
                padding: "10px 4px",
                border: `2px solid ${isSelected ? optInfo.color : S.border}`,
                borderRadius: 8,
                background: isSelected ? optInfo.bg : "#FAFAF9",
                cursor: "pointer",
                fontFamily: S.mono,
                fontSize: 16,
                fontWeight: 700,
                color: isSelected ? optInfo.color : S.faint,
                transition: "all 0.15s",
              }}
            >
              {opt.value}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "#C0392B", fontFamily: S.sans }}>Critical</span>
        <span style={{ fontSize: 10, color: S.green, fontFamily: S.sans }}>Performing</span>
      </div>
    </div>
  );
}

export default function RPEStep3() {
  const { stepData, saveStepData, completeStep } = useRPE();
  const [saving, setSaving] = useState(false);

  const [scores, setScores] = useState<Record<string, number | null>>({
    score_sales_marketing: stepData.score_sales_marketing ?? null,
    score_design_estimating: stepData.score_design_estimating ?? null,
    score_ops_production: stepData.score_ops_production ?? null,
    score_project_management: stepData.score_project_management ?? null,
    score_finance_admin: stepData.score_finance_admin ?? null,
    score_leadership: stepData.score_leadership ?? null,
  });
  const [error, setError] = useState<string | null>(null);

  const filledCount = Object.values(scores).filter((v) => v !== null).length;
  const avgScore = filledCount > 0
    ? Object.values(scores).filter((v) => v !== null).reduce((a, b) => a! + b!, 0)! / filledCount
    : null;

  const handleNext = async () => {
    if (filledCount < 6) {
      setError("Please score all 6 categories before continuing.");
      return;
    }
    setSaving(true);
    try {
      saveStepData(scores as any);
      await completeStep(3, scores as any);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Guidance card */}
      <div style={{ background: "#F7FAF5", border: "1.5px solid #C8D8C0", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 12 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="9" cy="9" r="7.5" stroke={S.green} strokeWidth="1.4"/>
          <path d="M9 6v4M9 12v.5" stroke={S.green} strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.green, marginBottom: 4, fontFamily: S.sans }}>
            💡 CONSULTANT GUIDANCE — Score what you observe, not what the client claims
          </div>
          <div style={{ fontSize: 13, color: S.muted, fontFamily: S.sans, lineHeight: 1.6 }}>
            Use the intake data, interview notes, and your direct observation to score each category.
            A "4" means the process is documented, consistent, and producing strong results.
            A "0" means it's essentially non-existent. Be honest — under-scoring is rare, over-scoring is the common mistake.
          </div>
        </div>
      </div>

      {/* Score summary bar */}
      {avgScore !== null && (
        <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, color: S.muted, fontFamily: S.sans }}>{filledCount} of 6 categories scored</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 11, color: S.faint, fontFamily: S.sans }}>Average</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: S.green, fontFamily: S.mono }}>{avgScore.toFixed(1)}<span style={{ fontSize: 13, color: S.faint }}>/4</span></div>
          </div>
        </div>
      )}

      {/* Category scorers */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {SCORING_CATEGORIES.map((cat) => (
          <ScoreSelector
            key={cat.key}
            label={cat.label}
            description={cat.description}
            value={scores[cat.key]}
            onChange={(v) => {
              setScores((prev) => ({ ...prev, [cat.key]: v }));
              setError(null);
            }}
          />
        ))}
      </div>

      {error && (
        <div style={{ marginTop: 16, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#C0392B", fontFamily: S.sans }}>
          {error}
        </div>
      )}

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
          {saving ? "Saving…" : "Next — Constraint Identification →"}
        </button>
      </div>
    </div>
  );
}
