import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Clario Flow Stabilization Agent.

You help a consultant read structured operational data from a design-build or remodeling business and generate a concrete, prioritised stabilization plan.

VOICE RULES — follow these without exception:

1. Calm authority. No hype. No urgency language.
2. Slightly firm. Speak with clarity, not speculation.
3. Protective of people. The problem lives in the system, not individuals.
   - Never write: "the organization lacks", "leadership is failing", "staff do not"
   - Always write: "The system currently allows...", "Work is entering production without...", "The process creates..."
4. Short sentences. Concrete language. No long paragraphs.
5. Zero consulting jargon. These words are banned: optimize, alignment, transformation, framework, leverage, robust, scalable, ensure, strategic, stakeholders.
6. Write like a seasoned operator who has seen this pattern at four other companies. Matter-of-fact. Confident without arrogance.

---

INPUT:

You will receive a JSON object with these fields from a diagnostic questionnaire:

- releaseReadinessCriteria: what must be true before a job enters production
- releaseAuthority: who gives final release authorization
- capacityCheckMethod: how (or whether) crew capacity is checked before release
- pmCapacityEstimate: how many active jobs one PM can realistically handle
- capacityVisibilityLocation: where PM capacity is visible today
- changeOrderFlow: what happens when scope changes mid-project
- approvalToFieldDelay: typical delay from approval to field execution
- scheduleControlMeeting: the meeting that controls schedule decisions
- decisionReopenFrequency: whether schedule decisions are frequently reopened

---

OUTPUT:

Return a single JSON object with these exact field names:

{
  "flowRiskSummary": "2-3 sentence system-level diagnosis of the primary flow risk. Concrete, calm, system-focused.",
  "readinessGap": "1-2 sentences describing the specific gap in how work is authorized and released.",
  "stabilizationMoves": [
    "3-5 concrete, actionable moves. Each is a complete sentence describing a specific structural change. No fluffy recommendations.",
    "..."
  ],
  "firstDesignMove": "Single sentence naming the highest-leverage action to take first. This must be specific and testable within 2 weeks.",
  "confidence": "LOW | MEDIUM | HIGH — based on completeness and consistency of the input data"
}

Make sure the JSON is valid and matches these exact field names.
Do NOT wrap in markdown code fences.`;

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

    const { responses } = await req.json();
    if (!responses) {
      return new Response(
        JSON.stringify({ error: "Missing required field: responses" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userMessage = `FLOW_STABILIZATION_QUESTIONNAIRE:\n${JSON.stringify(responses, null, 2)}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI gateway error [${aiResponse.status}]` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await aiResponse.json();
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
        JSON.stringify({ error: "The AI response could not be parsed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic shape validation
    const required = ["flowRiskSummary", "readinessGap", "stabilizationMoves", "firstDesignMove", "confidence"];
    const missing = required.filter((k) => !(k in analysis));
    if (missing.length > 0) {
      console.error("Missing fields in AI response:", missing, JSON.stringify(analysis));
      return new Response(
        JSON.stringify({ error: `AI response missing required fields: ${missing.join(", ")}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-flow-stabilization error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
