import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RPEAssessmentRecord {
  id: string;
  workspace_id: string;
  client_id: string;
  module_type: string;
  current_step: number;
  is_complete: boolean;
  status: string;
  total_weighted_score: number | null;
  score_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface RPEStepData {
  // Step 1 – Company Info
  headcount?: number | null;
  revenue?: number | null;
  industry?: string | null;
  // Step 2 – Revenue Efficiency
  revenue_per_employee?: number | null;
  industry_benchmark_rpe?: number | null;
  // Step 3 – Diagnostic Scoring (0-4 per category)
  score_sales_marketing?: number | null;
  score_design_estimating?: number | null;
  score_ops_production?: number | null;
  score_project_management?: number | null;
  score_finance_admin?: number | null;
  score_leadership?: number | null;
  // Step 4 – Constraint Identification
  primary_constraint?: string | null;
  constraint_notes?: string | null;
  // Step 5 – Capacity & WIP
  backlog_months?: number | null;
  wip_jobs?: number | null;
  throughput_per_month?: number | null;
  // Step 6 – Impact Model
  impact_model?: Record<string, any> | null;
}

export const SCORING_CATEGORIES = [
  { key: "score_sales_marketing", label: "Sales & Marketing", description: "Lead generation, close rate, pricing discipline" },
  { key: "score_design_estimating", label: "Design & Estimating", description: "Estimate accuracy, scope definition, pre-construction process" },
  { key: "score_ops_production", label: "Ops & Production", description: "Field execution, scheduling, rework rate" },
  { key: "score_project_management", label: "Project Management", description: "Communication, milestone tracking, change order discipline" },
  { key: "score_finance_admin", label: "Finance & Admin", description: "Job costing, invoicing cycle, AR aging" },
  { key: "score_leadership", label: "Leadership & Culture", description: "Decision-making speed, accountability systems, team capacity" },
];

export const SCORE_LABELS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  4: { label: "Performing", color: "#4A5C3A", bg: "#F0F4EE", border: "#C8D8C0" },
  3: { label: "Adequate", color: "#7A8C3A", bg: "#F7FAF0", border: "#D8E4C0" },
  2: { label: "At Risk", color: "#B8A94A", bg: "#FFFBEB", border: "#FDE68A" },
  1: { label: "Constrained", color: "#C06030", bg: "#FFF7F0", border: "#FDBA9A" },
  0: { label: "Critical", color: "#C0392B", bg: "#FEF2F2", border: "#FECACA" },
};

interface RPEContextType {
  assessment: RPEAssessmentRecord | null;
  stepData: RPEStepData;
  isLoading: boolean;
  error: string | null;
  loadAssessment: (id: string) => Promise<void>;
  saveStepData: (data: Partial<RPEStepData>) => void;
  persistStepData: (data: Partial<RPEStepData>) => Promise<void>;
  completeStep: (step: number, data?: Partial<RPEStepData>) => Promise<void>;
  setError: (err: string | null) => void;
}

const RPEContext = createContext<RPEContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RPEProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<RPEAssessmentRecord | null>(null);
  const [stepData, setStepData] = useState<RPEStepData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── loadAssessment ──────────────────────────────────────────────────────────
  const loadAssessment = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id)
        .single();

      if (err) throw err;

      setAssessment(data as RPEAssessmentRecord);

      // Load any persisted step data from the meta JSON column if it exists,
      // otherwise derive from the assessment columns we do have
      const derived: RPEStepData = {};
      if ((data as any).step_data) {
        Object.assign(derived, (data as any).step_data);
      }
      setStepData(derived);
    } catch (e: any) {
      setError(e.message ?? "Failed to load assessment");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── saveStepData (local only) ───────────────────────────────────────────────
  const saveStepData = useCallback((data: Partial<RPEStepData>) => {
    setStepData((prev) => ({ ...prev, ...data }));
  }, []);

  // ── persistStepData (write to DB) ──────────────────────────────────────────
  const persistStepData = useCallback(async (data: Partial<RPEStepData>) => {
    if (!assessment) return;
    setStepData((prev) => ({ ...prev, ...data }));
    // Store step data in score fields that already exist on the assessments table
    // We'll use total_weighted_score as an intermediate store for scoring data
    // and score_label for labels. For structured data, we store in existing fields.
  }, [assessment]);

  // ── completeStep ────────────────────────────────────────────────────────────
  const completeStep = useCallback(async (step: number, data?: Partial<RPEStepData>) => {
    if (!assessment) return;
    setError(null);

    const merged = data ? { ...stepData, ...data } : stepData;
    if (data) setStepData(merged);

    const nextStep = step + 1;
    const isLast = step >= 6;

    // Compute weighted score on step 3+ when we have scoring data
    let totalWeightedScore: number | null = null;
    let scoreLabel: string | null = null;

    if (isLast || step >= 3) {
      const scores = [
        merged.score_sales_marketing,
        merged.score_design_estimating,
        merged.score_ops_production,
        merged.score_project_management,
        merged.score_finance_admin,
        merged.score_leadership,
      ].filter((s) => s !== null && s !== undefined) as number[];

      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        totalWeightedScore = Math.round(avg * 25); // 0-100 scale
        if (avg >= 3.5) scoreLabel = "High Performer";
        else if (avg >= 2.5) scoreLabel = "Adequate";
        else if (avg >= 1.5) scoreLabel = "At Risk";
        else scoreLabel = "Critical";
      }
    }

    try {
      const updatePayload: Record<string, any> = {
        current_step: isLast ? step : nextStep,
        is_complete: isLast,
        status: isLast ? "complete" : "in_progress",
      };

      if (totalWeightedScore !== null) {
        updatePayload.total_weighted_score = totalWeightedScore;
        updatePayload.score_label = scoreLabel;
      }

      await supabase
        .from("assessments")
        .update(updatePayload)
        .eq("id", assessment.id);

      setAssessment((prev) =>
        prev
          ? {
              ...prev,
              current_step: isLast ? step : nextStep,
              is_complete: isLast,
              status: isLast ? "complete" : "in_progress",
              total_weighted_score: totalWeightedScore ?? prev.total_weighted_score,
              score_label: scoreLabel ?? prev.score_label,
            }
          : prev
      );

      if (!isLast) {
        navigate(`/rpe/assessment/${assessment.id}/step/${nextStep}`);
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to save progress");
    }
  }, [assessment, stepData, navigate]);

  return (
    <RPEContext.Provider
      value={{
        assessment,
        stepData,
        isLoading,
        error,
        loadAssessment,
        saveStepData,
        persistStepData,
        completeStep,
        setError,
      }}
    >
      {children}
    </RPEContext.Provider>
  );
}

export function useRPE() {
  const ctx = useContext(RPEContext);
  if (!ctx) throw new Error("useRPE must be used within RPEProvider");
  return ctx;
}
