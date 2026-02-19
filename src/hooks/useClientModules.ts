import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ModuleId = "rpe" | "scope" | "pl" | "cashflow";
export type ModuleStatus = "complete" | "in_progress" | "available" | "locked";

export interface ClientModule {
  id: ModuleId;
  name: string;
  status: ModuleStatus;
  score: number | null;
  scoreLabel: string | null;
  date: string | null;
}

const MODULE_DEFS: { id: ModuleId; name: string }[] = [
  { id: "rpe", name: "RPE Assessment" },
  { id: "scope", name: "Scope Creep Analyzer" },
  { id: "pl", name: "P&L Margin Analyzer" },
  { id: "cashflow", name: "Cash Flow & AR Aging" },
];

export function useClientModules(clientId: string | null) {
  return useQuery({
    queryKey: ["client-modules", clientId],
    queryFn: async (): Promise<ClientModule[]> => {
      if (!clientId) return buildModules([], null);

      // Fetch RPE assessments + scope creep assessments in parallel
      const [assessmentsRes, scopeRes] = await Promise.all([
        supabase
          .from("assessments")
          .select("id, module_type, status, is_complete, total_weighted_score, score_label, updated_at")
          .eq("client_id", clientId)
          .order("updated_at", { ascending: false }),
        supabase
          .from("scope_creep_assessments")
          .select("id, current_step, is_complete, constraint_score, updated_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (assessmentsRes.error) {
        console.error("useClientModules assessments error:", assessmentsRes.error);
      }

      return buildModules(assessmentsRes.data ?? [], scopeRes.data ?? null);
    },
    enabled: !!clientId,
  });
}

function buildModules(
  assessments: any[],
  scopeAssessment: {
    id: string;
    current_step: number;
    is_complete: boolean;
    constraint_score: number | null;
    updated_at: string;
  } | null
): ClientModule[] {
  // Build a map: module_type → most recent RPE-style assessment
  const byType: Record<string, any> = {};
  for (const a of assessments) {
    if (!byType[a.module_type]) byType[a.module_type] = a;
  }

  const rpeComplete = byType["rpe"]?.is_complete === true;
  const completeCount =
    Object.values(byType).filter((a) => a?.is_complete).length +
    (scopeAssessment?.is_complete ? 1 : 0);

  return MODULE_DEFS.map(({ id, name }) => {
    // ── Scope Creep — use scope_creep_assessments ────────────────────────
    if (id === "scope") {
      if (!scopeAssessment) {
        return {
          id,
          name,
          status: rpeComplete ? "available" : "locked",
          score: null,
          scoreLabel: null,
          date: null,
        };
      }
      if (scopeAssessment.is_complete) {
        return {
          id,
          name,
          status: "complete",
          // constraint_score 0-4 → 0-100
          score: scopeAssessment.constraint_score != null
            ? Math.round(scopeAssessment.constraint_score * 25)
            : null,
          scoreLabel: scopeAssessment.constraint_score != null
            ? constraintScoreLabel(scopeAssessment.constraint_score)
            : null,
          date: scopeAssessment.updated_at,
        };
      }
      return {
        id,
        name,
        status: "in_progress",
        score: null,
        scoreLabel: `Step ${scopeAssessment.current_step} of 5`,
        date: scopeAssessment.updated_at,
      };
    }

    // ── All other modules — use assessments table ────────────────────────
    const a = byType[id];

    let status: ModuleStatus;
    if (a?.is_complete) {
      status = "complete";
    } else if (a && !a.is_complete) {
      status = "in_progress";
    } else {
      if (id === "rpe") {
        status = "available";
      } else if (id === "pl") {
        status = rpeComplete ? "available" : "locked";
      } else {
        // cashflow: locked until 2+ modules complete
        status = completeCount >= 2 ? "available" : "locked";
      }
    }

    return {
      id,
      name,
      status,
      score: a?.total_weighted_score ?? null,
      scoreLabel: a?.score_label ?? null,
      date: a?.updated_at ?? null,
    };
  });
}

function constraintScoreLabel(score: number): string {
  if (score >= 4) return "Excellent";
  if (score >= 3) return "Healthy";
  if (score >= 2) return "Moderate";
  if (score >= 1) return "High Risk";
  return "Critical";
}
