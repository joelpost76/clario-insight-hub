// ─── RPE Supabase Mapper ──────────────────────────────────────────────────────
// Knows how to translate between the Supabase rpe_assessments row shape and
// the typed RPEInputs / RPEMetrics objects used by the calculation engine.
//
// Keeping this in one place means the rest of the codebase never has to think
// about snake_case column names or null → undefined coercion.

import type { RPEInputs, RPEMetrics, RPEVersion } from "./rpeTypes";
import { CURRENT_RPE_VERSION } from "./rpeTypes";

// ─── Row shape (mirrors rpe_assessments columns) ──────────────────────────────
// We define a minimal interface here rather than importing the auto-generated
// Supabase types so this file doesn't break if the generated types lag behind
// a migration. Update this interface whenever rpe_assessments changes.
export interface RPEAssessmentRow {
  id: string;
  workspace_id: string;
  captured_at: string;
  created_at: string;
  updated_at: string;
  calculation_version: string;
  // inputs
  revenue: number | null;
  field_fte: number | null;
  non_field_fte: number | null;
  backlog: number | null;
  average_contract_value: number | null;
  pm_count: number | null;
  designer_count: number | null;
  sales_count: number | null;
  // metrics
  total_fte: number | null;
  total_rpe: number | null;
  field_rpe: number | null;
  non_field_rpe: number | null;
  jobs_per_year: number | null;
  implied_wip: number | null;
  backlog_months: number | null;
  jobs_per_pm: number | null;
  jobs_per_designer: number | null;
  jobs_per_sales: number | null;
  // optional
  metadata: Record<string, unknown> | null;
}

// ─── fromRow ──────────────────────────────────────────────────────────────────

/**
 * fromRow
 * Converts a raw Supabase rpe_assessments row into strongly-typed inputs,
 * metrics, and the version string used to produce them.
 *
 * Null values from the DB become undefined so the RPE form can treat them as
 * "not yet entered" rather than explicitly zero.
 */
export function fromRow(row: RPEAssessmentRow): {
  inputs: RPEInputs;
  metrics: RPEMetrics;
  version: RPEVersion;
} {
  const inputs: RPEInputs = {
    revenue:              row.revenue               ?? 0,
    fieldFTE:             row.field_fte             ?? 0,
    nonFieldFTE:          row.non_field_fte         ?? 0,
    backlog:              row.backlog               ?? undefined,
    averageContractValue: row.average_contract_value ?? undefined,
    pmCount:              row.pm_count              ?? undefined,
    designerCount:        row.designer_count        ?? undefined,
    salesCount:           row.sales_count           ?? undefined,
  };

  const metrics: RPEMetrics = {
    totalFTE:       row.total_fte       ?? 0,
    totalRPE:       row.total_rpe       ?? 0,
    fieldRPE:       row.field_rpe       ?? 0,
    nonFieldRPE:    row.non_field_rpe   ?? 0,
    jobsPerYear:    row.jobs_per_year   ?? undefined,
    impliedWIP:     row.implied_wip     ?? undefined,
    backlogMonths:  row.backlog_months  ?? undefined,
    jobsPerPM:      row.jobs_per_pm     ?? undefined,
    jobsPerDesigner:row.jobs_per_designer ?? undefined,
    jobsPerSales:   row.jobs_per_sales  ?? undefined,
  };

  // Guard: if the stored version string isn't one we recognise, fall back
  // to the current version so the engine doesn't blow up on unknown input.
  const version: RPEVersion =
    row.calculation_version === 'rpe_v1' || row.calculation_version === 'rpe_v2'
      ? (row.calculation_version as RPEVersion)
      : CURRENT_RPE_VERSION;

  return { inputs, metrics, version };
}

// ─── toInsertPayload ──────────────────────────────────────────────────────────

/**
 * toInsertPayload
 * Builds the object to pass to supabase.from('rpe_assessments').insert().
 * Always stamps calculation_version with CURRENT_RPE_VERSION so every new
 * snapshot is tied to the engine that produced it.
 *
 * Undefined optional fields are written as null so Postgres doesn't complain
 * about missing columns.
 */
export function toInsertPayload(
  workspaceId: string,
  inputs: RPEInputs,
  metrics: RPEMetrics
): Omit<RPEAssessmentRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    workspace_id:          workspaceId,
    captured_at:           new Date().toISOString(),
    calculation_version:   CURRENT_RPE_VERSION,
    // inputs
    revenue:               inputs.revenue,
    field_fte:             inputs.fieldFTE,
    non_field_fte:         inputs.nonFieldFTE,
    backlog:               inputs.backlog               ?? null,
    average_contract_value:inputs.averageContractValue  ?? null,
    pm_count:              inputs.pmCount               ?? null,
    designer_count:        inputs.designerCount         ?? null,
    sales_count:           inputs.salesCount            ?? null,
    // metrics
    total_fte:             metrics.totalFTE,
    total_rpe:             metrics.totalRPE,
    field_rpe:             metrics.fieldRPE,
    non_field_rpe:         metrics.nonFieldRPE,
    jobs_per_year:         metrics.jobsPerYear          ?? null,
    implied_wip:           metrics.impliedWIP           ?? null,
    backlog_months:        metrics.backlogMonths        ?? null,
    jobs_per_pm:           metrics.jobsPerPM            ?? null,
    jobs_per_designer:     metrics.jobsPerDesigner      ?? null,
    jobs_per_sales:        metrics.jobsPerSales         ?? null,
    metadata:              null,
  };
}
