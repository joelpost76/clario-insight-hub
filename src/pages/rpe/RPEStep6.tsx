import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

function fmtK(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function RPEStep6() {
  const { assessment, stepData, completeStep } = useRPE();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const headcount = stepData.headcount ?? 0;
  const currentRPE = stepData.revenue_per_employee ?? 0;
  const benchmark = stepData.industry_benchmark_rpe ?? 200_000;
  const targetRPEGain = Math.max(benchmark - currentRPE, 0);

  const [recoveryPct, setRecoveryPct] = useState(50);
  const [months, setMonths] = useState(12);

  // 90-day scenario
  const scenario90d = (recoveryPct / 100) * targetRPEGain * headcount * (3 / 12);
  // 12-month scenario
  const scenario12m = (recoveryPct / 100) * targetRPEGain * headcount;
  // Implied target RPE
  const targetRPE = currentRPE + (recoveryPct / 100) * targetRPEGain;

  const scores = SCORING_CATEGORIES.map((c) => ({
    label: c.label,
    score: (stepData as any)[c.key] as number | null,
  })).filter((c) => c.score !== null).sort((a, b) => a.score! - b.score!);

  const weakestCategory = scores[0]?.label ?? "Operations";
  const avgScore = scores.length > 0
    ? scores.reduce((a, c) => a + c.score!, 0) / scores.length
    : null;

  const handleComplete = async () => {
    setSaving(true);
    try {
      const impactModel = {
        recovery_pct: recoveryPct,
        target_rpe: targetRPE,
        scenario_90d: scenario90d,
        scenario_12m: scenario12m,
        weakest_category: weakestCategory,
      };
      await completeStep(6, { impact_model: impactModel });
      navigate("/dashboard");
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
          <path d="M6 9l2 2 4-4" stroke={S.green} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.green, marginBottom: 4, fontFamily: S.sans }}>Impact Model</div>
          <div style={{ fontSize: 13, color: S.muted, fontFamily: S.sans, lineHeight: 1.6 }}>
            Translate the diagnostic findings into a concrete revenue opportunity.
            This becomes the anchor for your engagement proposal and the client's 90-day target.
          </div>
        </div>
      </div>

      {/* RPE Score Summary */}
      {avgScore !== null && (
        <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6, fontFamily: S.sans }}>Assessment Summary</div>
              <div style={{ fontSize: 13, color: S.muted, fontFamily: S.sans }}>Primary constraint: <strong style={{ color: S.text }}>{weakestCategory}</strong></div>
            </div>
            <div style={{ textAlign: "right" as const }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: S.green, fontFamily: S.mono, lineHeight: 1 }}>{avgScore.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: S.faint, fontFamily: S.sans }}>/ 4.0 avg score</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginTop: 16 }}>
            {scores.map(({ label, score }) => {
              const info = SCORE_LABELS[score!];
              return (
                <div key={label} style={{ textAlign: "center" as const, background: info.bg, border: `1px solid ${info.border}`, borderRadius: 8, padding: "10px 6px" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: info.color, fontFamily: S.mono }}>{score}</div>
                  <div style={{ fontSize: 9, color: info.color, fontFamily: S.sans, marginTop: 2, lineHeight: 1.3 }}>{label.split(" ")[0]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Impact controls */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "24px 28px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: S.text, marginBottom: 20, fontFamily: S.sans }}>Recovery Assumptions</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 10, fontFamily: S.sans }}>
              <span>Recovery Rate</span>
              <span style={{ fontFamily: S.mono, color: S.green }}>{recoveryPct}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={recoveryPct}
              onChange={(e) => setRecoveryPct(Number(e.target.value))}
              style={{ width: "100%", accentColor: S.green }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: S.faint, fontFamily: S.sans }}>
              <span>Conservative (10%)</span>
              <span>Full (100%)</span>
            </div>
            <div style={{ fontSize: 11, color: S.faint, marginTop: 8, fontFamily: S.sans }}>
              What % of the RPE gap is realistically recoverable?
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: S.sans }}>
              Projection Horizon
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  style={{
                    flex: 1, padding: "10px 0", border: `2px solid ${months === m ? S.green : S.border}`,
                    borderRadius: 8, background: months === m ? "#F0F4EE" : "#FAFAF9",
                    color: months === m ? S.green : S.muted, fontFamily: S.sans,
                    fontSize: 13, fontWeight: months === m ? 700 : 400, cursor: "pointer",
                  }}
                >
                  {m}mo
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scenario table */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${S.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: S.text, fontFamily: S.sans }}>Revenue Impact Scenarios</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
          <thead>
            <tr style={{ background: "#F7FAF5" }}>
              {["Metric", "Current State", "90-Day Target", `${months}-Month Potential`].map((h) => (
                <th key={h} style={{ padding: "12px 20px", textAlign: "left" as const, fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: S.sans }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                metric: "RPE",
                current: currentRPE > 0 ? fmtK(currentRPE) : "—",
                target90: currentRPE > 0 ? fmtK(currentRPE + (recoveryPct / 100) * targetRPEGain * 0.25) : "—",
                potential: currentRPE > 0 ? fmtK(targetRPE) : "—",
              },
              {
                metric: "Additional Revenue",
                current: "—",
                target90: headcount > 0 ? fmtK(scenario90d) : "—",
                potential: headcount > 0 ? fmtK(scenario12m) : "—",
              },
              {
                metric: "Primary Constraint",
                current: weakestCategory,
                target90: "In progress",
                potential: "Resolved",
              },
            ].map((row, i) => (
              <tr key={row.metric} style={{ borderTop: `1px solid ${S.border}`, background: i % 2 === 0 ? "#FFFFFF" : "#FAFAF9" }}>
                <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, color: S.text, fontFamily: S.sans }}>{row.metric}</td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: S.muted, fontFamily: S.mono }}>{row.current}</td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: S.gold, fontWeight: 600, fontFamily: S.mono }}>{row.target90}</td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: S.green, fontWeight: 700, fontFamily: S.mono }}>{row.potential}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hero upside callout */}
      {headcount > 0 && currentRPE > 0 && (
        <div style={{ background: "#F0F4EE", border: "1.5px solid #C8D8C0", borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: S.green, marginBottom: 4, fontFamily: S.sans }}>Identified Revenue Upside</div>
            <div style={{ fontSize: 12, color: S.muted, fontFamily: S.sans }}>{recoveryPct}% recovery × {headcount} employees × {months} months</div>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: S.green, fontFamily: S.mono, letterSpacing: "-1px" }}>
              {fmtK(months === 3 ? scenario90d : months === 6 ? scenario12m / 2 : scenario12m)}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <button
          onClick={() => window.history.back()}
          style={{ padding: "11px 20px", background: "none", color: S.muted, border: `1.5px solid ${S.border}`, borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: S.sans }}
        >
          ← Back
        </button>
        <button
          onClick={handleComplete}
          disabled={saving}
          style={{ padding: "11px 32px", background: S.green, color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: saving ? "wait" : "pointer", fontFamily: S.sans, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Completing…" : "Complete Assessment ✓"}
        </button>
      </div>
    </div>
  );
}
