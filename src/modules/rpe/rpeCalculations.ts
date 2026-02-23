// ─── RPE Health Check — Calculation Helpers ───────────────────────────────────
// Every formula here is written in plain English above it so a non-technical
// consultant can understand what each number means and where it comes from.
//
// All helpers guard against divide-by-zero; they return undefined when the
// required inputs are missing or zero rather than crashing or returning Infinity.
//
// VERSIONING GUIDE
// ────────────────
// To add a new calculation version (e.g. rpe_v2):
//   1. Add 'rpe_v2' to the RPEVersion union in rpeTypes.ts
//   2. Write a new calculateRPE_v2(inputs) function below
//   3. Add a `case 'rpe_v2': return calculateRPE_v2(inputs);` to calculateRPE()
//   4. Update CURRENT_RPE_VERSION in rpeTypes.ts to 'rpe_v2'
// Old snapshots stored with calculation_version = 'rpe_v1' will still be
// rehydratable using calculateRPE(inputs, 'rpe_v1').

import type { RPEInputs, RPEMetrics, RPEBenchmark, RPEVersion, RevenueTier, TierThresholds, RevenueTierInfo } from "./rpeTypes";
import { CURRENT_RPE_VERSION } from "./rpeTypes";

/**
 * DEFAULT_JOB_DURATION_WEEKS
 * The average number of weeks a single job takes from start to completion.
 * Used to estimate how many jobs are in progress at any given moment (WIP).
 * Remodeling industry average is roughly 8-16 weeks — 12 is a reasonable midpoint.
 * A consultant can override this in v2 when we add it as a form field.
 */
export const DEFAULT_JOB_DURATION_WEEKS = 12;

// ─── Core Calculations ────────────────────────────────────────────────────────

/**
 * Total FTE
 * Simply adds field and non-field headcount together.
 * This is the denominator for company-wide RPE.
 */
export function calcTotalFTE(inputs: RPEInputs): number {
  return (inputs.fieldFTE ?? 0) + (inputs.nonFieldFTE ?? 0);
}

/**
 * Total Company RPE
 * Revenue Per Employee — how much revenue each person generates on average.
 * A higher number generally means a leaner, more productive operation.
 */
export function calcTotalRPE(revenue: number, totalFTE: number): number | undefined {
  if (!totalFTE || totalFTE <= 0) return undefined;
  return revenue / totalFTE;
}

/**
 * Field RPE
 * Revenue divided only by field / production employees.
 * Tells us how efficiently the production team converts their time into revenue.
 */
export function calcFieldRPE(revenue: number, fieldFTE: number): number | undefined {
  if (!fieldFTE || fieldFTE <= 0) return undefined;
  return revenue / fieldFTE;
}

/**
 * Non-Field RPE
 * Revenue divided only by overhead / office employees.
 * A very LOW non-field RPE can signal that the back-office is oversized for
 * the current volume of work — an opportunity to optimise.
 */
export function calcNonFieldRPE(revenue: number, nonFieldFTE: number): number | undefined {
  if (!nonFieldFTE || nonFieldFTE <= 0) return undefined;
  return revenue / nonFieldFTE;
}

/**
 * Jobs Per Year
 * How many jobs the company completes annually, estimated from revenue
 * and average contract value. Requires ACV to be provided.
 */
export function calcJobsPerYear(
  revenue: number,
  averageContractValue?: number
): number | undefined {
  if (!averageContractValue || averageContractValue <= 0) return undefined;
  return revenue / averageContractValue;
}

/**
 * Implied WIP (Work In Progress)
 * Estimates how many jobs are actively running at any point in time.
 *
 * Logic:
 *   startsPerWeek = jobsPerYear / 52     (how many new jobs start each week)
 *   impliedWIP    = startsPerWeek × jobDurationWeeks
 *
 * If this number feels high relative to staff, it's often a sign that the
 * team is stretched thin and project oversight is at risk.
 */
export function calcImpliedWIP(
  jobsPerYear?: number,
  jobDurationWeeks: number = DEFAULT_JOB_DURATION_WEEKS
): number | undefined {
  if (jobsPerYear == null || jobsPerYear <= 0) return undefined;
  const startsPerWeek = jobsPerYear / 52;
  return startsPerWeek * jobDurationWeeks;
}

/**
 * Backlog in Months
 * Converts a dollar backlog figure into months of work at the current revenue run-rate.
 * Gives a sense of near-term capacity and workload pressure.
 */
export function calcBacklogMonths(revenue: number, backlog?: number): number | undefined {
  if (backlog == null || backlog <= 0) return undefined;
  const monthlyRevenue = revenue / 12;
  if (monthlyRevenue <= 0) return undefined;
  return backlog / monthlyRevenue;
}

/**
 * Jobs Per Role
 * Distributes annual jobs across each role type to surface load concentration.
 * If one role is carrying a disproportionate number of jobs it can signal
 * burnout risk or a quality/detail gap.
 */
export function calcJobsPerRole(
  jobsPerYear?: number,
  count?: number
): number | undefined {
  if (jobsPerYear == null || !count || count <= 0) return undefined;
  return jobsPerYear / count;
}

// ─── v1 Calculator ───────────────────────────────────────────────────────────

/**
 * calculateRPE_v1
 * The initial RPE calculation engine. Orchestrates all individual calculations
 * and returns a single RPEMetrics object. Any future breaking change to the
 * formulas should live in calculateRPE_v2 — do not modify this function.
 */
export function calculateRPE_v1(inputs: RPEInputs): RPEMetrics {
  const totalFTE = calcTotalFTE(inputs);
  const jobsPerYear = calcJobsPerYear(inputs.revenue, inputs.averageContractValue);

  return {
    totalFTE,
    totalRPE: calcTotalRPE(inputs.revenue, totalFTE) ?? 0,
    fieldRPE: calcFieldRPE(inputs.revenue, inputs.fieldFTE) ?? 0,
    nonFieldRPE: calcNonFieldRPE(inputs.revenue, inputs.nonFieldFTE) ?? 0,
    jobsPerYear,
    impliedWIP: calcImpliedWIP(jobsPerYear),
    backlogMonths: calcBacklogMonths(inputs.revenue, inputs.backlog),
    jobsPerPM: calcJobsPerRole(jobsPerYear, inputs.pmCount),
    jobsPerDesigner: calcJobsPerRole(jobsPerYear, inputs.designerCount),
    jobsPerSales: calcJobsPerRole(jobsPerYear, inputs.salesCount),
  };
}

// ─── Versioned Dispatcher ────────────────────────────────────────────────────

/**
 * calculateRPE
 * The public entry point. Always call this — never call calculateRPE_v1 directly
 * from UI code. Pass the version stored on a snapshot row to replay historical
 * calculations with the correct engine.
 *
 * To add rpe_v2: add a case here and a calculateRPE_v2 function above.
 */
export function calculateRPE(
  inputs: RPEInputs,
  version: RPEVersion = CURRENT_RPE_VERSION
): RPEMetrics {
  switch (version) {
    case 'rpe_v1':
    default:
      return calculateRPE_v1(inputs);
  }
}

/**
 * calculateRPEMetrics
 * Alias kept for backwards-compatibility with existing UI code.
 * New code should call calculateRPE() directly.
 */
export function calculateRPEMetrics(inputs: RPEInputs): RPEMetrics {
  return calculateRPE(inputs);
}

// ─── Revenue-Tiered Benchmarking ──────────────────────────────────────────────

const TIER_THRESHOLDS: Record<RevenueTier, TierThresholds> = {
  emerging:    { critical: 80_000,  caution: 120_000, average: 170_000, good: 230_000 },
  growth:      { critical: 100_000, caution: 150_000, average: 200_000, good: 280_000 },
  established: { critical: 120_000, caution: 170_000, average: 220_000, good: 300_000 },
  enterprise:  { critical: 140_000, caution: 190_000, average: 250_000, good: 330_000 },
};

/**
 * getRevenueTier
 * Maps annual revenue to one of four company-size tiers.
 */
export function getRevenueTier(revenue: number): RevenueTierInfo {
  if (revenue < 2_000_000) return { tier: "emerging", label: "Emerging", rangeLabel: "Under $2M" };
  if (revenue < 5_000_000) return { tier: "growth", label: "Growth", rangeLabel: "$2M – $5M" };
  if (revenue < 10_000_000) return { tier: "established", label: "Established", rangeLabel: "$5M – $10M" };
  return { tier: "enterprise", label: "Enterprise", rangeLabel: "$10M+" };
}

/**
 * getRPEBenchmark
 * Maps a total RPE value to a descriptive health label, adjusted by company size.
 *
 * When revenue is provided, thresholds are selected from the matching tier.
 * When omitted, defaults to the "growth" tier for backwards-compatibility.
 */
export function getRPEBenchmark(totalRPE: number, revenue?: number): RPEBenchmark {
  if (totalRPE <= 0) {
    return { label: "—", description: "Enter revenue and headcount to see your benchmark.", variant: "caution" };
  }

  const tierInfo = revenue != null && revenue > 0 ? getRevenueTier(revenue) : { tier: "growth" as RevenueTier, label: "Growth", rangeLabel: "$2M – $5M" };
  const t = TIER_THRESHOLDS[tierInfo.tier];
  const ctx = `for ${tierInfo.rangeLabel} firms`;

  if (totalRPE < t.critical) {
    return { label: "Needs Work", description: `RPE is below the floor ${ctx}. Worth a close look at overhead and volume.`, variant: "critical" };
  }
  if (totalRPE < t.caution) {
    return { label: "Below Average", description: `There is likely room to tighten overhead or grow top-line revenue ${ctx}.`, variant: "caution" };
  }
  if (totalRPE < t.average) {
    return { label: "Average", description: `Typical for a well-run remodeling firm ${ctx}.`, variant: "average" };
  }
  if (totalRPE < t.good) {
    return { label: "Good", description: `Lean and productive ${ctx}. The team is carrying healthy volume.`, variant: "good" };
  }
  return { label: "Strong", description: `High-performance operation ${ctx}. Protect this by managing growth carefully.`, variant: "strong" };
}
