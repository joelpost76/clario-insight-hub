import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useScopeCreep } from "@/contexts/ScopeCreepContext";
import { JobRecord } from "@/lib/calculations";

// ─── Step 2: Job Review & Exclusions ──────────────────────────────────────────

const PROJECT_TYPES = ["Kitchen", "Bath", "Addition", "Whole Home", "Other"];
const PAGE_SIZE = 25;

const S = {
  green: "#4A5C3A",
  gold: "#B8A94A",
  red: "#C0392B",
  text: "#1A2018",
  muted: "#6B7A67",
  faint: "#9CA89A",
  border: "#EEF0EC",
  card: "#FFFFFF",
  mono: "'DM Mono', monospace" as const,
  sans: "'DM Sans', sans-serif" as const,
};

function fmt$(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function AccuracyBadge({ estimated, actual }: { estimated: number | null; actual: number | null }) {
  if (!estimated || !actual) return <span style={{ fontSize: 11, color: "#B8BDB6", fontFamily: S.mono }}>—</span>;
  const ratio = actual / estimated;
  const pct = ((ratio - 1) * 100).toFixed(1);
  const over = ratio > 1;
  const color = ratio <= 1.05 ? S.green : ratio <= 1.2 ? S.gold : S.red;
  const bg = ratio <= 1.05 ? "#F0F4EE" : ratio <= 1.2 ? "#FFFBEB" : "#FEF2F2";
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: S.mono, background: bg, padding: "2px 6px", borderRadius: 4 }}>
      {over ? "+" : ""}{pct}%
    </span>
  );
}

// ─── QB edge-case flag detection ──────────────────────────────────────────────
function getJobFlags(job: JobRecord, allJobs: JobRecord[]): string[] {
  const flags: string[] = [];
  // Zero contract_value → auto-excluded
  if ((job.contract_value ?? 0) === 0 && job.contract_value !== null) {
    flags.push("zero-revenue");
  }
  // Missing estimated_cost
  if (job.estimated_cost == null) {
    flags.push("missing-estimate");
  }
  // Possible duplicate name
  if (job.job_name) {
    const dupes = allJobs.filter(
      (j) => j.id !== job.id && j.job_name?.toLowerCase() === job.job_name!.toLowerCase()
    );
    if (dupes.length > 0) flags.push("duplicate");
  }
  return flags;
}

function FlagBadge({ flag }: { flag: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    "zero-revenue": { label: "Zero revenue", color: S.red, bg: "#FEF2F2" },
    "missing-estimate": { label: "No estimate", color: S.gold, bg: "#FFFBEB" },
    "duplicate": { label: "Possible duplicate", color: "#7C5ABF", bg: "#F5F0FF" },
  };
  const c = config[flag];
  if (!c) return null;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: c.color, background: c.bg, padding: "2px 5px", borderRadius: 3, marginLeft: 4, fontFamily: S.sans }}>
      {c.label}
    </span>
  );
}

export default function ScopeCreepStep2() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, updateJobRecord, toggleJobExclusion, completeStep, isLoading, error } = useScopeCreep();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<JobRecord>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Detect jobs that should be auto-excluded (zero contract value)
  const autoExcludeCount = useMemo(
    () => jobs.filter((j) => (j.contract_value ?? 1) === 0 && j.contract_value !== null && !j.is_excluded).length,
    [jobs]
  );

  const filtered = useMemo(
    () => jobs.filter((j) => !search || (j.job_name ?? "").toLowerCase().includes(search.toLowerCase())),
    [jobs, search]
  );

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = jobs.filter((j) => !j.is_excluded).length;

  // Count edge case warnings
  const missingEstimateCount = jobs.filter((j) => j.estimated_cost == null && !j.is_excluded).length;
  const missingPct = jobs.length > 0 ? missingEstimateCount / jobs.length : 0;

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
      {/* ── Summary bar ────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Jobs", value: jobs.length },
          { label: "Active", value: activeCount },
          { label: "Excluded", value: jobs.length - activeCount },
          { label: "Flagged", value: jobs.filter((j) => getJobFlags(j, jobs).length > 0).length },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6, fontFamily: S.sans }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: S.text, fontFamily: S.mono }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── QB edge-case warnings ────────────────────────────────────────── */}
      {missingPct > 0.5 && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 16px", marginBottom: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M9 1L1 16h16L9 1z" stroke={S.gold} strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M9 7v4M9 13v.5" stroke={S.gold} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 3, fontFamily: S.sans }}>
              Missing estimated_cost on {Math.round(missingPct * 100)}% of jobs
            </div>
            <div style={{ fontSize: 11, color: "#92400E", fontFamily: S.sans }}>
              More than 50% of jobs are missing estimated cost data. Use the Edit action to manually enter the top 10 highest-revenue jobs, then re-run analysis. Jobs without estimates are excluded from accuracy calculations.
            </div>
          </div>
        </div>
      )}

      {autoExcludeCount > 0 && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginBottom: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="8" cy="8" r="7" stroke={S.red} strokeWidth="1.5"/>
            <path d="M8 4v4M8 10v.5" stroke={S.red} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: S.red, marginBottom: 3, fontFamily: S.sans }}>
              {autoExcludeCount} job{autoExcludeCount > 1 ? "s" : ""} with zero contract value
            </div>
            <div style={{ fontSize: 11, color: "#7F1D1D", fontFamily: S.sans }}>
              Jobs with $0 contract value are flagged for exclusion — they may be internal work orders or COs coded as separate jobs. Review and exclude or edit as appropriate.
            </div>
          </div>
        </div>
      )}

      {/* ── Search + pagination ─────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: S.faint }} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9.5 9.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Filter jobs by name…"
            style={{ width: "100%", padding: "8px 12px 8px 32px", border: `1.5px solid ${S.border}`, borderRadius: 8, fontSize: 13, outline: "none", fontFamily: S.sans, boxSizing: "border-box" as const }}
          />
        </div>
        <div style={{ fontSize: 11, color: S.faint, fontFamily: S.sans, whiteSpace: "nowrap" as const }}>
          {filtered.length} of {jobs.length} jobs
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: `1px solid ${S.border}` }}>
                {["Job", "Type", "Estimator", "Estimated", "Actual", "Accuracy", "CO Issued", "CO Signed", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left" as const, fontSize: 11, fontWeight: 600, color: S.faint, textTransform: "uppercase" as const, letterSpacing: "0.06em", fontFamily: S.sans, whiteSpace: "nowrap" as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((job) => {
                const isEditing = editingId === job.id;
                const excluded = job.is_excluded;
                const flags = getJobFlags(job, jobs);
                // Row color coding
                const rowBg = excluded
                  ? "#F8F8F8"
                  : flags.includes("zero-revenue")
                  ? "#FFF5F5"
                  : flags.includes("missing-estimate")
                  ? "#FFFEF5"
                  : "transparent";

                return (
                  <tr key={job.id} style={{ borderBottom: `1px solid #F5F5F5`, opacity: excluded ? 0.6 : 1, background: rowBg }}>
                    {isEditing ? (
                      <>
                        <td style={{ padding: "8px 12px" }}>
                          <input value={String(editValues.job_name ?? "")} onChange={(e) => setEditValues((p) => ({ ...p, job_name: e.target.value }))}
                            style={{ width: 140, padding: "5px 8px", border: `1px solid #C8D8C0`, borderRadius: 6, fontSize: 12, fontFamily: S.sans }} />
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <select value={String(editValues.project_type ?? "")} onChange={(e) => setEditValues((p) => ({ ...p, project_type: e.target.value }))}
                            style={{ padding: "5px 8px", border: `1px solid #C8D8C0`, borderRadius: 6, fontSize: 12, fontFamily: S.sans }}>
                            <option value="">—</option>
                            {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <input value={String(editValues.estimator_name ?? "")} onChange={(e) => setEditValues((p) => ({ ...p, estimator_name: e.target.value }))}
                            style={{ width: 100, padding: "5px 8px", border: `1px solid #C8D8C0`, borderRadius: 6, fontSize: 12, fontFamily: S.sans }} />
                        </td>
                        {(["estimated_cost", "actual_cost", "co_value_issued", "co_value_signed"] as const).map((field) => (
                          <td key={field} style={{ padding: "8px 12px" }}>
                            <input
                              type="number"
                              value={String(editValues[field] ?? "")}
                              onChange={(e) => setEditValues((p) => ({ ...p, [field]: parseFloat(e.target.value) || null }))}
                              style={{ width: 80, padding: "5px 8px", border: `1px solid #C8D8C0`, borderRadius: 6, fontSize: 12, fontFamily: S.mono }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: "8px 12px" }} />
                        <td style={{ padding: "8px 12px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => saveEdit(job.id)} style={{ padding: "4px 10px", background: S.green, color: "white", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: S.sans }}>Save</button>
                            <button onClick={() => setEditingId(null)} style={{ padding: "4px 10px", background: "none", border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: S.sans }}>Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: S.text, fontFamily: S.sans, maxWidth: 180 }}>
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" as const, gap: 2 }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: 140 }}>{job.job_name ?? "—"}</span>
                            {flags.map((f) => <FlagBadge key={f} flag={f} />)}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: S.muted, fontFamily: S.sans }}>{job.project_type ?? "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: S.muted, fontFamily: S.sans }}>{job.estimator_name ?? "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: S.mono, color: "#4A5048" }}>{fmt$(job.estimated_cost)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: S.mono, color: "#4A5048" }}>{fmt$(job.actual_cost)}</td>
                        <td style={{ padding: "10px 12px" }}><AccuracyBadge estimated={job.estimated_cost} actual={job.actual_cost} /></td>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: S.mono, color: "#4A5048" }}>{fmt$(job.co_value_issued)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: S.mono, color: "#4A5048" }}>{fmt$(job.co_value_signed)}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => startEdit(job)} style={{ padding: "4px 9px", background: "none", border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 11, cursor: "pointer", color: S.green, fontFamily: S.sans }}>Edit</button>
                            <button
                              onClick={() => toggleJobExclusion(job.id)}
                              style={{ padding: "4px 9px", background: "none", border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 11, cursor: "pointer", color: excluded ? S.green : S.red, fontFamily: S.sans }}
                            >
                              {excluded ? "Include" : "Exclude"}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "32px", textAlign: "center" as const, fontSize: 13, color: S.faint, fontFamily: S.sans }}>
                    No jobs match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: `1px solid ${S.border}`, background: "#FAFAFA" }}>
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              style={{ padding: "5px 12px", border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 12, cursor: page === 1 ? "default" : "pointer", color: page === 1 ? S.faint : S.text, fontFamily: S.sans, background: "none" }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 12, color: S.faint, fontFamily: S.sans }}>
              Page {page} of {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
              disabled={page === pageCount}
              style={{ padding: "5px 12px", border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 12, cursor: page === pageCount ? "default" : "pointer", color: page === pageCount ? S.faint : S.text, fontFamily: S.sans, background: "none" }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* QB data note */}
      <div style={{ fontSize: 11, color: S.faint, fontFamily: S.sans, marginBottom: 12, padding: "0 4px" }}>
        <strong>Note:</strong> If COs appear as separate line items in your QuickBooks export, exclude them here and add their value to the parent job's CO fields manually using Edit.
        {jobs.some((j) => j.estimated_cost == null && j.actual_cost != null) && (
          <span> Jobs with blended labor (no estimate split) are included in leakage totals but excluded from accuracy calculations.</span>
        )}
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: S.red, fontFamily: S.sans }}>{error}</p>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={isLoading || activeCount === 0}
        style={{
          width: "100%", padding: "13px",
          background: isLoading || activeCount === 0 ? "#B8C8B0" : S.green,
          color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
          cursor: isLoading || activeCount === 0 ? "not-allowed" : "pointer", fontFamily: S.sans,
        }}
      >
        {isLoading ? "Saving…" : `Run Analysis on ${activeCount} Jobs →`}
      </button>
    </div>
  );
}
