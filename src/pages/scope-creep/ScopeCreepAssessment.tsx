import { useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { ScopeCreepProvider, useScopeCreep } from "@/contexts/ScopeCreepContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useWorkspace } from "@/contexts/WorkspaceContext";

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  "Setup",
  "Job Review",
  "Analysis",
  "Root Cause",
  "Impact & Recovery",
];

function StepBar({ currentStep }: { currentStep: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < currentStep;
        const active = step === currentStep;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: step < STEPS.length ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? "#4A5C3A" : active ? "#4A5C3A" : "#F0F2EE",
                border: done || active ? "2px solid #4A5C3A" : "2px solid #E0E4DC",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done || active ? "white" : "#9CA89A",
                fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                flexShrink: 0,
              }}>
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3.5 3.5L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : step}
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 400,
                color: active ? "#1A2018" : "#9CA89A",
                fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
              }}>{label}</span>
            </div>
            {step < STEPS.length && (
              <div style={{ flex: 1, height: 2, background: done ? "#4A5C3A" : "#EEF0EC", margin: "0 6px", marginBottom: 20, borderRadius: 2 }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Inner wrapper that loads assessment ─────────────────────────────────────
function ScopeCreepWizardInner() {
  const { id } = useParams<{ id: string }>();
  const { assessment, loadAssessment, isLoading, error } = useScopeCreep();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) loadAssessment(id);
  }, [id]);

  if (isLoading && !assessment) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #4A5C3A", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B7A67", fontSize: 14 }}>Loading assessment…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error && !assessment) {
    return (
      <AppLayout>
        <div style={{ padding: 40, textAlign: "center" }}>
          <p style={{ color: "#C0392B", fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
          <button onClick={() => navigate("/dashboard")} style={{ marginTop: 16, padding: "10px 20px", background: "#4A5C3A", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Back to Hub
          </button>
        </div>
      </AppLayout>
    );
  }

  const step = assessment?.current_step ?? 1;

  return (
    <AppLayout>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6B7A67", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginBottom: 16, padding: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Hub
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1A2018", letterSpacing: "-0.5px", fontFamily: "'DM Sans', sans-serif" }}>
                Scope Creep Analyzer
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>
                Module 2 · Identify estimation gaps and change order leakage
              </p>
            </div>
            <div style={{ background: "#F0F4EE", border: "1px solid #C8D8C0", borderRadius: 8, padding: "6px 14px" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#4A5C3A", fontFamily: "'DM Sans', sans-serif" }}>Step {step} of 5</span>
            </div>
          </div>
        </div>

        <StepBar currentStep={step} />

        <Outlet />
      </div>
    </AppLayout>
  );
}

// ─── Exported wrapper with context ───────────────────────────────────────────
export default function ScopeCreepAssessment() {
  return (
    <ScopeCreepProvider>
      <ScopeCreepWizardInner />
    </ScopeCreepProvider>
  );
}
