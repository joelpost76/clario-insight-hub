// ─── RPE Health Check — Type Definitions ─────────────────────────────────────
// These types describe the raw numbers a consultant enters and the metrics
// the app derives from them. Keep this file free of any UI or logic.

export interface RPEInputs {
  /** Total annual revenue for the company (required) */
  revenue: number;
  /** Number of field / production FTE (required) */
  fieldFTE: number;
  /** Number of non-field / overhead FTE (required) */
  nonFieldFTE: number;
  /** Current backlog in dollars (optional) */
  backlog?: number;
  /** Average contract value per job in dollars (optional) */
  averageContractValue?: number;
  /** Number of Project Managers (optional) */
  pmCount?: number;
  /** Number of Designers (optional) */
  designerCount?: number;
  /** Number of Sales Reps (optional) */
  salesCount?: number;
}

export interface RPEMetrics {
  /** Field FTE + Non-Field FTE */
  totalFTE: number;
  /** Revenue ÷ Total FTE */
  totalRPE: number;
  /** Revenue ÷ Field FTE */
  fieldRPE: number;
  /** Revenue ÷ Non-Field FTE */
  nonFieldRPE: number;
  /** Revenue ÷ Average Contract Value (jobs produced per year) */
  jobsPerYear?: number;
  /** Estimated number of jobs actively running at any given time */
  impliedWIP?: number;
  /** How many months of work is currently in the backlog */
  backlogMonths?: number;
  /** Jobs per year divided across PMs */
  jobsPerPM?: number;
  /** Jobs per year divided across Designers */
  jobsPerDesigner?: number;
  /** Jobs per year divided across Sales Reps */
  jobsPerSales?: number;
}

/** Label and colour band for an RPE score */
export interface RPEBenchmark {
  label: string;
  description: string;
  variant: "critical" | "caution" | "average" | "good" | "strong";
}
