import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  JobRecord,
  AggregateMetrics,
  computeAggregateMetrics,
  parseCSV,
  autoMapColumns,
  mapRowToJob,
} from "@/lib/calculations";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScopeCreepAssessment {
  id: string;
  workspace_id: string;
  client_id: string;
  current_step: number;
  is_complete: boolean;
  total_jobs: number | null;
  date_range_start: string | null;
  date_range_end: string | null;
  avg_estimate_accuracy: number | null;
  co_capture_rate: number | null;
  total_margin_leakage: number | null;
  constraint_score: number | null;
  root_cause_notes: string | null;
  impact_model: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ColumnMap {
  id: string;
  assessment_id: string;
  raw_headers: string[];
  mapping: Record<string, string>;
  created_at: string;
}

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

interface ScopeCreepContextType {
  assessment: ScopeCreepAssessment | null;
  jobs: JobRecord[];
  columnMap: ColumnMap | null;
  metrics: AggregateMetrics | null;
  parsedCSV: ParsedCSV | null;
  isLoading: boolean;
  error: string | null;
  createAssessment: (clientId: string, workspaceId: string) => Promise<string>;
  loadAssessment: (id: string) => Promise<void>;
  parseFileForMapping: (file: File) => Promise<void>;
  uploadAndParseJobs: (mapping: Record<string, string>) => Promise<void>;
  updateJobRecord: (jobId: string, data: Partial<JobRecord>) => Promise<void>;
  toggleJobExclusion: (jobId: string) => Promise<void>;
  runAnalysis: () => Promise<void>;
  updateRootCause: (data: { root_cause_notes: string }) => Promise<void>;
  updateImpactModel: (data: Record<string, any>) => Promise<void>;
  completeStep: (step: number) => Promise<void>;
  setError: (err: string | null) => void;
}

const ScopeCreepContext = createContext<ScopeCreepContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ScopeCreepProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<ScopeCreepAssessment | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap | null>(null);
  const [metrics, setMetrics] = useState<AggregateMetrics | null>(null);
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── createAssessment ────────────────────────────────────────────────────────
  const createAssessment = useCallback(async (clientId: string, workspaceId: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("scope_creep_assessments")
        .insert({ client_id: clientId, workspace_id: workspaceId, current_step: 1 })
        .select()
        .single();

      if (err) throw err;
      setAssessment(data as ScopeCreepAssessment);
      return data.id;
    } catch (e: any) {
      setError(e.message ?? "Failed to create assessment");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── loadAssessment ──────────────────────────────────────────────────────────
  const loadAssessment = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [assessmentRes, jobsRes, mapRes] = await Promise.all([
        supabase.from("scope_creep_assessments").select("*").eq("id", id).single(),
        supabase.from("scope_creep_jobs").select("*").eq("assessment_id", id).order("job_name"),
        supabase.from("scope_creep_column_map").select("*").eq("assessment_id", id).maybeSingle(),
      ]);

      if (assessmentRes.error) throw assessmentRes.error;

      const assessmentData = assessmentRes.data as ScopeCreepAssessment;
      setAssessment(assessmentData);
      setJobs((jobsRes.data ?? []) as JobRecord[]);
      setColumnMap(mapRes.data ? {
        ...mapRes.data,
        raw_headers: mapRes.data.raw_headers as string[],
        mapping: mapRes.data.mapping as Record<string, string>,
      } : null);

      // Re-derive metrics if jobs exist
      if (jobsRes.data && jobsRes.data.length > 0) {
        setMetrics(computeAggregateMetrics(jobsRes.data as JobRecord[]));
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load assessment");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── parseFileForMapping ─────────────────────────────────────────────────────
  const parseFileForMapping = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) throw new Error("No columns found in CSV. Please check your file.");
      if (rows.length === 0) throw new Error("No data rows found in CSV.");
      setParsedCSV({ headers, rows });
    } catch (e: any) {
      setError(e.message ?? "Failed to parse CSV");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── uploadAndParseJobs ──────────────────────────────────────────────────────
  const uploadAndParseJobs = useCallback(async (mapping: Record<string, string>) => {
    if (!assessment || !parsedCSV) return;
    setIsLoading(true);
    setError(null);
    try {
      // Save mapping
      const { data: existingMap } = await supabase
        .from("scope_creep_column_map")
        .select("id")
        .eq("assessment_id", assessment.id)
        .maybeSingle();

      if (existingMap) {
        await supabase
          .from("scope_creep_column_map")
          .update({ raw_headers: parsedCSV.headers, mapping })
          .eq("id", existingMap.id);
      } else {
        await supabase
          .from("scope_creep_column_map")
          .insert({ assessment_id: assessment.id, raw_headers: parsedCSV.headers, mapping });
      }

      // Delete existing jobs and re-insert
      await supabase.from("scope_creep_jobs").delete().eq("assessment_id", assessment.id);

      const jobInserts = parsedCSV.rows.map((row) => ({
        assessment_id: assessment.id,
        ...mapRowToJob(row, mapping),
      }));

      const { data: insertedJobs, error: insertErr } = await supabase
        .from("scope_creep_jobs")
        .insert(jobInserts)
        .select();

      if (insertErr) throw insertErr;

      const newJobs = (insertedJobs ?? []) as JobRecord[];
      setJobs(newJobs);
      setMetrics(computeAggregateMetrics(newJobs));

      // Update total_jobs on assessment
      await supabase
        .from("scope_creep_assessments")
        .update({ total_jobs: newJobs.length })
        .eq("id", assessment.id);

      setAssessment((prev) => prev ? { ...prev, total_jobs: newJobs.length } : prev);
    } catch (e: any) {
      setError(e.message ?? "Failed to import jobs");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [assessment, parsedCSV]);

  // ── updateJobRecord ─────────────────────────────────────────────────────────
  const updateJobRecord = useCallback(async (jobId: string, data: Partial<JobRecord>) => {
    setError(null);
    try {
      const { error: err } = await supabase
        .from("scope_creep_jobs")
        .update(data)
        .eq("id", jobId);
      if (err) throw err;

      setJobs((prev) => {
        const updated = prev.map((j) => (j.id === jobId ? { ...j, ...data } : j));
        setMetrics(computeAggregateMetrics(updated));
        return updated;
      });
    } catch (e: any) {
      setError(e.message ?? "Failed to update job");
    }
  }, []);

  // ── toggleJobExclusion ──────────────────────────────────────────────────────
  const toggleJobExclusion = useCallback(async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    await updateJobRecord(jobId, { is_excluded: !job.is_excluded });
  }, [jobs, updateJobRecord]);

  // ── runAnalysis ─────────────────────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    if (!assessment) return;
    setIsLoading(true);
    setError(null);
    try {
      const freshJobs = jobs;
      const m = computeAggregateMetrics(freshJobs);
      setMetrics(m);

      const { error: err } = await supabase
        .from("scope_creep_assessments")
        .update({
          avg_estimate_accuracy: m.avg_estimate_accuracy,
          co_capture_rate: m.co_capture_rate,
          total_margin_leakage: m.total_margin_leakage,
          constraint_score: m.constraint_score,
        })
        .eq("id", assessment.id);

      if (err) throw err;

      setAssessment((prev) =>
        prev
          ? {
              ...prev,
              avg_estimate_accuracy: m.avg_estimate_accuracy,
              co_capture_rate: m.co_capture_rate,
              total_margin_leakage: m.total_margin_leakage,
              constraint_score: m.constraint_score,
            }
          : prev
      );
    } catch (e: any) {
      setError(e.message ?? "Failed to run analysis");
    } finally {
      setIsLoading(false);
    }
  }, [assessment, jobs]);

  // ── updateRootCause ─────────────────────────────────────────────────────────
  const updateRootCause = useCallback(async (data: { root_cause_notes: string }) => {
    if (!assessment) return;
    setError(null);
    const { error: err } = await supabase
      .from("scope_creep_assessments")
      .update({ root_cause_notes: data.root_cause_notes })
      .eq("id", assessment.id);
    if (err) { setError(err.message); return; }
    setAssessment((prev) => prev ? { ...prev, ...data } : prev);
  }, [assessment]);

  // ── updateImpactModel ───────────────────────────────────────────────────────
  const updateImpactModel = useCallback(async (data: Record<string, any>) => {
    if (!assessment) return;
    setError(null);
    const { error: err } = await supabase
      .from("scope_creep_assessments")
      .update({ impact_model: data })
      .eq("id", assessment.id);
    if (err) { setError(err.message); return; }
    setAssessment((prev) => prev ? { ...prev, impact_model: data } : prev);
  }, [assessment]);

  // ── completeStep ────────────────────────────────────────────────────────────
  const completeStep = useCallback(async (step: number) => {
    if (!assessment) return;
    setError(null);
    const nextStep = step + 1;
    const isLast = step >= 5;

    try {
      await supabase
        .from("scope_creep_assessments")
        .update({
          current_step: isLast ? step : nextStep,
          is_complete: isLast ? true : false,
        })
        .eq("id", assessment.id);

      // Capture snapshot (gracefully skip if table doesn't exist)
      try {
        await (supabase as any).from("assessment_snapshots").insert({
          assessment_id: assessment.id,
          type: "scope_creep",
        });
      } catch (_) {
        // snapshot table may not exist yet — non-blocking
      }

      setAssessment((prev) =>
        prev
          ? { ...prev, current_step: isLast ? step : nextStep, is_complete: isLast }
          : prev
      );

      if (!isLast) {
        navigate(`/scope-creep/assessment/${assessment.id}/step/${nextStep}`);
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to complete step");
    }
  }, [assessment, navigate]);

  return (
    <ScopeCreepContext.Provider
      value={{
        assessment,
        jobs,
        columnMap,
        metrics,
        parsedCSV,
        isLoading,
        error,
        createAssessment,
        loadAssessment,
        parseFileForMapping,
        uploadAndParseJobs,
        updateJobRecord,
        toggleJobExclusion,
        runAnalysis,
        updateRootCause,
        updateImpactModel,
        completeStep,
        setError,
      }}
    >
      {children}
    </ScopeCreepContext.Provider>
  );
}

export function useScopeCreep() {
  const ctx = useContext(ScopeCreepContext);
  if (!ctx) throw new Error("useScopeCreep must be used within ScopeCreepProvider");
  return ctx;
}
