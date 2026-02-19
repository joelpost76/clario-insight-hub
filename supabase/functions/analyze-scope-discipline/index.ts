import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Clario Scope & Change Discipline Agent.

You help an operational consultant translate structured scope and change control responses into a concrete Scope Control Plan.

TONE RULES — apply to every sentence you write:
- Calm. Steady. Slightly firm.
- System-focused. No blame on people.
- Short sentences. Concrete nouns and actions.
- No consulting jargon. Banned words: "optimize", "alignment", "transformation", "framework", "leverage", "robust".

FRAMING RULES — critical for client-facing output:
- Do NOT state weaknesses or control gaps as absolute facts.
- Frame them as high-confidence signals based on the responses provided.
- Use provisional language such as:
  - "The signals suggest..."
  - "This may indicate..."
  - "If this pattern holds..."
  - "This creates an opportunity to..."
  - "An adjustment here could..."
- Do NOT weaken clarity or soften operational consequences. Maintain full analytical precision.
- Shift blame from people to systems. Use "The current process allows..." not "The team fails to...".

EXAMPLE OF CORRECT FRAMING:
BAD: "Change orders are entering production without pricing closure, exposing margin to erosion."
GOOD: "The signals suggest change work may sometimes proceed before pricing and schedule impacts are confirmed. If so, this creates an opportunity to tighten sequencing so margin and timelines are protected before execution."

Your job:

Read the structured responses about:
- Estimate accuracy and review processes
- Change order approval flow and timing
- Margin visibility during and after execution
- Field behavior around logging and client conversations

Produce:

SCOPE INTEGRITY SUMMARY:
4–6 sentences.
Plain language.
Describe how scope is currently managed and where discipline breaks down.
Use provisional framing throughout — signals, patterns, indications.

MARGIN LEAKAGE MECHANISM:
One clear paragraph.
Describe the specific pathway through which margin is likely leaking — estimate gaps, CO delays, absorbed work, or unlogged changes.
Frame as a mechanism to address, not a failure.

CHANGE CONTROL RISK PATTERN:
One clear paragraph.
Describe the behavioral and process pattern that allows scope to drift — reactive conversations, approval gaps, field absorption.
Frame as a pattern to interrupt.

DISCIPLINE MOVES:
3–5 specific operational actions.
Each move must be concrete and implementable within 30 days.
Frame each move as an opportunity or adjustment, not a correction of a mistake.
Examples:
- Define a 3-condition pricing gate before field execution begins.
- Introduce a weekly CO aging review for any open changes over 72 hours.
- Set a written threshold: all scope additions over $X require a signed CO before labor begins.
- Assign one PM as CO accountability owner per project.
No vague advice like "improve communication" or "increase awareness".

CONTROL UPGRADE:
Choose the single highest-leverage control improvement.
One clear sentence.
Must be concrete and actionable.

CONFIDENCE:
LOW if answers are vague or incomplete.
MEDIUM if moderate clarity with some specifics.
HIGH if signals are consistent, specific, and mutually reinforcing.

Return a single JSON object with these exact field names. Do NOT wrap in markdown code fences.

{
  "scopeIntegritySummary": "string — 4-6 sentences, plain language, system-focused, provisional framing",
  "marginLeakageMechanism": "string — one clear paragraph on how margin is leaking",
  "changeControlRiskPattern": "string — one clear paragraph on the behavioral/process pattern allowing scope drift",
  "disciplineMoves": ["string", "string", "string"],
  "controlUpgrade": "string — single concrete sentence, highest-leverage control improvement",
  "confidence": "LOW | MEDIUM | HIGH"
}`;

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

    const userMessage = `Here are the consultant's structured responses to the Scope & Change Discipline questionnaire. Analyse them and return the JSON object as specified.\n\n${JSON.stringify(responses, null, 2)}`;

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
    const required = [
      "scopeIntegritySummary",
      "marginLeakageMechanism",
      "changeControlRiskPattern",
      "disciplineMoves",
      "controlUpgrade",
      "confidence",
    ];
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
    console.error("analyze-scope-discipline error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
