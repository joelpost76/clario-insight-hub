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
