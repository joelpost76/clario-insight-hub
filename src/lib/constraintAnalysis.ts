import { supabase } from "@/integrations/supabase/client";
import type { StructuredIntakeData, ConstraintAnalysis } from "@/types/clarioConstraintTypes";

/**
 * Calls the analyze-constraint edge function and returns a real AI-generated ConstraintAnalysis.
 */
export async function runConstraintAnalysis(
  data: StructuredIntakeData
): Promise<ConstraintAnalysis> {
  const { data: result, error } = await supabase.functions.invoke("analyze-constraint", {
    body: { data },
  });

  if (error) {
    // Surface user-friendly messages for rate limit / payment errors
    const msg = (error as { message?: string }).message ?? String(error);
    if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    if (msg.includes("402") || msg.toLowerCase().includes("credits")) {
      throw new Error("AI usage limit reached. Please add credits to continue.");
    }
    throw new Error(msg || "Failed to run constraint analysis.");
  }

  if (!result?.analysis) {
    throw new Error("The AI did not return a valid analysis. Please try again.");
  }

  return result.analysis as ConstraintAnalysis;
}
