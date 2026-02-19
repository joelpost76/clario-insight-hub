import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useScopeCreep } from "@/contexts/ScopeCreepContext";
import { CLARIO_FIELDS, autoMapColumns } from "@/lib/calculations";

// ─── Step 1: Setup & CSV Upload ───────────────────────────────────────────────

export default function ScopeCreepStep1() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { parsedCSV, parseFileForMapping, uploadAndParseJobs, isLoading, error, setError } = useScopeCreep();
  const [dragOver, setDragOver] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [phase, setPhase] = useState<"upload" | "map">("upload");

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }
    setPhase("upload");
    await parseFileForMapping(file);
    setPhase("map");
  };

  // After CSV is parsed, auto-map and allow overrides
  if (parsedCSV && phase === "map") {
    const autoMap = autoMapColumns(parsedCSV.headers);
    // Merge autoMap with user overrides
    const currentMapping = { ...autoMap, ...mapping };

    const handleConfirm = async () => {
      await uploadAndParseJobs(currentMapping);
      navigate(`/scope-creep/assessment/${id}/step/2`);
    };

    return (
      <div>
        {/* Date range */}
        <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#1A2018", fontFamily: "'DM Sans', sans-serif" }}>
            Analysis Period
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>
            Optional: specify the date range covered by this job data.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Start Date", value: dateStart, set: setDateStart },
              { label: "End Date", value: dateEnd, set: setDateEnd },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{label}</label>
                <input type="date" value={value} onChange={(e) => set(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #EEF0EC", borderRadius: 8, fontSize: 13, color: "#1A2018", background: "#FAFAFA", outline: "none", fontFamily: "'DM Mono', monospace", boxSizing: "border-box" as const }} />
              </div>
            ))}
          </div>
        </div>

        {/* Column mapping */}
        <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1A2018", fontFamily: "'DM Sans', sans-serif" }}>
                Column Mapping
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>
                {parsedCSV.rows.length} rows detected · Map your CSV columns to Clario fields
              </p>
            </div>
            <button
              onClick={() => { setPhase("upload"); setMapping({}); }}
              style={{ background: "none", border: "1px solid #EEF0EC", borderRadius: 7, padding: "5px 12px", fontSize: 12, color: "#6B7A67", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              Re-upload
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {CLARIO_FIELDS.map((field) => (
              <div key={field.key}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>
                  {field.label}
                  {field.required && <span style={{ color: "#C0392B", fontSize: 10 }}>*</span>}
                </label>
                <select
                  value={currentMapping[field.key] ?? ""}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", border: `1.5px solid ${currentMapping[field.key] ? "#C8D8C0" : "#EEF0EC"}`, borderRadius: 7, fontSize: 12, color: "#1A2018", background: "#FAFAFA", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const }}
                >
                  <option value="">(skip)</option>
                  {parsedCSV.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#C0392B", fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={isLoading || !currentMapping.estimated_cost || !currentMapping.actual_cost}
          style={{
            width: "100%", padding: "13px", background: isLoading || !currentMapping.estimated_cost || !currentMapping.actual_cost ? "#B8C8B0" : "#4A5C3A",
            color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: isLoading || !currentMapping.estimated_cost || !currentMapping.actual_cost ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {isLoading ? "Importing jobs…" : `Import ${parsedCSV.rows.length} Jobs & Continue →`}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Info card */}
      <div style={{ background: "#F7FAF5", border: "1px solid #DCE8D4", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#4A5C3A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1v16M1 9h16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#1A2018", fontFamily: "'DM Sans', sans-serif" }}>What you need</p>
          <p style={{ margin: 0, fontSize: 13, color: "#4A5C3A", fontFamily: "'DM Sans', sans-serif" }}>
            A CSV export from QuickBooks, Buildertrend, or any job costing tool with estimated vs. actual cost per job. Change order columns are optional but recommended.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        style={{
          background: dragOver ? "#F0F4EE" : "#FAFAFA",
          border: `2px dashed ${dragOver ? "#4A5C3A" : "#E0E4DC"}`,
          borderRadius: 16,
          padding: "60px 40px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.15s",
          marginBottom: 16,
        }}
        onClick={() => document.getElementById("csv-upload")?.click()}
      >
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <div style={{ width: 48, height: 48, background: "#F0F4EE", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="#4A5C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="17 8 12 3 7 8" stroke="#4A5C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="3" x2="12" y2="15" stroke="#4A5C3A" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#1A2018", fontFamily: "'DM Sans', sans-serif" }}>
          {isLoading ? "Parsing CSV…" : "Drop your CSV here or click to browse"}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#9CA89A", fontFamily: "'DM Sans', sans-serif" }}>
          Accepts .csv files · QuickBooks, Buildertrend, CoConstruct, Excel exports
        </p>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#C0392B", fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
        </div>
      )}
    </div>
  );
}
