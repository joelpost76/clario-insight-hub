import { useEffect } from "react";
import { useParams, useNavigate, Outlet, Navigate } from "react-router-dom";
import { RPEProvider, useRPE } from "@/contexts/RPEContext";
import { AppLayout } from "@/components/layout/AppLayout";

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = ["Company Info", "RPE Baseline", "Diagnostic Score", "Constraint ID", "Capacity & WIP", "Impact Model"];

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
                width: 26, height: 26, borderRadius: "50%",
                background: done ? "#4A5C3A" : active ? "#4A5C3A" : "#F0F2EE",
                border: done || active ? "2px solid #4A5C3A" : "2px solid #E0E4DC",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done || active ? "white" : "#9CA89A",
                fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                flexShrink: 0,
              }}>
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : step}
              </div>
              <span style={{
                fontSize: 9, fontWeight: active ? 600 : 400,
                color: active ? "#1A2018" : "#9CA89A",
                fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                textAlign: "center" as const,
              }}>{label}</span>
            </div>
            {step < STEPS.length && (
              <div style={{ flex: 1, height: 2, background: done ? "#4A5C3A" : "#EEF0EC", margin: "0 4px", marginBottom: 20, borderRadius: 2 }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Inner wrapper that loads assessment ─────────────────────────────────────
function RPEWizardInner() {
  const { id } = useParams<{ id: string }>();
  const { assessment, loadAssessment, isLoading, error } = useRPE();
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
            Back to Client Hub
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1A2018", letterSpacing: "-0.5px", fontFamily: "'DM Sans', sans-serif" }}>
                RPE Assessment
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>
                Module 1 · Revenue-Per-Employee Diagnostic
              </p>
            </div>
            <div style={{ background: "#F0F4EE", border: "1px solid #C8D8C0", borderRadius: 8, padding: "6px 14px" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#4A5C3A", fontFamily: "'DM Sans', sans-serif" }}>Step {step} of 6</span>
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
export default function RPEAssessment() {
  return (
    <RPEProvider>
      <RPEWizardInner />
    </RPEProvider>
  );
}
