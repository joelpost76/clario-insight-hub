// ─── Scope Creep Calculations ─────────────────────────────────────────────────

export interface JobRecord {
  id: string;
  job_name: string | null;
  project_type: string | null;
  estimator_name: string | null;
  contract_value: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  cos_issued: number | null;
  cos_signed: number | null;
  co_value_issued: number | null;
  co_value_signed: number | null;
  job_start_date: string | null;
  job_end_date: string | null;
  is_excluded: boolean;
}

export interface JobMetrics {
  estimate_accuracy: number | null; // actual_cost / estimated_cost
  overrun: number; // max(actual_cost - estimated_cost, 0)
  co_leakage: number; // co_value_issued - co_value_signed
}

export interface AggregateMetrics {
  avg_estimate_accuracy: number;
  co_capture_rate: number;
  co_leakage_dollars: number;
  total_margin_leakage: number;
  leakage_as_pct_revenue: number;
  constraint_score: number;
  total_contract_value: number;
  by_project_type: Record<string, { avg_accuracy: number; count: number }>;
  by_estimator: Record<string, { avg_accuracy: number; count: number }>;
  job_metrics: (JobRecord & JobMetrics)[];
}

export function computeJobMetrics(job: JobRecord): JobMetrics {
  const estimated = job.estimated_cost ?? 0;
  const actual = job.actual_cost ?? 0;
  const co_issued = job.co_value_issued ?? 0;
  const co_signed = job.co_value_signed ?? 0;

  const estimate_accuracy =
    estimated > 0 ? actual / estimated : null;

  const overrun = actual > estimated ? actual - estimated : 0;
  const co_leakage = Math.max(co_issued - co_signed, 0);

  return { estimate_accuracy, overrun, co_leakage };
}

export function computeAggregateMetrics(jobs: JobRecord[]): AggregateMetrics {
  const active = jobs.filter((j) => !j.is_excluded);

  // Per-job metrics
  const jobMetrics = active.map((j) => ({ ...j, ...computeJobMetrics(j) }));

  // avg_estimate_accuracy — mean of per-job accuracy
  const withAccuracy = jobMetrics.filter((j) => j.estimate_accuracy !== null);
  const avg_estimate_accuracy =
    withAccuracy.length > 0
      ? withAccuracy.reduce((s, j) => s + j.estimate_accuracy!, 0) / withAccuracy.length
      : 1.0;

  // co_capture_rate
  const total_co_issued = active.reduce((s, j) => s + (j.co_value_issued ?? 0), 0);
  const total_co_signed = active.reduce((s, j) => s + (j.co_value_signed ?? 0), 0);
  const co_capture_rate = total_co_issued > 0 ? total_co_signed / total_co_issued : 1.0;
  const co_leakage_dollars = Math.max(total_co_issued - total_co_signed, 0);

  // total_margin_leakage
  const total_overrun = jobMetrics.reduce((s, j) => s + j.overrun, 0);
  const total_margin_leakage = total_overrun + co_leakage_dollars;

  // leakage_as_pct_revenue
  const total_contract_value = active.reduce((s, j) => s + (j.contract_value ?? 0), 0);
  const leakage_as_pct_revenue =
    total_contract_value > 0 ? total_margin_leakage / total_contract_value : 0;

  // constraint_score
  let constraint_score = 0;
  if (avg_estimate_accuracy <= 1.05 && co_capture_rate >= 0.9) constraint_score = 4;
  else if (avg_estimate_accuracy <= 1.1 && co_capture_rate >= 0.8) constraint_score = 3;
  else if (avg_estimate_accuracy <= 1.2 && co_capture_rate >= 0.65) constraint_score = 2;
  else if (avg_estimate_accuracy <= 1.3 || co_capture_rate < 0.65) constraint_score = 1;
  else constraint_score = 0;

  // Pattern detection by project_type
  const by_project_type: Record<string, { avg_accuracy: number; count: number }> = {};
  const typeGroups: Record<string, number[]> = {};
  for (const j of withAccuracy) {
    const key = j.project_type ?? "Unknown";
    if (!typeGroups[key]) typeGroups[key] = [];
    typeGroups[key].push(j.estimate_accuracy!);
  }
  for (const [key, vals] of Object.entries(typeGroups)) {
    by_project_type[key] = {
      avg_accuracy: vals.reduce((s, v) => s + v, 0) / vals.length,
      count: vals.length,
    };
  }

  // Pattern detection by estimator
  const by_estimator: Record<string, { avg_accuracy: number; count: number }> = {};
  const estimatorGroups: Record<string, number[]> = {};
  for (const j of withAccuracy) {
    const key = j.estimator_name ?? "Unknown";
    if (!estimatorGroups[key]) estimatorGroups[key] = [];
    estimatorGroups[key].push(j.estimate_accuracy!);
  }
  for (const [key, vals] of Object.entries(estimatorGroups)) {
    by_estimator[key] = {
      avg_accuracy: vals.reduce((s, v) => s + v, 0) / vals.length,
      count: vals.length,
    };
  }

  return {
    avg_estimate_accuracy,
    co_capture_rate,
    co_leakage_dollars,
    total_margin_leakage,
    leakage_as_pct_revenue,
    constraint_score,
    total_contract_value,
    by_project_type,
    by_estimator,
    job_metrics: jobMetrics,
  };
}

// ─── CSV Parsing Utilities ────────────────────────────────────────────────────

export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let inQuote = false;
    let current = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const vals = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });

  return { headers, rows };
}

export const CLARIO_FIELDS = [
  { key: "job_name", label: "Job Name", required: true },
  { key: "project_type", label: "Project Type", required: false },
  { key: "estimator_name", label: "Estimator Name", required: false },
  { key: "contract_value", label: "Contract Value ($)", required: false },
  { key: "estimated_cost", label: "Estimated Cost ($)", required: true },
  { key: "actual_cost", label: "Actual Cost ($)", required: true },
  { key: "cos_issued", label: "COs Issued (#)", required: false },
  { key: "cos_signed", label: "COs Signed (#)", required: false },
  { key: "co_value_issued", label: "CO Value Issued ($)", required: false },
  { key: "co_value_signed", label: "CO Value Signed ($)", required: false },
  { key: "job_start_date", label: "Job Start Date", required: false },
  { key: "job_end_date", label: "Job End Date", required: false },
];

export function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const lower = headers.map((h) => h.toLowerCase());

  const rules: { field: string; keywords: string[] }[] = [
    { field: "job_name", keywords: ["job name", "job", "project name", "name"] },
    { field: "project_type", keywords: ["project type", "type", "category"] },
    { field: "estimator_name", keywords: ["estimator", "salesperson", "sales rep"] },
    { field: "contract_value", keywords: ["contract value", "contract", "revenue", "price"] },
    { field: "estimated_cost", keywords: ["estimated cost", "estimated", "budget"] },
    { field: "actual_cost", keywords: ["actual cost", "actual", "cost"] },
    { field: "cos_issued", keywords: ["cos issued", "co issued", "change orders issued"] },
    { field: "cos_signed", keywords: ["cos signed", "co signed", "change orders signed"] },
    { field: "co_value_issued", keywords: ["co value issued", "co issued value"] },
    { field: "co_value_signed", keywords: ["co value signed", "co signed value"] },
    { field: "job_start_date", keywords: ["start date", "job start", "begin"] },
    { field: "job_end_date", keywords: ["end date", "job end", "complete", "finish"] },
  ];

  for (const { field, keywords } of rules) {
    for (const kw of keywords) {
      const idx = lower.findIndex((h) => h.includes(kw));
      if (idx !== -1 && !Object.values(mapping).includes(headers[idx])) {
        mapping[field] = headers[idx];
        break;
      }
    }
  }

  return mapping;
}

export function mapRowToJob(
  row: Record<string, string>,
  mapping: Record<string, string>
): Partial<JobRecord> {
  const get = (field: string): string => {
    const col = mapping[field];
    return col ? (row[col] ?? "") : "";
  };

  const num = (s: string): number | null => {
    const cleaned = s.replace(/[$,%\s]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  };

  const integer = (s: string): number | null => {
    const n = parseInt(s.replace(/\D/g, ""), 10);
    return isNaN(n) ? null : n;
  };

  const dateStr = (s: string): string | null => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  };

  return {
    job_name: get("job_name") || null,
    project_type: get("project_type") || null,
    estimator_name: get("estimator_name") || null,
    contract_value: num(get("contract_value")),
    estimated_cost: num(get("estimated_cost")),
    actual_cost: num(get("actual_cost")),
    cos_issued: integer(get("cos_issued")),
    cos_signed: integer(get("cos_signed")),
    co_value_issued: num(get("co_value_issued")),
    co_value_signed: num(get("co_value_signed")),
    job_start_date: dateStr(get("job_start_date")),
    job_end_date: dateStr(get("job_end_date")),
    is_excluded: false,
  };
}

export function fmt$$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}
