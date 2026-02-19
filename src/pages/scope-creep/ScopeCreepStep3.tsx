import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useScopeCreep } from "@/contexts/ScopeCreepContext";
import { fmt$$, fmtPct } from "@/lib/calculations";

// ─── Step 3: Analysis Results ─────────────────────────────────────────────────

const BRAND_GREEN = "#4A5C3A";
const BRAND_GOLD = "#B8A94A";
const ALERT_RED = "#C0392B";

function MetricCard({ label, value, sub, color, large }: { label: string; value: string; sub?: string; color?: string; large?: boolean }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: large ? "24px 28px" : "18px 20px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA89A", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
      <div style={{ fontSize: large ? 32 : 24, fontWeight: 700, color: color ?? "#1A2018", fontFamily: "'DM Mono', monospace", letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

// ─── Accuracy gauge ring ─────────────────────────────────────────────────────
function AccuracyRing({ accuracy }: { accuracy: number }) {
  // accuracy = 1.0 is perfect, >1 is overrun
  const overrunPct = Math.max(0, (accuracy - 1) * 100);
  const clampedPct = Math.min(overrunPct, 100);
  const color = accuracy <= 1.05 ? BRAND_GREEN : accuracy <= 1.2 ? BRAND_GOLD : ALERT_RED;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const usedDash = (clampedPct / 100) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="#F0F2EE" strokeWidth="10"/>
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${usedDash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>
            {overrunPct.toFixed(1)}%
          </div>
          <div style={{ fontSize: 10, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>avg overrun</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>
        {accuracy <= 1.05 ? "✓ Strong estimation accuracy" : accuracy <= 1.2 ? "⚠ Moderate overruns detected" : "✗ Significant estimation gaps"}
      </div>
    </div>
  );
}

// ─── CO capture rate bar ─────────────────────────────────────────────────────
function COCaptureBar({ rate }: { rate: number }) {
  const pct = Math.min(rate * 100, 100);
  const color = rate >= 0.9 ? BRAND_GREEN : rate >= 0.65 ? BRAND_GOLD : ALERT_RED;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>CO Capture Rate</span>
        <span style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>{fmtPct(rate)}</span>
      </div>
      <div style={{ height: 8, background: "#F0F2EE", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }}/>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "#C0392B", fontFamily: "'DM Sans', sans-serif" }}>0%</span>
        <span style={{ fontSize: 10, color: "#B8A94A", fontFamily: "'DM Sans', sans-serif" }}>65%</span>
        <span style={{ fontSize: 10, color: "#4A5C3A", fontFamily: "'DM Sans', sans-serif" }}>90%+</span>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>
        {rate >= 0.9
          ? "Excellent — minimal CO leakage"
          : rate >= 0.65
          ? "Moderate — review CO follow-up process"
          : "High leakage — systematic CO capture issue"}
      </div>
    </div>
  );
}

// ─── Pattern breakdown bar chart (horizontal) ─────────────────────────────────
function PatternBreakdown({ data, title }: { data: Record<string, { avg_accuracy: number; count: number }>; title: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1].avg_accuracy - a[1].avg_accuracy);
  if (entries.length === 0) return null;
  const maxAcc = Math.max(...entries.map(([, v]) => v.avg_accuracy), 1.5);

  return (
    <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2018", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>{title}</div>
      {entries.map(([key, { avg_accuracy, count }]) => {
        const pct = ((avg_accuracy - 1) * 100);
        const color = avg_accuracy <= 1.05 ? BRAND_GREEN : avg_accuracy <= 1.2 ? BRAND_GOLD : ALERT_RED;
        const barWidth = ((avg_accuracy - 1) / (maxAcc - 1)) * 100;
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#1A2018", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{key}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>{count} jobs</span>
                <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>
                  {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div style={{ height: 6, background: "#F0F2EE", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(barWidth, 4)}%`, height: "100%", background: color, borderRadius: 3 }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Constraint score panel ───────────────────────────────────────────────────
function ConstraintPanel({ score, accuracy, captureRate }: { score: number; accuracy: number; captureRate: number }) {
  const levels = [
    { min: 0, max: 0, label: "Critical", color: ALERT_RED, bg: "#FEF2F2", border: "#FECACA" },
    { min: 1, max: 1, label: "High Risk", color: ALERT_RED, bg: "#FEF2F2", border: "#FECACA" },
    { min: 2, max: 2, label: "Moderate", color: BRAND_GOLD, bg: "#FFFBEB", border: "#FDE68A" },
    { min: 3, max: 3, label: "Healthy", color: BRAND_GREEN, bg: "#F0F4EE", border: "#C8D8C0" },
    { min: 4, max: 4, label: "Excellent", color: BRAND_GREEN, bg: "#F0F4EE", border: "#C8D8C0" },
  ];
  const level = levels.find((l) => score >= l.min && score <= l.max) ?? levels[0];

  return (
    <div style={{ background: level.bg, border: `1.5px solid ${level.border}`, borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: level.color, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
            Constraint Score (Cross-Validation)
          </div>
          <div style={{ fontSize: 13, color: "#4A5048", fontFamily: "'DM Sans', sans-serif" }}>
            Correlated against RPE Step 3 bottleneck data
          </div>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: level.color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 11, color: level.color, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>/ 4 — {level.label}</div>
        </div>
      </div>

      {/* Score ladder */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[0, 1, 2, 3, 4].map((s) => (
          <div key={s} style={{ flex: 1, height: 6, borderRadius: 3, background: s <= score ? level.color : "#E8EAE6", transition: "background 0.3s" }}/>
        ))}
      </div>

      {/* Cross-validation table */}
      <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "12px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7A67", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>Metric Breakdown</div>
        {[
          { label: "Avg Estimation Accuracy", value: `${((accuracy - 1) * 100).toFixed(1)}% overrun`, threshold: accuracy <= 1.05 ? "Within 5% — excellent" : accuracy <= 1.2 ? "Moderate overruns" : "High overruns — investigate", ok: accuracy <= 1.1 },
          { label: "CO Capture Rate", value: fmtPct(captureRate), threshold: captureRate >= 0.9 ? "Strong capture" : captureRate >= 0.65 ? "Moderate leakage" : "Significant leakage", ok: captureRate >= 0.8 },
        ].map(({ label, value, threshold, ok }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2018", marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
              <div style={{ fontSize: 11, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>{threshold}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: ok ? BRAND_GREEN : ALERT_RED, fontFamily: "'DM Mono', monospace" }}>{value}</span>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: ok ? BRAND_GREEN : ALERT_RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {ok ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2L2 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScopeCreepStep3() {
  const { id } = useParams<{ id: string }>();
  const { metrics, runAnalysis, completeStep, isLoading } = useScopeCreep();

  useEffect(() => {
    if (!metrics) runAnalysis();
  }, []);

  if (!metrics && isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 240 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #4A5C3A", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B7A67", fontSize: 14 }}>Running analysis…</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const { avg_estimate_accuracy, co_capture_rate, co_leakage_dollars, total_margin_leakage, leakage_as_pct_revenue, constraint_score, total_contract_value, by_project_type, by_estimator } = metrics;

  return (
    <div>
      {/* Hero metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <MetricCard
          label="Total Margin Leakage"
          value={fmt$$(total_margin_leakage)}
          sub={`${fmtPct(leakage_as_pct_revenue)} of revenue`}
          color={total_margin_leakage > 0 ? ALERT_RED : BRAND_GREEN}
          large
        />
        <MetricCard
          label="Avg Estimation Overrun"
          value={`${((avg_estimate_accuracy - 1) * 100).toFixed(1)}%`}
          sub={avg_estimate_accuracy <= 1.05 ? "Within tolerance" : "Above threshold"}
          color={avg_estimate_accuracy <= 1.05 ? BRAND_GREEN : avg_estimate_accuracy <= 1.2 ? BRAND_GOLD : ALERT_RED}
        />
        <MetricCard
          label="CO Capture Rate"
          value={fmtPct(co_capture_rate)}
          sub={`$${fmt$$(co_leakage_dollars)} leakage`}
          color={co_capture_rate >= 0.9 ? BRAND_GREEN : co_capture_rate >= 0.65 ? BRAND_GOLD : ALERT_RED}
        />
        <MetricCard
          label="Total Revenue Analyzed"
          value={fmt$$(total_contract_value)}
          sub={`${metrics.job_metrics.length} active jobs`}
          color="#1A2018"
        />
      </div>

      {/* Two-column detail section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Accuracy ring + CO bar */}
        <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2018", marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>Estimation Accuracy</div>
          <AccuracyRing accuracy={avg_estimate_accuracy} />
          <div style={{ borderTop: "1px solid #F0F2EE", marginTop: 20, paddingTop: 20 }}>
            <COCaptureBar rate={co_capture_rate} />
          </div>
        </div>

        {/* Constraint cross-validation */}
        <ConstraintPanel
          score={constraint_score}
          accuracy={avg_estimate_accuracy}
          captureRate={co_capture_rate}
        />
      </div>

      {/* Pattern breakdown by project type and estimator */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <PatternBreakdown data={by_project_type} title="Overrun by Project Type" />
        <PatternBreakdown data={by_estimator} title="Overrun by Estimator" />
      </div>

      <button
        onClick={() => completeStep(3)}
        disabled={isLoading}
        style={{
          width: "100%", padding: "13px", background: isLoading ? "#B8C8B0" : "#4A5C3A",
          color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
          cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Identify Root Cause →
      </button>
    </div>
  );
}
