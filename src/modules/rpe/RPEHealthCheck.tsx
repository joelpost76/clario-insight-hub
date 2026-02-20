// ─── RPE Health Check ─────────────────────────────────────────────────────────
// Inputs are persisted per workspace via an upsert on every change.
// Metrics are always recalculated client-side from the stored inputs.

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { BarChart3, Users, Briefcase, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

import type { RPEInputs } from "./rpeTypes";
import { calculateRPEMetrics, getRPEBenchmark } from "./rpeCalculations";
import { RPEGauge } from "./RPEGauge";
import { MetricCard } from "./components/MetricCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number | undefined, style: "currency" | "decimal" = "currency"): string {
  if (value === undefined || value === null) return "—";
  if (style === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

const DEFAULTS: RPEInputs = {
  revenue: 0,
  fieldFTE: 0,
  nonFieldFTE: 0,
  backlog: undefined,
  averageContractValue: undefined,
  pmCount: undefined,
  designerCount: undefined,
  salesCount: undefined,
};

// ─── Field Component ──────────────────────────────────────────────────────────

function FormField({
  label,
  id,
  value,
  onChange,
  prefix,
  placeholder,
  required,
}: {
  label: string;
  id: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  prefix?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {!required && (
          <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
        )}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          min={0}
          placeholder={placeholder ?? "0"}
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? undefined : Number(raw));
          }}
          className={prefix ? "pl-7" : ""}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RPEHealthCheck() {
  const { workspaceId } = useWorkspace();
  const [inputs, setInputs] = useState<RPEInputs>(DEFAULTS);
  const [initialLoading, setInitialLoading] = useState(true);

  const metrics = useMemo(() => calculateRPEMetrics(inputs), [inputs]);
  const benchmark = useMemo(() => getRPEBenchmark(metrics.totalRPE), [metrics.totalRPE]);

  const hasRevenue = inputs.revenue > 0;
  const hasHeadcount = inputs.fieldFTE > 0 || inputs.nonFieldFTE > 0;
  const hasCore = hasRevenue && hasHeadcount;

  // ── Load persisted inputs on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!workspaceId) { setInitialLoading(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("rpe_health_check_state")
      .select("inputs")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
      .then(({ data }: { data: { inputs: RPEInputs } | null }) => {
        if (data?.inputs) setInputs({ ...DEFAULTS, ...data.inputs });
        setInitialLoading(false);
      });
  }, [workspaceId]);

  // ── Persist helper (upsert on workspace_id conflict) ───────────────────────
  const persist = useCallback(async (updated: RPEInputs) => {
    if (!workspaceId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("rpe_health_check_state")
      .upsert(
        { workspace_id: workspaceId, inputs: updated },
        { onConflict: "workspace_id" }
      );
  }, [workspaceId]);

  function set<K extends keyof RPEInputs>(key: K, value: RPEInputs[K]) {
    setInputs((prev) => {
      const updated = { ...prev, [key]: value };
      persist(updated);
      return updated;
    });
  }

  function reset() {
    setInputs(DEFAULTS);
    persist(DEFAULTS);
  }

  // ── Role-load helper text ───────────────────────────────────────────────────
  function roleLoadSubtext(jobsPerRole: number | undefined, role: string): string {
    if (jobsPerRole === undefined) return "Enter job count to see load.";
    if (jobsPerRole > 40)
      return `${role}s are carrying a heavy load. This can signal burnout risk and missed details.`;
    if (jobsPerRole > 25)
      return `Moderate load. Worth watching as volume grows.`;
    return `Load looks manageable. ${role}s have room to give each job proper attention.`;
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
            <Skeleton className="h-[520px] rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-56 rounded-lg" />
              <Skeleton className="h-48 rounded-lg" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            RPE Health Check
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            A quick scan of revenue per employee and staffing load. This helps us see where
            the organization is carrying extra weight or asking too much of a small team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

          {/* ── Left: Inputs ─────────────────────────────────────────────── */}
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Inputs</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="text-muted-foreground h-7 px-2 text-xs gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Required fields */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Core
                </p>
                <FormField
                  id="revenue"
                  label="Annual Revenue"
                  prefix="$"
                  placeholder="2000000"
                  value={inputs.revenue || undefined}
                  onChange={(v) => set("revenue", v ?? 0)}
                  required
                />
                <FormField
                  id="fieldFTE"
                  label="Field FTE"
                  placeholder="8"
                  value={inputs.fieldFTE || undefined}
                  onChange={(v) => set("fieldFTE", v ?? 0)}
                  required
                />
                <FormField
                  id="nonFieldFTE"
                  label="Non-Field FTE"
                  placeholder="3"
                  value={inputs.nonFieldFTE || undefined}
                  onChange={(v) => set("nonFieldFTE", v ?? 0)}
                  required
                />
              </div>

              <Separator />

              {/* Volume fields */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Volume
                </p>
                <FormField
                  id="averageContractValue"
                  label="Average Contract Value"
                  prefix="$"
                  placeholder="85000"
                  value={inputs.averageContractValue}
                  onChange={(v) => set("averageContractValue", v)}
                />
                <FormField
                  id="backlog"
                  label="Current Backlog"
                  prefix="$"
                  placeholder="1200000"
                  value={inputs.backlog}
                  onChange={(v) => set("backlog", v)}
                />
              </div>

              <Separator />

              {/* Role counts */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Role Counts
                </p>
                <FormField
                  id="pmCount"
                  label="Project Managers"
                  placeholder="2"
                  value={inputs.pmCount}
                  onChange={(v) => set("pmCount", v)}
                />
                <FormField
                  id="designerCount"
                  label="Designers"
                  placeholder="1"
                  value={inputs.designerCount}
                  onChange={(v) => set("designerCount", v)}
                />
                <FormField
                  id="salesCount"
                  label="Sales Reps"
                  placeholder="2"
                  value={inputs.salesCount}
                  onChange={(v) => set("salesCount", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Right: Outputs ───────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* ── RPE Gauge ───────────────────────────────────────────────── */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="shrink-0">
                    <RPEGauge value={hasCore ? metrics.totalRPE : 0} benchmark={benchmark} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="text-base font-semibold text-foreground">
                      Total Company RPE
                    </h2>
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                      {hasCore ? fmt(metrics.totalRPE) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                      This is revenue per full-time equivalent. Higher RPE usually means a leaner,
                      more productive organization.
                    </p>
                    {hasCore && (
                      <p className="text-xs text-muted-foreground italic">{benchmark.description}</p>
                    )}
                    {!hasCore && (
                      <p className="text-xs text-muted-foreground">
                        Enter annual revenue and headcount to see your RPE.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Metric Cards ─────────────────────────────────────────────── */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Key Metrics
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricCard
                  label="Field RPE"
                  value={hasCore ? fmt(metrics.fieldRPE) : undefined}
                  subtext="Revenue per field / production employee."
                  icon={<BarChart3 className="w-4 h-4" />}
                />
                <MetricCard
                  label="Non-Field RPE"
                  value={hasCore ? fmt(metrics.nonFieldRPE) : undefined}
                  subtext="Revenue per overhead employee."
                  icon={<Users className="w-4 h-4" />}
                />
                <MetricCard
                  label="Total FTE"
                  value={hasHeadcount ? fmt(metrics.totalFTE, "decimal") : undefined}
                  subtext="Field + non-field headcount."
                  icon={<Users className="w-4 h-4" />}
                />
                <MetricCard
                  label="Jobs per Year"
                  value={
                    metrics.jobsPerYear !== undefined
                      ? fmt(metrics.jobsPerYear, "decimal")
                      : undefined
                  }
                  subtext="Based on revenue ÷ average contract value."
                  icon={<Briefcase className="w-4 h-4" />}
                />
                <MetricCard
                  label="Implied WIP"
                  value={
                    metrics.impliedWIP !== undefined
                      ? fmt(metrics.impliedWIP, "decimal")
                      : undefined
                  }
                  subtext="Estimated jobs actively running right now (12-wk avg)."
                  icon={<TrendingUp className="w-4 h-4" />}
                />
                <MetricCard
                  label="Backlog (Months)"
                  value={
                    metrics.backlogMonths !== undefined
                      ? fmt(metrics.backlogMonths, "decimal")
                      : undefined
                  }
                  subtext="Current backlog relative to monthly revenue run-rate."
                  icon={<Clock className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* ── Role Load Grid ───────────────────────────────────────────── */}
            {(inputs.pmCount || inputs.designerCount || inputs.salesCount) &&
              metrics.jobsPerYear !== undefined && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Role Load
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {inputs.pmCount !== undefined && (
                      <MetricCard
                        label="Jobs / PM / Year"
                        value={
                          metrics.jobsPerPM !== undefined
                            ? fmt(metrics.jobsPerPM, "decimal")
                            : undefined
                        }
                        subtext={roleLoadSubtext(metrics.jobsPerPM, "PM")}
                        highlight={
                          metrics.jobsPerPM !== undefined && metrics.jobsPerPM > 40
                            ? "caution"
                            : metrics.jobsPerPM !== undefined && metrics.jobsPerPM <= 25
                            ? "good"
                            : "neutral"
                        }
                        icon={<Briefcase className="w-4 h-4" />}
                      />
                    )}
                    {inputs.designerCount !== undefined && (
                      <MetricCard
                        label="Jobs / Designer / Year"
                        value={
                          metrics.jobsPerDesigner !== undefined
                            ? fmt(metrics.jobsPerDesigner, "decimal")
                            : undefined
                        }
                        subtext={roleLoadSubtext(metrics.jobsPerDesigner, "Designer")}
                        highlight={
                          metrics.jobsPerDesigner !== undefined && metrics.jobsPerDesigner > 40
                            ? "caution"
                            : metrics.jobsPerDesigner !== undefined && metrics.jobsPerDesigner <= 25
                            ? "good"
                            : "neutral"
                        }
                        icon={<BarChart3 className="w-4 h-4" />}
                      />
                    )}
                    {inputs.salesCount !== undefined && (
                      <MetricCard
                        label="Jobs / Sales Rep / Year"
                        value={
                          metrics.jobsPerSales !== undefined
                            ? fmt(metrics.jobsPerSales, "decimal")
                            : undefined
                        }
                        subtext={roleLoadSubtext(metrics.jobsPerSales, "Sales rep")}
                        highlight={
                          metrics.jobsPerSales !== undefined && metrics.jobsPerSales > 40
                            ? "caution"
                            : metrics.jobsPerSales !== undefined && metrics.jobsPerSales <= 25
                            ? "good"
                            : "neutral"
                        }
                        icon={<TrendingUp className="w-4 h-4" />}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    If a number is high, it can signal a risk of burnout and missed details.
                    Use this as a starting point for a conversation — not a final verdict.
                  </p>
                </div>
              )}
            {/* ── Staffing Breakdown Chart ─────────────────────────────────── */}
            {hasHeadcount && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Staffing Breakdown
                </p>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">
                      Field vs. Non-Field FTE
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Headcount split between production staff and overhead roles.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // 3:1 benchmark — for every 3 field FTE, 1 overhead is the industry target.
                      // We draw a horizontal reference line at fieldFTE / 3 to show the ideal non-field headcount.
                      const benchmarkY = inputs.fieldFTE > 0
                        ? Math.round((inputs.fieldFTE / 3) * 10) / 10
                        : null;
                      const nonFieldAbove = benchmarkY !== null && inputs.nonFieldFTE > benchmarkY;

                      return (
                        <>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart
                              data={[
                                { name: "Field FTE",     value: inputs.fieldFTE },
                                { name: "Non-Field FTE", value: inputs.nonFieldFTE },
                              ]}
                              margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
                              barCategoryGap="40%"
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="hsl(var(--border))"
                              />
                              <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                              />
                              <YAxis
                                allowDecimals={false}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                width={28}
                              />
                              <Tooltip
                                cursor={{ fill: "hsl(var(--muted))" }}
                                contentStyle={{
                                  background: "hsl(var(--card))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  color: "hsl(var(--foreground))",
                                }}
                                formatter={(v: number) => [v, "FTE"]}
                              />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={80}>
                                <Cell fill="hsl(var(--primary))" />
                                <Cell fill={nonFieldAbove ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"} opacity={0.6} />
                              </Bar>
                              {benchmarkY !== null && (
                                <ReferenceLine
                                  y={benchmarkY}
                                  stroke="hsl(var(--primary))"
                                  strokeDasharray="5 3"
                                  strokeWidth={1.5}
                                  label={{
                                    value: `3:1 target (${benchmarkY})`,
                                    position: "insideTopRight",
                                    fontSize: 11,
                                    fill: "hsl(var(--primary))",
                                    dy: -4,
                                  }}
                                />
                              )}
                            </BarChart>
                          </ResponsiveContainer>

                          <div className="flex items-center gap-5 mt-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary" />
                              Field FTE
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-sm"
                                style={{ background: nonFieldAbove ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))", opacity: 0.6 }}
                              />
                              Non-Field FTE
                            </span>
                            {benchmarkY !== null && (
                              <span className="flex items-center gap-1.5">
                                <span className="inline-block w-4 border-t border-dashed border-primary" style={{ borderWidth: 1.5 }} />
                                3:1 industry benchmark
                              </span>
                            )}
                          </div>

                          {benchmarkY !== null && nonFieldAbove && (
                            <p className="mt-3 text-xs text-destructive leading-relaxed">
                              Non-field headcount ({inputs.nonFieldFTE}) exceeds the 3:1 benchmark ({benchmarkY}). This may indicate overhead bloat worth investigating.
                            </p>
                          )}
                          {benchmarkY !== null && !nonFieldAbove && inputs.nonFieldFTE > 0 && (
                            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                              Non-field headcount is within the 3:1 benchmark. Overhead looks proportionate to field capacity.
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

