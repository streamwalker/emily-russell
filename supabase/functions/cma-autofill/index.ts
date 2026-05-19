import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─────────────────────────────────────────────────────────────
// Firecrawl helpers
// ─────────────────────────────────────────────────────────────
async function fcSearch(query: string, key: string, limit = 4): Promise<any[]> {
  console.log(`[firecrawl] search: ${query}`);
  const resp = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit, scrapeOptions: { formats: ["markdown"] } }),
  });
  if (!resp.ok) {
    console.log(`[firecrawl] ${resp.status} ${await resp.text().then(t => t.slice(0, 200))}`);
    return [];
  }
  const data = await resp.json();
  return data.data || [];
}

function contextFromResults(results: any[], maxChars = 12000): string {
  return results
    .map((r) => `[${r.url || ""}]\n${r.title || ""}\n${(r.markdown || r.description || "").slice(0, 6000)}`)
    .join("\n\n---\n\n")
    .slice(0, maxChars);
}

// ─────────────────────────────────────────────────────────────
// Claude extraction
// ─────────────────────────────────────────────────────────────
async function claudeExtract(systemPrompt: string, userPrompt: string, apiKey: string): Promise<any> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Anthropic ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  const raw = data.content?.[0]?.text || "";
  const cleaned = raw.replace(/```(?:json)?/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Claude returned non-JSON: " + cleaned.slice(0, 200));
  }
}

const SUBJECT_SYSTEM = `You are a real estate data extractor. Given web search results about a single property address, extract structured details. Return ONLY a JSON object with keys: beds (number), baths (number, allow .5), sqft (number), yearBuilt (number), lotSize (string, e.g. "0.18 acres" or "7,841 sqft"), builder (string), condition (string, 1-2 sentence summary of condition/features/updates from listing language). Omit any field you cannot confidently extract. Do not guess. Do not include any prose, only the JSON object.`;

const COMPS_SYSTEM = `You are a real estate data extractor. Given web search results about recently sold homes near a subject address, extract a JSON object: { "comps": [ { address, salePrice (number), sqft (number), beds (number), baths (number), saleDate (YYYY-MM-DD if known else any date string), distanceMiles (number if stated), condition (short string from listing) } ] }. Only include properties that were SOLD (not active listings). Only include sales you can extract from the provided text. Do not fabricate prices or dates. Omit fields you cannot determine, but always include address and salePrice. Return up to 8 comps. Return ONLY the JSON object.`;

// Distance filter — keep when distance unknown
function withinRadius(distance: number | null | undefined, max: number) {
  if (distance == null) return true;
  return distance <= max;
}

// Date filter — keep when date unknown
function withinWindow(saleDate: string | null | undefined, monthsBack: number) {
  if (!saleDate) return true;
  const d = new Date(saleDate);
  if (isNaN(d.getTime())) return true;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);
  return d >= cutoff;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anon.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await anon.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const address: string = (body.address || "").trim();
    const mode: "subject" | "comps" | "both" = body.mode || "both";
    const radiusMiles: number = Math.max(0.1, Math.min(5, Number(body.radiusMiles) || 0.5));
    const monthsBack: number = Math.max(1, Math.min(36, Number(body.monthsBack) || 6));

    if (address.length < 5) {
      return new Response(JSON.stringify({ error: "Address required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL = Deno.env.get("FIRECRAWL_API_KEY");
    const ANTHROPIC = Deno.env.get("ANTHROPIC_API_KEY");
    if (!FIRECRAWL || !ANTHROPIC) {
      return new Response(JSON.stringify({ error: "Server keys not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const log: string[] = [];
    let subject: any = null;
    let comps: any[] = [];

    // ── Subject ──
    if (mode === "subject" || mode === "both") {
      const queries = [
        `"${address}" zillow OR redfin OR realtor.com`,
        `"${address}" beds baths sqft`,
        `${address} bexar county appraisal`,
      ];
      let ctx = "";
      for (const q of queries) {
        const r = await fcSearch(q, FIRECRAWL, 4);
        if (r.length) {
          ctx = contextFromResults(r);
          log.push(`subject: hit on "${q}" (${r.length} results)`);
          break;
        }
        log.push(`subject: no results for "${q}"`);
      }
      if (ctx) {
        try {
          const userMsg = `Subject address: ${address}\n\nSearch results:\n${ctx}\n\nExtract the property details for THIS address only. Ignore neighbors.`;
          subject = await claudeExtract(SUBJECT_SYSTEM, userMsg, ANTHROPIC);
          log.push(`subject: extracted ${Object.keys(subject || {}).length} fields`);
        } catch (e) {
          log.push(`subject: extraction failed — ${e instanceof Error ? e.message : "unknown"}`);
        }
      } else {
        log.push("subject: no usable search context");
      }
    }

    // ── Comps ──
    if (mode === "comps" || mode === "both") {
      const queries = [
        `recently sold homes near "${address}" last ${monthsBack} months redfin`,
        `homes sold near ${address} zillow sold`,
        `comparable sales near ${address} ${monthsBack === 6 ? "last 6 months" : `last ${monthsBack} months`}`,
      ];
      let ctx = "";
      for (const q of queries) {
        const r = await fcSearch(q, FIRECRAWL, 5);
        if (r.length) {
          ctx = (ctx ? ctx + "\n\n---\n\n" : "") + contextFromResults(r, 8000);
          log.push(`comps: results from "${q}"`);
        }
        if (ctx.length > 20000) break;
      }
      if (ctx) {
        try {
          const userMsg = `Subject address: ${address}\nRadius: ${radiusMiles} miles\nWindow: last ${monthsBack} months\n\nSearch results:\n${ctx}\n\nExtract recent SOLD comparable sales near the subject.`;
          const parsed = await claudeExtract(COMPS_SYSTEM, userMsg, ANTHROPIC);
          const rawComps = Array.isArray(parsed?.comps) ? parsed.comps : [];
          const filtered = rawComps.filter((c: any) =>
            c.address && c.salePrice && withinRadius(c.distanceMiles, radiusMiles) && withinWindow(c.saleDate, monthsBack)
          );
          comps = filtered.slice(0, 8);
          log.push(`comps: extracted ${rawComps.length}, kept ${comps.length} after filters`);
        } catch (e) {
          log.push(`comps: extraction failed — ${e instanceof Error ? e.message : "unknown"}`);
        }
      } else {
        log.push("comps: no usable search context");
      }
    }

    return new Response(JSON.stringify({ subject, comps, log }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cma-autofill error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
