import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useScopeCreep } from "@/contexts/ScopeCreepContext";
import { CLARIO_FIELDS, autoMapColumns } from "@/lib/calculations";
import { supabase } from "@/integrations/supabase/client";

// ─── Step 1: Setup & CSV/XLSX Upload ─────────────────────────────────────────

const S = {
  green: "#4A5C3A",
  text: "#1A2018",
  muted: "#6B7A67",
  faint: "#9CA89A",
  border: "#EEF0EC",
  mono: "'DM Mono', monospace" as const,
  sans: "'DM Sans', sans-serif" as const,
};

// ─── QuickBooks export instructions collapsible ───────────────────────────────
function QBInstructions() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#FFFFFF", border: `1.5px solid ${S.border}`, borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: "none", border: "none", cursor: "pointer",
          fontFamily: S.sans,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke={S.green} strokeWidth="1.4"/>
            <path d="M5 8h6M8 5v6" stroke={S.green} strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: S.text }}>QuickBooks Export Instructions</span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <path d="M4 6l4 4 4-4" stroke={S.faint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${S.border}` }}>
          <p style={{ margin: "12px 0 10px", fontSize: 13, color: S.muted, fontFamily: S.sans }}>
            Follow these steps to export a job profitability report from QuickBooks:
          </p>
          <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Open QuickBooks → Go to Reports",
              "Select Jobs → Job Profitability Summary",
              "Set your desired date range (12 months recommended)",
              "Click Run Report",
              "Click Export → Export to Excel",
              "Save as .xlsx or convert to .csv before uploading",
            ].map((step, i) => (
              <li key={i} style={{ fontSize: 13, color: S.muted, fontFamily: S.sans }}>{step}</li>
            ))}
          </ol>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#F7FAF5", borderRadius: 8, border: `1px solid #C8D8C0` }}>
            <p style={{ margin: 0, fontSize: 12, color: S.green, fontFamily: S.sans }}>
              <strong>Tip:</strong> The more columns you include, the better the auto-mapping will work. 
              Estimated Cost and Actual Cost are required. Change order columns are optional but recommended.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScopeCreepStep1() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { parsedCSV, parseFileForMapping, uploadAndParseJobs, isLoading, error, setError, assessment } = useScopeCreep();
  const [dragOver, setDragOver] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dateStart, setDateStart] = useState(assessment?.date_range_start ?? "");
  const [dateEnd, setDateEnd] = useState(assessment?.date_range_end ?? "");
  const [phase, setPhase] = useState<"upload" | "map">("upload");

  const handleFile = async (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      setError("Please upload a CSV or Excel (.xlsx / .xls) file.");
      return;
    }

    if (name.endsWith(".csv")) {
      // CSV path — existing logic
      setPhase("upload");
      await parseFileForMapping(file);
      setPhase("map");
    } else {
      // XLSX path — convert to CSV rows using SheetJS
      setError(null);
      try {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // Convert sheet to array of objects
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { raw: false, defval: "" });
        if (rows.length === 0) { setError("No data rows found in Excel file."); return; }
        const headers = Object.keys(rows[0]);
        // Inject into context via a synthetic ParsedCSV — we set it directly
        // by calling parseFileForMapping with a synthetic CSV blob
        const csvLines = [
          headers.map((h) => `"${h}"`).join(","),
          ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")),
        ];
        const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
        const syntheticFile = new File([blob], "converted.csv", { type: "text/csv" });
        await parseFileForMapping(syntheticFile);
        setPhase("map");
      } catch (e: any) {
        setError(e.message ?? "Failed to parse Excel file.");
      }
    }
  };

  // After CSV is parsed, auto-map and allow overrides
  if (parsedCSV && phase === "map") {
    const autoMap = autoMapColumns(parsedCSV.headers);
    const currentMapping = { ...autoMap, ...mapping };

    // Validation stats
    const totalRows = parsedCSV.rows.length;
    const withEstimate = parsedCSV.rows.filter((r) => {
      const col = currentMapping["estimated_cost"];
      return col && r[col] && r[col].replace(/[$,%\s]/g, "") !== "";
    }).length;
    const missingEstimatePct = totalRows > 0 ? (totalRows - withEstimate) / totalRows : 0;

    // Date range from data
    const startCol = currentMapping["job_start_date"];
    const endCol = currentMapping["job_end_date"];
    const detectedStart = startCol
      ? parsedCSV.rows.map((r) => r[startCol]).filter(Boolean).sort()[0]
      : null;
    const detectedEnd = endCol
      ? parsedCSV.rows.map((r) => r[endCol]).filter(Boolean).sort().reverse()[0]
      : null;

    const handleConfirm = async () => {
      // Validate required fields
      if (!currentMapping.job_name) { setError("Job Name column is required."); return; }
      if (!currentMapping.actual_cost) { setError("Actual Cost column is required."); return; }
      if (totalRows < 5) { setError(`Only ${totalRows} rows detected — at least 5 jobs are needed for analysis.`); return; }
      setError(null);

      await uploadAndParseJobs(currentMapping);

      // Persist date range to assessment
      if (id && (dateStart || detectedStart || dateEnd || detectedEnd)) {
        await supabase
          .from("scope_creep_assessments")
          .update({
            date_range_start: dateStart || detectedStart || null,
            date_range_end: dateEnd || detectedEnd || null,
          })
          .eq("id", id);
      }

      navigate(`/scope-creep/assessment/${id}/step/2`);
    };

    return (
      <div>
        {/* Preview stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Total Jobs", value: totalRows.toString() },
            { label: "Have Estimates", value: `${withEstimate} (${Math.round((withEstimate / totalRows) * 100)}%)` },
            { label: "Columns Detected", value: parsedCSV.headers.length.toString() },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "#FFFFFF", border: `1.5px solid ${S.border}`, borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4, fontFamily: S.sans }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: S.text, fontFamily: S.mono }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Warning if >50% missing estimates */}
        {missingEstimatePct > 0.5 && (
          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M9 1L1 16h16L9 1z" stroke="#B8A94A" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 7v4M9 13v.5" stroke="#B8A94A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 2, fontFamily: S.sans }}>
                {Math.round(missingEstimatePct * 100)}% of jobs are missing estimated cost
              </div>
              <div style={{ fontSize: 11, color: "#92400E", fontFamily: S.sans }}>
                Leakage analysis will understate the true impact. You can continue and manually enter estimates in Step 2, or re-map the Estimated Cost column if it exists under a different name.
              </div>
            </div>
          </div>
        )}

        {/* Date range */}
        <div style={{ background: "#FFFFFF", border: `1.5px solid ${S.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: S.text, fontFamily: S.sans }}>Analysis Period</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: S.muted, fontFamily: S.sans }}>
            Specify the date range covered by this job data.
            {detectedStart && <span style={{ color: S.green }}> Auto-detected: {detectedStart} → {detectedEnd ?? "?"}</span>}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Start Date", value: dateStart, set: setDateStart, placeholder: detectedStart ?? "" },
              { label: "End Date", value: dateEnd, set: setDateEnd, placeholder: detectedEnd ?? "" },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 6, fontFamily: S.sans }}>{label}</label>
                <input
                  type="date" value={value} onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${S.border}`, borderRadius: 8, fontSize: 13, color: S.text, background: "#FAFAFA", outline: "none", fontFamily: S.mono, boxSizing: "border-box" as const }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Column mapping */}
        <div style={{ background: "#FFFFFF", border: `1.5px solid ${S.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: S.text, fontFamily: S.sans }}>Column Mapping</h3>
              <p style={{ margin: 0, fontSize: 13, color: S.muted, fontFamily: S.sans }}>
                {parsedCSV.rows.length} rows detected · Map your CSV columns to Clario fields
              </p>
            </div>
            <button
              onClick={() => { setPhase("upload"); setMapping({}); }}
              style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 12, color: S.muted, cursor: "pointer", fontFamily: S.sans }}
            >
              Re-upload
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {CLARIO_FIELDS.map((field) => (
              <div key={field.key}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#4A5048", marginBottom: 5, fontFamily: S.sans }}>
                  {field.label}
                  {field.required && <span style={{ color: "#C0392B", fontSize: 10 }}>*</span>}
                </label>
                <select
                  value={currentMapping[field.key] ?? ""}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  style={{
                    width: "100%", padding: "8px 10px",
                    border: `1.5px solid ${currentMapping[field.key] ? "#C8D8C0" : S.border}`,
                    borderRadius: 7, fontSize: 12, color: S.text, background: "#FAFAFA",
                    outline: "none", fontFamily: S.sans, boxSizing: "border-box" as const,
                  }}
                >
                  <option value="">(skip)</option>
                  {parsedCSV.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview — first 3 rows */}
          {parsedCSV.rows.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 10, fontFamily: S.sans }}>
                Data Preview (first 3 rows)
              </div>
              <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${S.border}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "#FAFAFA" }}>
                      {Object.entries(currentMapping).filter(([, v]) => v).map(([field, col]) => (
                        <th key={field} style={{ padding: "6px 10px", textAlign: "left" as const, fontWeight: 600, color: S.faint, fontFamily: S.sans, whiteSpace: "nowrap" as const }}>
                          {CLARIO_FIELDS.find((f) => f.key === field)?.label ?? field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedCSV.rows.slice(0, 3).map((row, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${S.border}` }}>
                        {Object.entries(currentMapping).filter(([, v]) => v).map(([field, col]) => (
                          <td key={field} style={{ padding: "6px 10px", color: S.text, fontFamily: S.mono, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                            {row[col] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#C0392B", fontFamily: S.sans }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={isLoading || !currentMapping.actual_cost}
          style={{
            width: "100%", padding: "13px",
            background: isLoading || !currentMapping.actual_cost ? "#B8C8B0" : S.green,
            color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: isLoading || !currentMapping.actual_cost ? "not-allowed" : "pointer",
            fontFamily: S.sans,
          }}
        >
          {isLoading ? "Importing jobs…" : `Import ${parsedCSV.rows.length} Jobs & Continue →`}
        </button>
      </div>
    );
  }

  return (
    <div>
      <QBInstructions />

      {/* Info card */}
      <div style={{ background: "#F7FAF5", border: "1px solid #DCE8D4", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: S.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 14h14M4 10l4-6 4 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: S.text, fontFamily: S.sans }}>What you need</p>
          <p style={{ margin: 0, fontSize: 13, color: S.green, fontFamily: S.sans }}>
            A CSV or Excel export from QuickBooks, Buildertrend, or any job costing tool with estimated vs. actual cost per job. Change order columns are optional but recommended.
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
          border: `2px dashed ${dragOver ? S.green : "#E0E4DC"}`,
          borderRadius: 16, padding: "60px 40px", textAlign: "center",
          cursor: "pointer", transition: "all 0.15s", marginBottom: 16,
        }}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <input
          id="file-upload"
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <div style={{ width: 48, height: 48, background: "#F0F4EE", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={S.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="17 8 12 3 7 8" stroke={S.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="3" x2="12" y2="15" stroke={S.green} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: S.text, fontFamily: S.sans }}>
          {isLoading ? "Parsing file…" : "Drop your file here or click to browse"}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: S.faint, fontFamily: S.sans }}>
          Accepts .csv or .xlsx files · QuickBooks, Buildertrend, CoConstruct, Excel exports
        </p>
      </div>

      {/* Sample CSV download */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <a
          href="/test-jobs.csv"
          download="sample-jobs.csv"
          style={{ fontSize: 12, color: S.green, fontFamily: S.sans, textDecoration: "underline", cursor: "pointer" }}
        >
          Download sample CSV template
        </a>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#C0392B", fontFamily: S.sans }}>{error}</p>
        </div>
      )}
    </div>
  );
}
