import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Clario Flow Stabilization Agent.

You help an operational consultant translate structured flow answers into a concrete 30-day stabilization plan.

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
- Release criteria
- Capacity visibility
- Change order flow
- Meeting control

Produce:

FLOW RISK SUMMARY:
4–6 sentences.
Plain language.
Describe how work currently moves and where it destabilizes.
Use provisional framing throughout — signals, patterns, indications.

READINESS GAP:
One clear paragraph.
What must be defined before work is allowed into production.
Frame as a gap to close, not a failure.

STABILIZATION MOVES:
3–5 specific operational actions.
Each move must be concrete and implementable within 30 days.
Frame each move as an opportunity or adjustment, not a correction of a mistake.
Examples:
- Define and enforce a 3-condition release gate.
- Set a visible WIP limit per PM.
- Separate pricing approval from scheduling authorization.
- Move scheduling decisions into a single weekly control meeting.
No vague advice like "improve communication".

FIRST DESIGN MOVE:
Choose the single highest-leverage action.
One clear sentence.
Must be concrete.

CONFIDENCE:
LOW if answers are vague.
MEDIUM if moderate clarity.
HIGH if signals are consistent and specific.

Return a single JSON object with these exact field names. Do NOT wrap in markdown code fences.

{
  "flowRiskSummary": "string — 4-6 sentences, plain language, system-focused, provisional framing",
  "readinessGap": "string — one clear paragraph on what must be defined before work enters production",
  "stabilizationMoves": ["string", "string", "string"],
  "firstDesignMove": "string — single concrete sentence, highest-leverage action",
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

    const userMessage = `Here are the consultant's structured responses to the Flow Stabilization questionnaire. Analyse them and return the JSON object as specified.\n\n${JSON.stringify(responses, null, 2)}`;

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
