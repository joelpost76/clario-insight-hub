import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScopeCreep } from "@/contexts/ScopeCreepContext";
import { fmt$$, fmtPct } from "@/lib/calculations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Step 5: Impact Model ──────────────────────────────────────────────────────

const S = {
  green: "#4A5C3A",
  gold: "#B8A94A",
  red: "#C0392B",
  text: "#1A2018",
  muted: "#6B7A67",
  faint: "#9CA89A",
  border: "#EEF0EC",
  bg: "#FAFAFA",
  card: "#FFFFFF",
  greenBg: "#F7FAF5",
  greenBorder: "#C8D8C0",
  mono: "'DM Mono', monospace" as const,
  sans: "'DM Sans', sans-serif" as const,
};

function ScenarioRow({
  label, current, target90, target12m, mono, color,
}: {
  label: string; current: string; target90: string; target12m: string;
  mono?: boolean; color?: string;
}) {
  const font = mono ? S.mono : S.sans;
  return (
    <tr style={{ borderBottom: `1px solid ${S.border}` }}>
      <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 600, color: S.text, fontFamily: S.sans }}>{label}</td>
      <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: font, color: color ?? S.muted, textAlign: "center" as const }}>{current}</td>
      <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: font, color: S.green, fontWeight: 700, textAlign: "center" as const }}>{target90}</td>
      <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: font, color: S.gold, fontWeight: 700, textAlign: "center" as const }}>{target12m}</td>
    </tr>
  );
}

// ─── RPE Impact Panel ─────────────────────────────────────────────────────────
function RPEImpactPanel({
  recoveryAmount,
  clientId,
}: {
  recoveryAmount: number;
  clientId: string | undefined;
}) {
  const { data: rpeData } = useQuery({
    queryKey: ["rpe-impact", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data } = await supabase
        .from("assessments")
        .select("total_weighted_score, score_label")
        .eq("client_id", clientId)
        .eq("is_complete", true)
        .eq("module_type", "rpe")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!clientId,
  });

  if (!rpeData?.total_weighted_score) {
    return (
      <div style={{ background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8.5" stroke={S.faint} strokeWidth="1.3"/>
          <path d="M10 6v5M10 13v.5" stroke={S.faint} strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <div style={{ fontSize: 13, color: S.faint, fontFamily: S.sans }}>
          Complete an RPE Assessment to see the cross-module score impact for this client.
        </div>
      </div>
    );
  }

  const rpeScore = rpeData.total_weighted_score;
  // Model: recovering margin improves RPE score proportionally
  const impliedScoreBoost = Math.min((recoveryAmount / 50_000) * 2, 8);
  const impliedNewScore = Math.min(Math.round(rpeScore + impliedScoreBoost), 100);
  const improvement = impliedNewScore - rpeScore;

  return (
    <div style={{
      background: S.greenBg, border: `1.5px solid ${S.greenBorder}`,
      borderRadius: 12, padding: "16px 20px", marginBottom: 16,
      display: "flex", gap: 20, alignItems: "center",
    }}>
      <div style={{ flexShrink: 0, textAlign: "center" as const }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid #FECACA`, display: "flex", alignItems: "center", justifyContent: "center", background: "#FEF2F2" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: S.red, fontFamily: S.mono }}>{rpeScore}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke={S.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${S.green}`, display: "flex", alignItems: "center", justifyContent: "center", background: "#EEF4EA" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: S.green, fontFamily: S.mono }}>{impliedNewScore}</span>
          </div>
        </div>
        <div style={{ fontSize: 9, color: S.faint, fontFamily: S.sans }}>RPE score</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.green, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4, fontFamily: S.sans }}>
          RPE Score Impact
        </div>
        <div style={{ fontSize: 13, color: S.text, fontFamily: S.sans, lineHeight: 1.5 }}>
          Recovering <strong style={{ fontFamily: S.mono }}>{fmt$$(recoveryAmount)}</strong> in margin is modeled to lift the RPE score{" "}
          <strong style={{ fontFamily: S.mono, color: S.red }}>{rpeScore}</strong> →{" "}
          <strong style={{ fontFamily: S.mono, color: S.green }}>{impliedNewScore}</strong>{" "}
          <span style={{ color: S.green }}>( +{improvement} pts )</span>
          {rpeData.score_label && (
            <span style={{ color: S.muted }}> — current tier: {rpeData.score_label}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ScopeCreepStep5() {
  const navigate = useNavigate();
  const { assessment, metrics, updateImpactModel, completeStep, isLoading } = useScopeCreep();

  const [recoveryRate, setRecoveryRate] = useState(40);
  const [targetOverrunPct, setTargetOverrunPct] = useState(5);
  const [saving, setSaving] = useState(false);

  const leakage = metrics?.total_margin_leakage ?? 0;
  const currentAccuracy = metrics?.avg_estimate_accuracy ?? 1;
  const currentCORate = metrics?.co_capture_rate ?? 1;

  const recoverableMargin = leakage * (recoveryRate / 100);
  const annualizedRecoverable = recoverableMargin * (12 / 3);

  const target90OverrunPct = targetOverrunPct;
  const target90CORate = Math.min(currentCORate + (1 - currentCORate) * 0.6, 0.95);
  const target90Leakage = leakage * (1 - recoveryRate / 100);
  const target90Recoverable = recoverableMargin;

  const target12mOverrunPct = Math.max(targetOverrunPct - 2, 0);
  const target12mCORate = Math.min(currentCORate + (1 - currentCORate) * 0.9, 0.98);
  const target12mLeakage = leakage * 0.15;
  const target12mRecoverable = annualizedRecoverable;

  const handleComplete = async () => {
    setSaving(true);
    const model = {
      recovery_rate_pct: recoveryRate,
      target_overrun_pct: targetOverrunPct,
      recoverable_margin: recoverableMargin,
      annualized_recoverable: annualizedRecoverable,
      leakage_baseline: leakage,
    };
    await updateImpactModel(model);
    await completeStep(5);
    setSaving(false);
    navigate("/dashboard");
  };

  return (
    <div>
      {/* ── Hero: Recovery sliders ───────────────────────────────────────────── */}
      <div style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 16, padding: "24px 28px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: S.text, fontFamily: S.sans }}>
              Recovery Impact Model
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: S.muted, fontFamily: S.sans }}>
              Adjust sliders to model realistic 90-day recovery outcomes.
            </p>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4, fontFamily: S.sans }}>
              90-Day Recoverable
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: S.green, fontFamily: S.mono, lineHeight: 1 }}>
              {fmt$$(recoverableMargin)}
            </div>
            <div style={{ fontSize: 11, color: S.faint, fontFamily: S.sans, marginTop: 4 }}>
              {fmt$$(annualizedRecoverable)} annualized
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#4A5048", fontFamily: S.sans }}>
                90-Day Recovery Rate
              </label>
              <span style={{ fontSize: 15, fontWeight: 700, color: S.green, fontFamily: S.mono }}>
                {recoveryRate}%
              </span>
            </div>
            <input
              type="range" min={0} max={100} step={5} value={recoveryRate}
              onChange={(e) => setRecoveryRate(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: S.green }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span style={{ fontSize: 10, color: S.faint, fontFamily: S.sans }}>0%</span>
              <span style={{ fontSize: 10, color: S.faint, fontFamily: S.sans }}>100%</span>
            </div>
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#F7FAF5", borderRadius: 7 }}>
              <div style={{ fontSize: 11, color: S.green, fontFamily: S.sans }}>
                = <strong style={{ fontFamily: S.mono }}>{fmt$$(recoverableMargin)}</strong> recovered from{" "}
                <strong style={{ fontFamily: S.mono }}>{fmt$$(leakage)}</strong> total leakage
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#4A5048", fontFamily: S.sans }}>
                Target Estimation Accuracy
              </label>
              <span style={{ fontSize: 15, fontWeight: 700, color: S.green, fontFamily: S.mono }}>
                ≤{targetOverrunPct}% overrun
              </span>
            </div>
            <input
              type="range" min={0} max={15} step={1} value={targetOverrunPct}
              onChange={(e) => setTargetOverrunPct(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: S.green }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span style={{ fontSize: 10, color: S.faint, fontFamily: S.sans }}>0% (perfect)</span>
              <span style={{ fontSize: 10, color: S.faint, fontFamily: S.sans }}>15% (baseline)</span>
            </div>
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#F7FAF5", borderRadius: 7 }}>
              <div style={{ fontSize: 11, color: S.muted, fontFamily: S.sans }}>
                Current: <strong style={{ fontFamily: S.mono, color: currentAccuracy > 1.1 ? S.red : S.gold }}>
                  +{((currentAccuracy - 1) * 100).toFixed(1)}%
                </strong>{" "}
                → Target: <strong style={{ fontFamily: S.mono, color: S.green }}>+{targetOverrunPct}%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scenario table ─────────────────────────────────────────────────── */}
      <div style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${S.border}` }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: S.text, fontFamily: S.sans }}>
            Scenario Comparison
          </h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: S.bg }}>
                <th style={{ padding: "11px 14px", textAlign: "left" as const, fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: S.sans }}>Metric</th>
                <th style={{ padding: "11px 14px", textAlign: "center" as const, fontSize: 11, fontWeight: 600, color: S.red, textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: S.sans }}>Current State</th>
                <th style={{ padding: "11px 14px", textAlign: "center" as const, fontSize: 11, fontWeight: 600, color: S.green, textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: S.sans }}>90-Day Target</th>
                <th style={{ padding: "11px 14px", textAlign: "center" as const, fontSize: 11, fontWeight: 600, color: S.gold, textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: S.sans }}>12-Month Potential</th>
              </tr>
            </thead>
            <tbody>
              <ScenarioRow
                label="Avg Overrun %"
                current={`+${((currentAccuracy - 1) * 100).toFixed(1)}%`}
                target90={`≤+${target90OverrunPct}%`}
                target12m={`≤+${target12mOverrunPct}%`}
                mono color={currentAccuracy > 1.15 ? S.red : S.gold}
              />
              <ScenarioRow
                label="CO Capture Rate"
                current={fmtPct(currentCORate)}
                target90={fmtPct(target90CORate)}
                target12m={fmtPct(target12mCORate)}
                mono color={currentCORate < 0.75 ? S.red : S.gold}
              />
              <ScenarioRow
                label="Margin Leakage ($)"
                current={fmt$$(leakage)}
                target90={fmt$$(target90Leakage)}
                target12m={fmt$$(target12mLeakage)}
                mono color={leakage > 0 ? S.red : S.green}
              />
              <ScenarioRow
                label="Recoverable Margin ($)"
                current="—"
                target90={fmt$$(target90Recoverable)}
                target12m={fmt$$(target12mRecoverable)}
                mono
              />
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 20px", background: S.bg, borderTop: `1px solid ${S.border}` }}>
          <p style={{ margin: 0, fontSize: 11, color: S.faint, fontFamily: S.sans }}>
            90-Day Target assumes {recoveryRate}% recovery rate at ≤{targetOverrunPct}% overrun goal. 12-Month Potential assumes full implementation with sustained discipline.
          </p>
        </div>
      </div>

      {/* ── RPE Impact panel ──────────────────────────────────────────────────── */}
      <RPEImpactPanel
        recoveryAmount={recoverableMargin}
        clientId={assessment?.client_id}
      />

      {/* ── Consultant Playbook ────────────────────────────────────────────────── */}
      <div style={{ background: "#F0F4EE", border: `1.5px solid ${S.greenBorder}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: S.green, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8, fontFamily: S.sans }}>
          💡 Consultant Playbook
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            `Present the ${fmt$$(recoverableMargin)} 90-day recovery figure as the anchor number in the kickoff meeting.`,
            `Use the Scenario Table to show the client what "good" looks like — frame targets as achievable, not aspirational.`,
            `Link the CO Capture improvement to process, not blame — position it as a system fix, not a people fix.`,
            `Look for: who owns the estimate, how scope changes are communicated to the client, and what happens when a client says "just do it, we'll figure out the paperwork later."`,
          ].map((tip, i) => (
            <li key={i} style={{ fontSize: 12, color: S.green, fontFamily: S.sans, lineHeight: 1.6 }}>{tip}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleComplete}
        disabled={saving || isLoading}
        style={{
          width: "100%", padding: "14px",
          background: saving || isLoading ? "#B8C8B0" : S.green,
          color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
          cursor: saving || isLoading ? "not-allowed" : "pointer", fontFamily: S.sans,
          letterSpacing: "0.01em",
        }}
      >
        {saving ? "Completing analysis…" : "✓ Complete Scope Creep Analysis → Return to Hub"}
      </button>
    </div>
  );
}
