import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useScopeCreep } from "@/contexts/ScopeCreepContext";
import { JobRecord } from "@/lib/calculations";

// ─── Step 2: Job Review & Exclusions ──────────────────────────────────────────

const PROJECT_TYPES = ["Kitchen", "Bath", "Addition", "Whole Home", "Other"];

function fmt$(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function AccuracyBadge({ estimated, actual }: { estimated: number | null; actual: number | null }) {
  if (!estimated || !actual) return <span style={{ fontSize: 11, color: "#B8BDB6", fontFamily: "'DM Mono', monospace" }}>—</span>;
  const ratio = actual / estimated;
  const pct = ((ratio - 1) * 100).toFixed(1);
  const over = ratio > 1;
  const color = ratio <= 1.05 ? "#4A5C3A" : ratio <= 1.2 ? "#B8A94A" : "#C0392B";
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: "'DM Mono', monospace" }}>
      {over ? "+" : ""}{pct}%
    </span>
  );
}

export default function ScopeCreepStep2() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, assessment, updateJobRecord, toggleJobExclusion, completeStep, isLoading, error } = useScopeCreep();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<JobRecord>>({});
  const [search, setSearch] = useState("");

  const filtered = jobs.filter((j) =>
    !search || (j.job_name ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = jobs.filter((j) => !j.is_excluded).length;

  const startEdit = (job: JobRecord) => {
    setEditingId(job.id);
    setEditValues({
      job_name: job.job_name ?? "",
      project_type: job.project_type ?? "",
      estimator_name: job.estimator_name ?? "",
      estimated_cost: job.estimated_cost,
      actual_cost: job.actual_cost,
      co_value_issued: job.co_value_issued,
      co_value_signed: job.co_value_signed,
    });
  };

  const saveEdit = async (jobId: string) => {
    await updateJobRecord(jobId, editValues);
    setEditingId(null);
  };

  const handleContinue = async () => {
    await completeStep(2);
  };

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Jobs", value: jobs.length, mono: true },
          { label: "Active (included)", value: activeCount, mono: true },
          { label: "Excluded", value: jobs.length - activeCount, mono: true },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA89A", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1A2018", fontFamily: "'DM Mono', monospace" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 12, position: "relative" }}>
        <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9CA89A" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M9.5 9.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter jobs…"
          style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1.5px solid #EEF0EC", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const }} />
      </div>

      {/* Table */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #EEF0EC", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #EEF0EC" }}>
                {["Job", "Type", "Estimator", "Estimated", "Actual", "Accuracy", "CO Issued", "CO Signed", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9CA89A", textTransform: "uppercase" as const, letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => {
                const isEditing = editingId === job.id;
                const excluded = job.is_excluded;
                return (
                  <tr key={job.id} style={{ borderBottom: "1px solid #F5F5F5", opacity: excluded ? 0.5 : 1, background: excluded ? "#FAFAFA" : "transparent" }}>
                    {isEditing ? (
                      <>
                        <td style={{ padding: "8px 12px" }}>
                          <input value={String(editValues.job_name ?? "")} onChange={(e) => setEditValues((p) => ({ ...p, job_name: e.target.value }))}
                            style={{ width: 140, padding: "5px 8px", border: "1px solid #C8D8C0", borderRadius: 6, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <select value={String(editValues.project_type ?? "")} onChange={(e) => setEditValues((p) => ({ ...p, project_type: e.target.value }))}
                            style={{ padding: "5px 8px", border: "1px solid #C8D8C0", borderRadius: 6, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                            <option value="">—</option>
                            {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <input value={String(editValues.estimator_name ?? "")} onChange={(e) => setEditValues((p) => ({ ...p, estimator_name: e.target.value }))}
                            style={{ width: 100, padding: "5px 8px", border: "1px solid #C8D8C0", borderRadius: 6, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                        </td>
                        {["estimated_cost", "actual_cost", "co_value_issued", "co_value_signed"].map((field) => (
                          <td key={field} style={{ padding: "8px 12px" }}>
                            <input
                              type="number"
                              value={String(editValues[field as keyof typeof editValues] ?? "")}
                              onChange={(e) => setEditValues((p) => ({ ...p, [field]: parseFloat(e.target.value) || null }))}
                              style={{ width: 80, padding: "5px 8px", border: "1px solid #C8D8C0", borderRadius: 6, fontSize: 12, fontFamily: "'DM Mono', monospace" }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: "8px 12px" }} />
                        <td style={{ padding: "8px 12px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => saveEdit(job.id)} style={{ padding: "4px 10px", background: "#4A5C3A", color: "white", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Save</button>
                            <button onClick={() => setEditingId(null)} style={{ padding: "4px 10px", background: "none", border: "1px solid #EEF0EC", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#1A2018", fontFamily: "'DM Sans', sans-serif", maxWidth: 160 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{job.job_name ?? "—"}</div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>{job.project_type ?? "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#6B7A67", fontFamily: "'DM Sans', sans-serif" }}>{job.estimator_name ?? "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#4A5048" }}>{fmt$(job.estimated_cost)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#4A5048" }}>{fmt$(job.actual_cost)}</td>
                        <td style={{ padding: "10px 12px" }}><AccuracyBadge estimated={job.estimated_cost} actual={job.actual_cost} /></td>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#4A5048" }}>{fmt$(job.co_value_issued)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#4A5048" }}>{fmt$(job.co_value_signed)}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => startEdit(job)} style={{ padding: "4px 9px", background: "none", border: "1px solid #EEF0EC", borderRadius: 6, fontSize: 11, cursor: "pointer", color: "#4A5C3A", fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                            <button onClick={() => toggleJobExclusion(job.id)}
                              style={{ padding: "4px 9px", background: "none", border: "1px solid #EEF0EC", borderRadius: 6, fontSize: 11, cursor: "pointer", color: excluded ? "#4A5C3A" : "#C0392B", fontFamily: "'DM Sans', sans-serif" }}>
                              {excluded ? "Include" : "Exclude"}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#C0392B", fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={isLoading || activeCount === 0}
        style={{
          width: "100%", padding: "13px", background: isLoading || activeCount === 0 ? "#B8C8B0" : "#4A5C3A",
          color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
          cursor: isLoading || activeCount === 0 ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {isLoading ? "Saving…" : `Run Analysis on ${activeCount} Jobs →`}
      </button>
    </div>
  );
}
