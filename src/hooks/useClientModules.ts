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
      if (!clientId) return buildModules([]);

      const { data: assessments, error } = await supabase
        .from("assessments")
        .select("id, module_type, status, is_complete, total_weighted_score, score_label, updated_at")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("useClientModules error:", error);
        return buildModules([]);
      }

      return buildModules(assessments ?? []);
    },
    enabled: !!clientId,
  });
}

function buildModules(assessments: any[]): ClientModule[] {
  // Build a map: module_type → most recent assessment
  const byType: Record<string, any> = {};
  for (const a of assessments) {
    if (!byType[a.module_type]) byType[a.module_type] = a;
  }

  const rpeComplete = byType["rpe"]?.is_complete === true;
  const completeCount = Object.values(byType).filter((a) => a?.is_complete).length;

  return MODULE_DEFS.map(({ id, name }) => {
    const a = byType[id];

    let status: ModuleStatus;
    if (a?.is_complete) {
      status = "complete";
    } else if (a && !a.is_complete) {
      status = "in_progress";
    } else {
      // No assessment yet — determine availability
      if (id === "rpe") {
        status = "available";
      } else if (id === "scope" || id === "pl") {
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
