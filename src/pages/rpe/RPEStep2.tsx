import { useState } from "react";
import { useRPE } from "@/contexts/RPEContext";

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

const BENCHMARKS = [
  { range: "Under $1M", rpe: 95_000, label: "under_1m" },
  { range: "$1M – $3M", rpe: 140_000, label: "1m-3m" },
  { range: "$3M – $5M", rpe: 175_000, label: "3m-5m" },
  { range: "$5M – $10M", rpe: 210_000, label: "5m-10m" },
  { range: "$10M – $25M", rpe: 250_000, label: "10m-25m" },
  { range: "$25M+", rpe: 290_000, label: "25m_plus" },
];

function fmtK(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function RPEGauge({ actual, benchmark }: { actual: number; benchmark: number }) {
  const ratio = benchmark > 0 ? actual / benchmark : 1;
  const pct = Math.min(ratio * 100, 150);
  const color = ratio >= 1.1 ? S.green : ratio >= 0.8 ? S.gold : S.red;
  const r = 56;
  const circ = 2 * Math.PI * r;
  // Show up to 150% on the gauge
  const usedDash = Math.min((pct / 150) * circ, circ);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: 128, height: 128 }}>
        <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="64" cy="64" r={r} fill="none" stroke="#F0F2EE" strokeWidth="10"/>
          <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${usedDash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: S.mono }}>{fmtK(actual)}</div>
          <div style={{ fontSize: 10, color: S.faint, fontFamily: S.sans }}>per employee</div>
        </div>
      </div>
      <div style={{ textAlign: "center" as const }}>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>
          {ratio >= 1.1 ? "Above Benchmark" : ratio >= 0.8 ? "Near Benchmark" : "Below Benchmark"}
        </div>
        <div style={{ fontSize: 11, color: S.faint, fontFamily: S.sans }}>Benchmark: {fmtK(benchmark)}</div>
      </div>
    </div>
  );
}

export default function RPEStep2() {
  const { stepData, saveStepData, completeStep, isLoading } = useRPE();
  const [saving, setSaving] = useState(false);

  // Derive RPE from step 1 data
  const headcount = stepData.headcount ?? 1;
  const revenue = stepData.revenue ?? 0;
  const rpe = headcount > 0 && revenue > 0 ? revenue / headcount : null;

  // Find benchmark for their revenue range
  const revRange = (stepData.industry as string) ?? "";
  const benchmarkObj = BENCHMARKS.find((b) => b.label === revRange) ?? BENCHMARKS[2];
  const benchmark = benchmarkObj.rpe;

  const rpeRatio = rpe !== null && benchmark > 0 ? rpe / benchmark : null;

  const getRPELabel = (ratio: number | null) => {
    if (ratio === null) return null;
    if (ratio >= 1.2) return "High Performer — minimal operational drag";
    if (ratio >= 1.0) return "At or above benchmark — room to optimize";
    if (ratio >= 0.75) return "Below benchmark — operational inefficiencies present";
    return "Significantly below benchmark — systemic constraints likely";
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      await completeStep(2, {
        revenue_per_employee: rpe,
        industry_benchmark_rpe: benchmark,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    window.history.back();
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
          <div style={{ fontSize: 12, fontWeight: 700, color: S.green, marginBottom: 4, fontFamily: S.sans }}>Revenue Efficiency Baseline</div>
          <div style={{ fontSize: 13, color: S.muted, fontFamily: S.sans, lineHeight: 1.6 }}>
            This view shows where the business stands relative to industry peers. 
            The gap between actual RPE and benchmark is the upside opportunity the engagement is solving for.
          </div>
        </div>
      </div>

      {rpe !== null ? (
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24 }}>
          {/* Gauge */}
          <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RPEGauge actual={rpe} benchmark={benchmark} />
          </div>

          {/* Detail panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Hero */}
            <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, fontFamily: S.sans }}>Your RPE</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: S.text, fontFamily: S.mono, letterSpacing: "-2px", lineHeight: 1 }}>{fmtK(rpe)}</div>
              <div style={{ fontSize: 13, color: S.muted, marginTop: 8, fontFamily: S.sans }}>{getRPELabel(rpeRatio)}</div>
            </div>

            {/* Benchmark table */}
            <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14, fontFamily: S.sans }}>Industry Benchmarks</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {BENCHMARKS.map((b) => {
                  const isYours = b.label === revRange;
                  return (
                    <div key={b.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: isYours ? "#F7FAF5" : "transparent", border: isYours ? "1px solid #C8D8C0" : "none" }}>
                      <span style={{ fontSize: 12, color: S.text, fontFamily: S.sans, fontWeight: isYours ? 600 : 400 }}>
                        {b.range} {isYours && <span style={{ fontSize: 10, color: S.green, fontWeight: 600, marginLeft: 6 }}>← yours</span>}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isYours ? S.green : S.muted, fontFamily: S.mono }}>{fmtK(b.rpe)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upside */}
            {rpeRatio !== null && rpeRatio < 1 && (
              <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 6, fontFamily: S.sans }}>
                  ⚡ Upside Opportunity
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#92400E", fontFamily: S.mono }}>
                  {fmtK((benchmark - rpe) * headcount)}
                </div>
                <div style={{ fontSize: 12, color: "#B45309", fontFamily: S.sans }}>
                  Additional annual revenue at benchmark RPE × {headcount} employees
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "40px 32px", textAlign: "center" as const }}>
          <div style={{ fontSize: 14, color: S.muted, fontFamily: S.sans, marginBottom: 8 }}>
            No revenue data entered in Step 1.
          </div>
          <div style={{ fontSize: 12, color: S.faint, fontFamily: S.sans }}>
            Go back and enter annual revenue to see the RPE calculation, or continue to the diagnostic scoring.
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button
          onClick={handleBack}
          style={{ padding: "11px 20px", background: "none", color: S.muted, border: `1.5px solid ${S.border}`, borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: S.sans }}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={saving}
          style={{ padding: "11px 28px", background: S.green, color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: saving ? "wait" : "pointer", fontFamily: S.sans, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Saving…" : "Next — Diagnostic Scoring →"}
        </button>
      </div>
    </div>
  );
}
