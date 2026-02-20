// ─── RPE Summary Card ─────────────────────────────────────────────────────────
// Shows the latest RPE snapshot for a workspace.
// Displays loading, error, empty, and data states.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface RPESummaryCardProps {
  workspaceId: string;
  /**
   * Optional override if you want to control navigation externally.
   * If not provided, the card navigates to /rpe (current workspace route).
   */
  onOpenDetails?: () => void;
}

interface RPESnapshotRow {
  total_rpe: number | null;
  captured_at: string;
  calculation_version: string | null;
}

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function RPESummaryCard({ workspaceId, onOpenDetails }: RPESummaryCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<RPESnapshotRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!workspaceId) return;

    const loadLatestSnapshot = async () => {
      setIsLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from("rpe_assessments")
        .select("total_rpe, captured_at, calculation_version")
        .eq("workspace_id", workspaceId)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("Error loading RPE snapshot:", fetchError);
        setError("Unable to load RPE snapshot right now.");
        setSnapshot(null);
      } else {
        setSnapshot(data as RPESnapshotRow | null);
      }

      setIsLoading(false);
    };

    loadLatestSnapshot();
  }, [workspaceId]);

  const handleOpenDetails = () => {
    if (onOpenDetails) {
      onOpenDetails();
      return;
    }
    navigate("/rpe");
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart3 className="w-4 h-4 text-primary" />
            Revenue per Employee
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart3 className="w-4 h-4 text-primary" />
            Revenue per Employee
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={handleOpenDetails}>
            Open RPE Health Check
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Empty state — no snapshot yet ───────────────────────────────────────────
  if (!snapshot || snapshot.total_rpe == null) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart3 className="w-4 h-4 text-primary" />
            Revenue per Employee
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-3xl font-bold tracking-tight text-muted-foreground">—</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No RPE snapshot has been captured for this workspace yet.
          </p>
          <Button variant="outline" size="sm" onClick={handleOpenDetails}>
            Run first RPE Health Check
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Data state ───────────────────────────────────────────────────────────────
  const lastCaptured = new Date(snapshot.captured_at);
  const versionLabel = snapshot.calculation_version ?? "rpe_v1";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BarChart3 className="w-4 h-4 text-primary" />
          Revenue per Employee
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main metric */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Latest snapshot</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {fmtCurrency(snapshot.total_rpe ?? 0)}
          </p>
        </div>

        {/* Context */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            This is the most recent RPE snapshot for this workspace. It gives a quick
            read on how much revenue each full-time equivalent is carrying.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Last captured:{" "}
              <span className="font-medium text-foreground">
                {lastCaptured.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
              {versionLabel}
            </Badge>
          </div>
        </div>

        {/* CTA */}
        <Button variant="outline" size="sm" onClick={handleOpenDetails}>
          Open RPE Health Check
        </Button>
      </CardContent>
    </Card>
  );
}
