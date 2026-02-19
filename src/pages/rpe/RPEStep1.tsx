import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRPE } from "@/contexts/RPEContext";
import { supabase } from "@/integrations/supabase/client";

const S = {
  green: "#4A5C3A",
  text: "#1A2018",
  muted: "#6B7A67",
  faint: "#9CA89A",
  border: "#EEF0EC",
  sans: "'DM Sans', sans-serif" as const,
  mono: "'DM Mono', monospace" as const,
};

const INDUSTRIES = [
  "General Contracting",
  "Specialty Trades",
  "Residential Construction",
  "Commercial Construction",
  "HVAC / Mechanical",
  "Electrical",
  "Plumbing",
  "Roofing",
  "Landscaping / Outdoor Living",
  "Interior Design / Renovation",
  "Custom Home Building",
  "Other",
];

const REVENUE_RANGES = [
  { label: "Under $1M", value: "under_1m" },
  { label: "$1M – $3M", value: "1m-3m" },
  { label: "$3M – $5M", value: "3m-5m" },
  { label: "$5M – $10M", value: "5m-10m" },
  { label: "$10M – $25M", value: "10m-25m" },
  { label: "$25M+", value: "25m_plus" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: `1.5px solid ${S.border}`,
  borderRadius: 10,
  fontFamily: S.sans,
  fontSize: 14,
  color: S.text,
  background: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
};

export default function RPEStep1() {
  const { assessment, stepData, saveStepData, completeStep, isLoading } = useRPE();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    headcount: stepData.headcount?.toString() ?? "",
    revenue: stepData.revenue?.toString() ?? "",
    revenue_range: stepData.industry ?? "",
    industry: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.headcount || isNaN(Number(form.headcount)) || Number(form.headcount) <= 0)
      e.headcount = "Please enter a valid headcount";
    if (!form.revenue_range) e.revenue_range = "Please select a revenue range";
    return e;
  };

  const handleNext = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const data = {
        headcount: Number(form.headcount),
        revenue: form.revenue ? Number(form.revenue) : null,
        industry: form.industry || null,
      };
      saveStepData(data);

      // Persist to clients table if we have a client
      if (assessment?.client_id) {
        await supabase
          .from("clients")
          .update({
            headcount: data.headcount,
            industry: data.industry,
          })
          .eq("id", assessment.client_id);
      }

      await completeStep(1, data);
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
          <div style={{ fontSize: 12, fontWeight: 700, color: S.green, marginBottom: 4, fontFamily: S.sans }}>Why this matters</div>
          <div style={{ fontSize: 13, color: S.muted, fontFamily: S.sans, lineHeight: 1.6 }}>
            Revenue-Per-Employee (RPE) is the single best proxy for operational efficiency in a services business. 
            Headcount and revenue data anchors every calculation in this assessment.
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 14, padding: "28px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Headcount */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: S.sans }}>
              Total Headcount <span style={{ color: "#C0392B" }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.headcount}
              onChange={(e) => { setForm({ ...form, headcount: e.target.value }); setErrors({}); }}
              placeholder="e.g. 24"
              style={{ ...inputStyle, borderColor: errors.headcount ? "#FECACA" : S.border }}
            />
            {errors.headcount && <div style={{ fontSize: 11, color: "#C0392B", marginTop: 4, fontFamily: S.sans }}>{errors.headcount}</div>}
            <div style={{ fontSize: 11, color: S.faint, marginTop: 4, fontFamily: S.sans }}>Include field and office staff</div>
          </div>

          {/* Annual Revenue */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: S.sans }}>
              Annual Revenue ($) <span style={{ color: S.faint, fontWeight: 400 }}>— optional</span>
            </label>
            <input
              type="number"
              min="0"
              value={form.revenue}
              onChange={(e) => setForm({ ...form, revenue: e.target.value })}
              placeholder="e.g. 4500000"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: S.faint, marginTop: 4, fontFamily: S.sans }}>Used to compute exact RPE — leave blank to use range</div>
          </div>

          {/* Revenue Range */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: S.sans }}>
              Revenue Range <span style={{ color: "#C0392B" }}>*</span>
            </label>
            <select
              value={form.revenue_range}
              onChange={(e) => { setForm({ ...form, revenue_range: e.target.value }); setErrors({}); }}
              style={{ ...inputStyle, borderColor: errors.revenue_range ? "#FECACA" : S.border, height: 42, cursor: "pointer" }}
            >
              <option value="">Select range…</option>
              {REVENUE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.revenue_range && <div style={{ fontSize: 11, color: "#C0392B", marginTop: 4, fontFamily: S.sans }}>{errors.revenue_range}</div>}
          </div>

          {/* Industry */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: S.sans }}>
              Industry <span style={{ color: S.faint, fontWeight: 400 }}>— optional</span>
            </label>
            <select
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              style={{ ...inputStyle, height: 42, cursor: "pointer" }}
            >
              <option value="">Select industry…</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>

        {/* RPE preview */}
        {form.headcount && form.revenue && Number(form.headcount) > 0 && Number(form.revenue) > 0 && (
          <div style={{ marginTop: 24, background: "#F7FAF5", border: "1.5px solid #C8D8C0", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8, fontFamily: S.sans }}>RPE Preview</div>
            <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: S.green, fontFamily: S.mono, letterSpacing: "-1px" }}>
                  ${Math.round(Number(form.revenue) / Number(form.headcount)).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: S.muted, fontFamily: S.sans }}>Revenue per employee</div>
              </div>
              <div style={{ borderLeft: `1px solid #C8D8C0`, paddingLeft: 32 }}>
                <div style={{ fontSize: 12, color: S.muted, fontFamily: S.sans, lineHeight: 1.8 }}>
                  <div>Industry benchmark (trades): <strong style={{ fontFamily: S.mono }}>$150K – $250K</strong></div>
                  <div>High performer target: <strong style={{ fontFamily: S.mono }}>$275K+</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button
          onClick={handleNext}
          disabled={saving || isLoading}
          style={{
            padding: "11px 28px", background: S.green, color: "white",
            border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14,
            cursor: saving ? "wait" : "pointer", fontFamily: S.sans,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Next — Revenue Efficiency →"}
        </button>
      </div>
    </div>
  );
}
