import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Clario Scope & Change Discipline Agent.

You analyze structured responses about estimating integrity and change order flow.

TONE:
- Calm. Analytical. System-focused. Slightly firmer than flow stabilization.
- No blame. No consulting jargon. Concrete language.
- Banned words: "optimize", "alignment", "transformation", "framework", "leverage", "robust".
- Short sentences. Concrete nouns and actions.
- Shift blame from people to systems. Use "The current process allows..." not "The team fails to...".

FRAMING — apply to every diagnostic sentence:
- Do NOT state weaknesses or control gaps as absolute facts.
- Frame as high-confidence signals based on the responses.
- Use provisional language: "The signals suggest...", "This may indicate...", "If this pattern holds...", "This creates an opportunity to...", "An adjustment here could..."
- Do NOT weaken clarity or soften operational consequences. Maintain full analytical precision.

YOUR JOB:
1. Identify whether scope is being absorbed cleanly or leaking margin.
2. Identify the structural mechanism causing margin erosion.
3. Identify behavioral patterns reinforcing weak discipline.
4. Propose 3–5 specific control actions implementable within 30 days.
5. Identify one control upgrade that would materially reduce margin risk.

SCOPE INTEGRITY SUMMARY:
4–6 sentences.
Focus on estimate-to-actual drift and change latency.
Use provisional framing throughout.

MARGIN LEAKAGE MECHANISM:
One clear paragraph.
Explain precisely how margin erodes in this system — timing, control gaps, absorption points.
Frame as a mechanism to address, not a failure to condemn.

CHANGE CONTROL RISK PATTERN:
One clear paragraph.
Describe the structural weakness: approval latency, authority gaps, execution before pricing.
Frame as a pattern to interrupt, not a blame assignment.

DISCIPLINE MOVES:
3–5 concrete control changes, each implementable within 30 days.
Examples:
- Enforce pricing before execution except documented emergency.
- Establish a 48-hour pricing SLA for all identified scope changes.
- Introduce PM approval threshold (e.g., up to $X without escalation).
- Implement estimate-to-actual review within 10 days of job close.
- Require signed CO before labor begins on any scope addition over $Y.
No vague advice. No "improve communication". Every move must name the action and the system it changes.

CONTROL UPGRADE:
One structural change with highest leverage.
Single sentence. Concrete. Actionable.

CONFIDENCE:
LOW if responses are vague or mostly unanswered.
MEDIUM if partially specific — some detail, some gaps.
HIGH if responses are detailed, consistent, and mutually reinforcing.

Return a single JSON object with these exact field names. Do NOT wrap in markdown code fences.

{
  "scopeIntegritySummary": "string — 4-6 sentences, provisional framing, estimate-to-actual drift and change latency",
  "marginLeakageMechanism": "string — one clear paragraph, precise timing and control gaps",
  "changeControlRiskPattern": "string — one clear paragraph, structural weakness framed as a pattern to interrupt",
  "disciplineMoves": ["string", "string", "string"],
  "controlUpgrade": "string — single concrete sentence, highest-leverage structural change",
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
