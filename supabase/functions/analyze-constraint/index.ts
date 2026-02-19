import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert operations consultant trained in the Theory of Constraints (TOC), Lean, and systems thinking. Your role is to analyse diagnostic intake data from a small-to-mid-sized contracting or service business and identify the single most likely binding constraint in their operational system.

You will receive structured intake data containing:
- Kickoff context: 90-day outcomes, workflows in scope, teams, non-negotiables
- Symptom clusters and the client's own one-sentence problem statement
- Pain ratings (0–10) across 10 operational dimensions
- TOC prompts: where work waits, what forces re-planning, what downstream fires shrink if the constraint is fixed
- Decision bottlenecks, current tools, and metrics tracked

Your job is to reason across all signals and return a structured ConstraintAnalysis.

Guidelines:
- Identify ONE primary constraint — the place in the system where fixing it would unlock the most downstream improvement.
- Be specific. Name the exact handoff, decision point, or process step — not a vague category.
- Use the pain ratings to weight your reasoning: higher ratings are stronger signals.
- Cross-reference TOC answers with symptom clusters and decision bottlenecks to find convergence.
- Supporting signals should cite the actual data fields and explain why they point to the constraint.
- Upstream causes are system-level reasons this constraint exists (not symptoms).
- Downstream effects are what fires, delays, or costs shrink if this constraint improves.
- aiConfidence: HIGH if multiple independent signals converge on the same constraint; MEDIUM if 2–3 signals point the same way; LOW if data is sparse or contradictory.
- inferredDataQuality: HIGH if TOC answers are detailed and pain ratings span the full range; MEDIUM if some answers are brief; LOW if most fields are empty or generic.
- notesForConsultant: practical coaching notes — what to verify in interviews, quick wins adjacent to the constraint, or data gaps to fill before locking.

Return ONLY the structured JSON — no prose outside the tool call.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data } = await req.json();
    if (!data) {
      return new Response(
        JSON.stringify({ error: "Missing required field: data (StructuredIntakeData)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Here is the structured intake data for this client. Analyse it and return a ConstraintAnalysis.

${JSON.stringify(data, null, 2)}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "return_constraint_analysis",
          description: "Return the structured constraint analysis result.",
          parameters: {
            type: "object",
            properties: {
              primaryConstraint: {
                type: "string",
                description: "One clear sentence naming the binding constraint.",
              },
              constraintType: {
                type: "string",
                description:
                  "Short category label, e.g. 'Handoff / Process Gap', 'Capacity Bottleneck', 'Decision Bottleneck', 'Rework Loop', 'Information Gap'.",
              },
              upstreamCauses: {
                type: "array",
                items: { type: "string" },
                description: "System-level reasons this constraint exists (3–5 items).",
              },
              downstreamEffects: {
                type: "array",
                items: { type: "string" },
                description: "Pain, cost, or delays that reduce if this constraint improves (3–5 items).",
              },
              supportingSignals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                      enum: ["SYMPTOMS", "PAIN_RATINGS", "TOC", "DECISIONS", "TOOLS", "METRICS", "KICKOFF"],
                    },
                    fieldKey: {
                      type: "string",
                      description: "The specific field name from the intake data.",
                    },
                    description: {
                      type: "string",
                      description: "Plain-English explanation of why this signal points to the constraint.",
                    },
                  },
                  required: ["source", "fieldKey", "description"],
                  additionalProperties: false,
                },
                description: "5–8 signals from the intake data that support this constraint.",
              },
              suggestedDiagnosticModules: {
                type: "array",
                items: { type: "string" },
                description:
                  "3–5 specific diagnostic activities to validate or deepen understanding of this constraint (e.g. 'Workflow Map – PM Closeout to Finance Trigger').",
              },
              aiConfidence: {
                type: "string",
                enum: ["LOW", "MEDIUM", "HIGH"],
                description: "How confident the AI is in this constraint given the data.",
              },
              inferredDataQuality: {
                type: "string",
                enum: ["LOW", "MEDIUM", "HIGH"],
                description: "Quality of the intake data provided.",
              },
              notesForConsultant: {
                type: "string",
                description:
                  "Brief coaching notes: what to verify in interviews, adjacent quick wins, or data gaps to fill.",
              },
            },
            required: [
              "primaryConstraint",
              "constraintType",
              "upstreamCauses",
              "downstreamEffects",
              "supportingSignals",
              "suggestedDiagnosticModules",
              "aiConfidence",
              "inferredDataQuality",
              "notesForConsultant",
            ],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "return_constraint_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI gateway error [${response.status}]` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();

    // Extract structured output from tool call
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: "AI did not return a structured analysis." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-constraint error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
