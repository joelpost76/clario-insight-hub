import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

// Placeholder for the RPE Assessment wizard.
// Steps will be built out as Module 1 of the Clario diagnostic.
export default function RPEAssessment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 720, margin: "0 auto", padding: "48px 0" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B7A67", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 24 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to Client Hub
          </button>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1A2018", letterSpacing: "-0.5px" }}>
            RPE Assessment
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6B7A67" }}>
            Revenue-Per-Employee diagnostic — Module 1 of 4
          </p>
        </div>

        {/* Status card */}
        <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 16, padding: 40, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "#F0F4EE", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="11" stroke="#4A5C3A" strokeWidth="2"/>
              <path d="M9 14.5l3.5 3.5 6.5-7" stroke="#4A5C3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, color: "#1A2018" }}>
            RPE Assessment Created
          </h2>
          <p style={{ margin: "0 0 8px", fontSize: 14, color: "#6B7A67", maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            Assessment ID: <code style={{ background: "#F5F5F5", padding: "2px 6px", borderRadius: 4, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{id?.slice(0, 8)}…</code>
          </p>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: "#6B7A67", maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            The RPE Assessment wizard is the next module to be built. The record has been created in the database — you'll see this client card update to "In Progress" on the hub.
          </p>

          <div style={{ display: "inline-flex", gap: 8, background: "#F7FAF5", border: "1px solid #DCE8D4", borderRadius: 10, padding: "14px 20px", textAlign: "left", marginBottom: 28 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="6.5" stroke="#4A5C3A" strokeWidth="1.3"/>
              <path d="M8 5v4M8 11v.5" stroke="#4A5C3A" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 13, color: "#4A5C3A", fontWeight: 500 }}>
              Coming up: 6-step wizard covering headcount, revenue, capacity utilization, and profit margin benchmarking.
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{ padding: "10px 24px", background: "#4A5C3A", color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              Return to Hub
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
