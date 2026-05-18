import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SubjectSchema = z.object({
  address: z.string().min(1),
  beds: z.number().nullable().optional(),
  baths: z.number().nullable().optional(),
  sqft: z.number().nullable().optional(),
  yearBuilt: z.number().nullable().optional(),
  lotSize: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
});

const CompSchema = z.object({
  address: z.string().min(1),
  salePrice: z.number(),
  sqft: z.number().nullable().optional(),
  beds: z.number().nullable().optional(),
  baths: z.number().nullable().optional(),
  saleDate: z.string().nullable().optional(),
  distanceMiles: z.number().nullable().optional(),
  condition: z.string().nullable().optional(),
  adjustment: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const BodySchema = z.object({
  subject: SubjectSchema,
  comps: z.array(CompSchema).min(1).max(12),
  notes: z.string().nullable().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { subject, comps, notes } = parsed.data;

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a senior San Antonio, Texas residential real estate analyst writing a Comparative Market Analysis (CMA) for a licensed REALTOR. Texas is a non-disclosure state, so treat all comp prices as estimates. Write in a warm, professional tone consistent with Hill Country real estate. Be specific and avoid generic filler.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences) matching this schema exactly:
{
  "executiveSummary": string (1 paragraph, ~80 words),
  "narrative": string (3-5 paragraphs, ~400 words, covering market context, comp analysis, condition adjustments, and conclusion),
  "valueLow": number (USD, conservative),
  "valueRecommended": number (USD, midpoint),
  "valueHigh": number (USD, aggressive),
  "ppsfLow": number,
  "ppsfRecommended": number,
  "ppsfHigh": number,
  "compAnalysis": [ { "address": string, "adjustedValue": number, "rationale": string } ]
}`;

    const userPrompt = `Generate a CMA for the following property and comparables.

SUBJECT PROPERTY:
${JSON.stringify(subject, null, 2)}

COMPARABLE SALES:
${JSON.stringify(comps, null, 2)}

ADDITIONAL NOTES FROM AGENT:
${notes || "(none)"}

Return the JSON object now.`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic error:", anthropicRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${anthropicRes.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const anthropicJson = await anthropicRes.json();
    const text = anthropicJson?.content?.[0]?.text ?? "";

    // Strip code fences if any
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    let cma;
    try {
      cma = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse failed:", cleaned.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "AI returned invalid JSON", raw: cleaned.slice(0, 1000) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(cma), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-cma-narrative error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
