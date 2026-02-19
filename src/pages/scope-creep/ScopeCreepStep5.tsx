import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScopeCreep } from "@/contexts/ScopeCreepContext";
import { fmt$$, fmtPct } from "@/lib/calculations";

// ─── Step 5: Impact Model & Recovery Scenarios ────────────────────────────────

const RECOVERY_SCENARIOS = [
  {
    id: "scope_doc",
    label: "Pre-Construction Scope Lock",
    desc: "Standardized scope documentation + client sign-off before mobilization",
    lift: 0.4,
  },
  {
    id: "co_process",
    label: "CO Process Overhaul",
    desc: "Real-time CO tracking, weekly reconciliation, digital signature workflow",
    lift: 0.5,
  },
  {
    id: "estimating_training",
    label: "Estimating Accuracy Program",
    desc: "Historical job costing analysis + allowance recalibration by project type",
    lift: 0.3,
  },
  {
    id: "field_checklist",
    label: "Field Discovery Protocol",
    desc: "Pre-construction site walk checklist to capture hidden conditions early",
    lift: 0.25,
  },
];

export default function ScopeCreepStep5() {
  const navigate = useNavigate();
  const { assessment, metrics, updateImpactModel, completeStep, isLoading } = useScopeCreep();

  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [targetAccuracy, setTargetAccuracy] = useState(5); // % overrun target
  const [targetCORate, setTargetCORate] = useState(90); // % CO capture target
  const [saving, setSaving] = useState(false);

  const leakage = metrics?.total_margin_leakage ?? 0;
  const revenue = metrics?.total_contract_value ?? 1;
  const currentAccuracy = metrics?.avg_estimate_accuracy ?? 1;
  const currentCORate = metrics?.co_capture_rate ?? 1;

  // Estimated recovery: assume we recover to target
  const targetAccuracyRatio = 1 + targetAccuracy / 100;
  const targetCORatio = targetCORate / 100;

  const currentOverrunCost = Math.max((currentAccuracy - targetAccuracyRatio) * revenue, 0);
  const currentCOLeakage = metrics?.co_leakage_dollars ?? 0;
  const recoverableCO = Math.max((targetCORatio - currentCORate) * ((metrics?.co_leakage_dollars ?? 0) + (metrics?.co_capture_rate ?? 1)), 0);
  const totalRecoverable = currentOverrunCost + Math.min(currentCOLeakage, currentCOLeakage * (targetCORatio - currentCORate) / (1 - currentCORate + 0.001)) || 0;
  const conservativeRecovery = leakage * 0.4;

  const toggle = (id: string) => {
    setSelectedScenarios((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const handleComplete = async () => {
    setSaving(true);
    const model = {
      selected_scenarios: selectedScenarios,
      target_accuracy_pct: targetAccuracy,
      target_co_rate_pct: targetCORate,
      estimated_recovery: conservativeRecovery,
      leakage_baseline: leakage,
    };
    await updateImpactModel(model);
    await completeStep(5);
    setSaving(false);
    navigate("/dashboard");
  };

  return (
    <div>
      {/* Recovery summary hero */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 16, padding: "24px 28px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#1A2018", fontFamily: "'DM Sans', sans-serif" }}>
              Recovery Potential
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>
              Based on {metrics?.job_metrics.length ?? 0} jobs analyzed · Conservative 40% recovery scenario
            </p>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#4A5C3A", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
              {fmt$$(conservativeRecovery)}
            </div>
            <div style={{ fontSize: 12, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif', marginTop: 4" }}>
              recoverable margin
            </div>
          </div>
        </div>

        {/* Target sliders */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4A5048", fontFamily: "'DM Sans', sans-serif" }}>
                Target Estimation Accuracy
              </label>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4A5C3A", fontFamily: "'DM Mono', monospace" }}>
                ≤{targetAccuracy}% overrun
              </span>
            </div>
            <input
              type="range" min={0} max={15} step={1} value={targetAccuracy}
              onChange={(e) => setTargetAccuracy(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: "#4A5C3A" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>0% (perfect)</span>
              <span style={{ fontSize: 10, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>15% (baseline)</span>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4A5048", fontFamily: "'DM Sans', sans-serif" }}>
                Target CO Capture Rate
              </label>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4A5C3A", fontFamily: "'DM Mono', monospace" }}>
                {targetCORate}%
              </span>
            </div>
            <input
              type="range" min={65} max={100} step={5} value={targetCORate}
              onChange={(e) => setTargetCORate(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: "#4A5C3A" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>65%</span>
              <span style={{ fontSize: 10, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery scenarios */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#1A2018", fontFamily: "'DM Sans', sans-serif" }}>
          Recovery Playbook
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>
          Select the interventions to include in this client's action plan.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {RECOVERY_SCENARIOS.map((scenario) => {
            const isSelected = selectedScenarios.includes(scenario.id);
            const estRecovery = leakage * scenario.lift;
            return (
              <div
                key={scenario.id}
                onClick={() => toggle(scenario.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  border: `1.5px solid ${isSelected ? "#4A5C3A" : "#EEF0EC"}`,
                  borderRadius: 10, cursor: "pointer",
                  background: isSelected ? "#F7FAF5" : "#FAFAFA",
                  transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 5,
                  border: `2px solid ${isSelected ? "#4A5C3A" : "#D0D8CC"}`,
                  background: isSelected ? "#4A5C3A" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {isSelected && (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5l3 3L9 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#4A5C3A" : "#1A2018", marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>
                    {scenario.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>{scenario.desc}</div>
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#4A5C3A", fontFamily: "'DM Mono', monospace" }}>
                    ~{fmt$$(estRecovery)}
                  </div>
                  <div style={{ fontSize: 10, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>est. recovery</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final summary */}
      {selectedScenarios.length > 0 && (
        <div style={{ background: "#F7FAF5", border: "1.5px solid #C8D8C0", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#4A5C3A", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
                Selected Playbook
              </div>
              <div style={{ fontSize: 13, color: "#4A5048", fontFamily: "'DM Sans', sans-serif" }}>
                {selectedScenarios.length} intervention{selectedScenarios.length > 1 ? "s" : ""} · Combined uplift potential
              </div>
            </div>
            <div style={{ textAlign: "right" as const }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#4A5C3A", fontFamily: "'DM Mono', monospace" }}>
                {fmt$$(RECOVERY_SCENARIOS.filter((s) => selectedScenarios.includes(s.id)).reduce((sum, s) => sum + leakage * s.lift, 0))}
              </div>
              <div style={{ fontSize: 10, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>combined est. recovery</div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleComplete}
        disabled={saving || isLoading}
        style={{
          width: "100%", padding: "13px", background: saving ? "#B8C8B0" : "#4A5C3A",
          color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {saving ? "Completing…" : "✓ Complete Scope Creep Analysis → Return to Hub"}
      </button>
    </div>
  );
}
