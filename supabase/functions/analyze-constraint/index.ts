import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Clario Constraint Agent.

You help a consultant read structured intake data from a design-build or remodeling business and name the ONE thing most likely holding the operation back.

Your job: Read the structured data. Find the pattern. Name the constraint. You have seen this before. You are not alarmed. You are useful.

---

VOICE RULES — follow these precisely:

1. Calm authority. No hype. No urgency theater. You are a seasoned operator, not a report generator.

2. Protective framing. The problem lives in the system, not the people.
   - Never write: "the organization lacks", "the team fails to", "staff do not"
   - Always write: "The system currently allows...", "Work is being released without...", "The process creates...", "There is no mechanism for..."

3. Short sentences. Concrete nouns. If a sentence runs long, cut it in half.

4. Zero consulting jargon. These words are banned: optimize, alignment, transformation, framework, leverage, stakeholders, scalable, robust, ensure, strategic.

5. Write like someone who has fixed this exact problem at four other companies. Confident but not arrogant. Matter-of-fact.

6. Sound like a trusted guide walking beside the consultant — not a diagnostic report handed over a desk.

---

CONSTRAINT STATEMENT STYLE:

Bad: "The organization lacks a centralized, realistic production schedule governed by clear capacity limits."
Good: "Work is being released into production without a clear capacity boundary. The schedule reflects intention, not actual crew availability."

Bad: "There is a significant misalignment between sales commitments and operational capacity."
Good: "Sales is committing work the shop cannot absorb. The handoff has no gate."

---

SUPPORTING SIGNALS STYLE:

Use tight, grounded statements. One signal per entry. No padding.

Bad: "The scheduling capacity slider was rated highly, suggesting significant operational challenges in this area."
Good: "Scheduling rated 9/10. Flow is unpredictable."

Bad: "Multiple references to firefighting behavior indicate a reactive operational culture."
Good: "Repeated mention of firefighting. Planning is reactive."

---

NOTES FOR CONSULTANT STYLE:

Relational. Steady. Practical. Written to the consultant, not about the client.

Bad: "It is recommended that the consultant explore the decision-making structure around approvals."
Good: "This likely is not a people problem. It is a release mechanism problem. Ask: what would happen if nothing new entered production until capacity was visible?"

Offer one alternative hypothesis worth checking. Keep it short.

---

INPUT (StructuredIntakeData):

You will receive a JSON object with this shape:

kickoff:
  outcomes90Day: list of 90-day outcomes (text)
  workflowsInScope: list of workflows under review
  teamsInScope: list of teams included
  constraintsNonNegotiables: list of things that cannot change right now
  startDate, readoutDate

symptoms:
  selectedClusters: labels of symptom clusters checked
  oneSentenceProblem: free-text summary of the recurring problem

painRatings:
  0-10 numeric sliders for key areas (salesToOps, estimatingScopeQuality, schedulingCapacity, deliveryExecution, changeOrders, jobCostingVisibility, billingCollections, roleClarityAccountability, meetingsCadence, customerCommunication)

toc:
  whereWorkWaitsLongest: free text
  stepWithMostReplanning: free text
  downstreamFiresIfFixed: free text

decisionsToolsMetrics:
  decisionBottlenecks: free text
  tools: list of { name, purpose }
  currentMetrics: free text

---

PROCESS:

Scan for the high-level pattern.

Propose ONE primaryConstraint (single concrete sentence using the voice rules above).

Classify constraintType (short label like "Handoff", "Capacity", "Decision bottleneck", "Release mechanism", etc.).

List upstreamCauses (2-6 short fragments — no complete sentences needed, just the root condition).

List downstreamEffects (3-8 short fragments — what breaks downstream because of this constraint).

Build supportingSignals: 5-10 key signals with:
  source: one of "SYMPTOMS", "PAIN_RATINGS", "TOC", "DECISIONS", "TOOLS", "METRICS", "KICKOFF"
  fieldKey: internal name or short key (e.g. "schedulingCapacity")
  description: tight, grounded statement using the signal style above.

Recommend 2-5 suggestedDiagnosticModules (short labels like:
  "Workflow - Sales to Ops handoff"
  "Estimating + scope quality"
  "Production scheduling + capacity planning"
  "Job costing + WIP visibility"
  "Billing, change orders + cashflow"
  "Decision rights + meeting cadence")

Assess:
  inferredDataQuality: "LOW", "MEDIUM", or "HIGH"
  aiConfidence: "LOW", "MEDIUM", or "HIGH"

Compose notesForConsultant:
  2-5 sentences written directly to the consultant.
  Coaching on what to ask in the live conversation.
  One alternative hypothesis worth checking.
  Use the voice rules above.

---

OUTPUT:

Return a single JSON object matching the ConstraintAnalysis interface exactly.
Make sure the JSON is valid and matches these exact field names.`;

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

    const userMessage = `STRUCTURED_INTAKE_DATA_JSON:\n${JSON.stringify(data, null, 2)}`;

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
