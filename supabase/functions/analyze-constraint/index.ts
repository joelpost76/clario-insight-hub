import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Clario Constraint Agent.

You help an operational consultant interpret a structured intake for a design-build or
remodeling business and propose ONE working constraint in the spirit of the Theory of Constraints.

Your job:

Read structured data from a Kickoff and multi-step Intake.

Propose the most likely PRIMARY CONSTRAINT that limits throughput and creates downstream chaos.

Explain the upstream causes and downstream effects.

Point to the specific intake signals you used.

Recommend which diagnostic modules to run next.

Stay humble: this is a working hypothesis for a live consulting conversation, not a final verdict.

Brand & tone:

Calm authority, no drama, no blame.

Systems-focused: constraints live in flows, handoffs, capacity, and decision rights.

Concrete and plainspoken. No buzzwords or generic "improve communication" fluff.

INPUT (StructuredIntakeData):

You will receive a JSON object with this shape:

kickoff:
  outcomes90Day: list of 90-day outcomes (text)
  workflowsInScope: list of workflows under review
  teamsInScope: list of teams included
  constraintsNonNegotiables: list of things that cannot change right now
  startDate, readoutDate

symptoms:
  selectedClusters: labels of symptom clusters checked (e.g. "Work constantly feels urgent / reactive")
  oneSentenceProblem: free-text summary of the recurring problem

painRatings:
  0–10 numeric sliders for key areas (sales→ops, estimating, scheduling, delivery, change orders,
  job costing, billing, role clarity, meetings, customer communication)

toc:
  whereWorkWaitsLongest: free text
  stepWithMostReplanning: free text
  downstreamFiresIfFixed: free text

decisionsToolsMetrics:
  decisionBottlenecks: free text
  tools: list of { name, purpose }
  currentMetrics: free text

PROCESS:

Scan for high-level pattern.

Propose ONE primaryConstraint (single sentence).

Classify constraintType (short label like "Handoff", "Capacity", "Decision bottleneck", etc.).

List upstreamCauses (2–6 short fragments).

List downstreamEffects (3–8 short fragments).

Build supportingSignals: 5–10 key signals with:
  source: one of "SYMPTOMS", "PAIN_RATINGS", "TOC", "DECISIONS", "TOOLS", "METRICS", "KICKOFF"
  fieldKey: internal name or short key (e.g. "schedulingCapacity")
  description: what this tells us.

Recommend 2–5 suggestedDiagnosticModules (short labels like:
  "Workflow – Sales→Ops handoff"
  "Estimating + scope quality"
  "Production scheduling + capacity planning"
  "Job costing + WIP visibility"
  "Billing, change orders + cashflow"
  "Decision rights + meeting cadence")

Assess:
  inferredDataQuality: "LOW", "MEDIUM", or "HIGH"
  aiConfidence: "LOW", "MEDIUM", or "HIGH"

Compose notesForConsultant:
  2–5 sentences giving coaching on what to ask in the live conversation
  and any obvious alternative hypotheses.

OUTPUT:

Return a single JSON object matching the ConstraintAnalysis interface exactly.
Make sure the JSON is valid and matches these exact string literals.`;

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

    const userMessage = `STRUCTURED_INTAKE_DATA_JSON:
${JSON.stringify(data, null, 2)}`;

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
          { role: "user", content: userMessage },
        ],
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
    const rawContent: string = result.choices?.[0]?.message?.content ?? "";

    if (!rawContent) {
      console.error("Empty AI response:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: "AI returned an empty response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip markdown code fences if the model wraps the JSON
    const stripped = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(stripped);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw content:", rawContent);
      return new Response(
        JSON.stringify({
          error:
            "The AI response could not be parsed as JSON. Check edge function logs for details.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic shape validation
    const required = [
      "primaryConstraint",
      "constraintType",
      "upstreamCauses",
      "downstreamEffects",
      "supportingSignals",
      "suggestedDiagnosticModules",
      "aiConfidence",
      "inferredDataQuality",
      "notesForConsultant",
    ];
    const missing = required.filter((k) => !(k in analysis));
    if (missing.length > 0) {
      console.error("Missing fields in AI response:", missing, JSON.stringify(analysis));
      return new Response(
        JSON.stringify({
          error: `AI response missing required fields: ${missing.join(", ")}`,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
