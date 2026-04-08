import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENRICHABLE_FIELDS = [
  "price", "beds", "baths", "sqft", "stories", "garages",
  "builder", "plan", "type", "status", "community", "area", "city",
  "rentEst", "sourceUrl",
] as const;

const INFERRABLE_FIELDS = ["city", "area", "builder", "type", "status", "stories", "garages"];

// ── Firecrawl search with logging ──
async function firecrawlSearch(query: string, apiKey: string): Promise<any[]> {
  console.log(`Firecrawl search: "${query}"`);
  const resp = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 5,
      scrapeOptions: { formats: ["markdown"] },
    }),
  });
  console.log(`Firecrawl response: ${resp.status} ${resp.statusText}`);
  if (!resp.ok) {
    const body = await resp.text();
    console.log(`Firecrawl error body (${body.length} chars): ${body.slice(0, 500)}`);
    return [];
  }
  const data = await resp.json();
  const results = data.data || [];
  console.log(`Firecrawl returned ${results.length} results`);
  return results;
}

// ── Build multiple search queries, progressively broader ──
function buildSearchQueries(prop: any): string[] {
  const queries: string[] = [];

  // Query 1: Quoted exact address
  if (prop.address) {
    queries.push(`"${prop.address}" ${prop.city || ""} TX property`.trim());
  }

  // Query 2: Unquoted address + city + state
  if (prop.address) {
    queries.push(`${prop.address} ${prop.city || ""} TX`.trim());
  }

  // Query 3: Community + builder broad search
  const broadParts = [prop.community, prop.area, prop.builder, "new construction TX"].filter(Boolean);
  const broad = broadParts.join(" ");
  if (broad.length > 20) {
    queries.push(broad);
  }

  return queries;
}

function getMissingFields(prop: any): string[] {
  return ENRICHABLE_FIELDS.filter(f => {
    const val = prop[f];
    return val === null || val === undefined || val === "" || val === 0;
  });
}

const ENRICHMENT_PROMPT = `You are a real estate data enrichment specialist. You receive a property's known data and web search results about that property. Your job is to extract ONLY the missing field values from the search results.

RULES:
- Only return values for the specific missing fields listed. Do not modify existing data.
- For price: return the numeric value (no $ or commas). If a range, use the lower value.
- For beds/baths: return numbers. Baths can be "2.5" for half baths.
- For sqft: return numeric value only.
- For sourceUrl: return the most authoritative listing URL (Zillow > Redfin > Realtor.com > builder site).
- For rentEst: format as "$X,XXX/mo".
- If you cannot determine a field's value from the search results, omit it entirely.
- Do NOT guess or fabricate data. Only extract what is explicitly stated in the search results.
- Return ONLY the JSON object, no markdown fences, no explanation.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth check ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await anonClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse input ──
    const { properties } = await req.json();
    if (!Array.isArray(properties) || properties.length === 0) {
      return new Response(JSON.stringify({ error: "No properties provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Process each property ──
    const enriched: any[] = [];
    const log: string[] = [];
    let searchesUsed = 0;
    let fieldsFound = 0;

    for (const prop of properties) {
      const missing = getMissingFields(prop);

      if (missing.length === 0 || !prop.address) {
        enriched.push({ id: prop.id, updates: {}, status: "complete" });
        continue;
      }

      let searchContext = "";

      // ── Multi-query web search ──
      if (FIRECRAWL_API_KEY) {
        const queries = buildSearchQueries(prop);
        console.log(`Property "${prop.address}": trying ${queries.length} queries (${missing.length} missing fields)`);

        for (const query of queries) {
          const results = await firecrawlSearch(query, FIRECRAWL_API_KEY);
          searchesUsed++;

          if (results.length > 0) {
            searchContext = results.map((r: any) => {
              const url = r.url || "";
              const title = r.title || "";
              const markdown = r.markdown || r.description || "";
              return `[Source: ${url}]\n${title}\n${markdown.slice(0, 8000)}`;
            }).join("\n\n---\n\n");
            console.log(`Found results with query: "${query}"`);
            break;
          }
          // Small delay between retries
          await new Promise(r => setTimeout(r, 300));
        }
      }

      if (!searchContext) {
        log.push(`${prop.address}: No search results found (tried ${buildSearchQueries(prop).length} queries)`);
        enriched.push({ id: prop.id, updates: {}, status: "no_results" });
        continue;
      }

      // ── AI extraction ──
      const userMessage = `Property data (current):
${JSON.stringify(prop, null, 2)}

Missing fields to find: ${missing.join(", ")}

Web search results:
${searchContext.slice(0, 30000)}

Return a JSON object with ONLY the missing fields you can confidently fill from the search results above. Example: {"price": 227999, "beds": 3, "baths": "2", "sqft": 1402, "sourceUrl": "https://..."}`;

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: ENRICHMENT_PROMPT },
              { role: "user", content: userMessage },
            ],
          }),
        });

        if (!aiResp.ok) {
          log.push(`${prop.address}: AI extraction failed (${aiResp.status})`);
          enriched.push({ id: prop.id, updates: {}, status: "ai_error" });
          continue;
        }

        const aiResult = await aiResp.json();
        const rawContent = aiResult.choices?.[0]?.message?.content || "";

        const cleanJson = rawContent.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
        let updates: Record<string, any> = {};

        try {
          updates = JSON.parse(cleanJson);
        } catch {
          const jsonMatch = cleanJson.match(/\{[^]*\}/);
          if (jsonMatch) {
            try { updates = JSON.parse(jsonMatch[0]); } catch { /* ignore */ }
          }
        }

        const validUpdates: Record<string, any> = {};
        for (const field of missing) {
          if (updates[field] !== null && updates[field] !== undefined && updates[field] !== "") {
            if (["price", "beds", "sqft", "stories", "garages"].includes(field)) {
              const num = Number(updates[field]);
              if (!isNaN(num) && num > 0) validUpdates[field] = num;
            } else {
              validUpdates[field] = String(updates[field]);
            }
          }
        }

        const foundCount = Object.keys(validUpdates).length;
        fieldsFound += foundCount;
        log.push(`${prop.address}: Found ${foundCount}/${missing.length} missing fields — ${Object.keys(validUpdates).join(", ") || "none"}`);
        enriched.push({ id: prop.id, updates: validUpdates, status: foundCount > 0 ? "enriched" : "no_new_data" });

      } catch (aiErr) {
        log.push(`${prop.address}: AI error — ${aiErr instanceof Error ? aiErr.message : "unknown"}`);
        enriched.push({ id: prop.id, updates: {}, status: "ai_error" });
      }

      // Small delay between properties
      if (properties.indexOf(prop) < properties.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // ── Sibling inference pass ──
    // For properties in the same community, fill missing fields from unanimous sibling values
    const byCommunity: Record<string, any[]> = {};
    for (const prop of properties) {
      if (prop.community) {
        (byCommunity[prop.community] ||= []).push(prop);
      }
    }

    let siblingFieldsInferred = 0;
    for (const item of enriched) {
      const prop = properties.find((p: any) => p.id === item.id);
      if (!prop?.community) continue;

      const siblings = byCommunity[prop.community].filter((s: any) => s.id !== prop.id);
      if (siblings.length === 0) continue;

      for (const field of INFERRABLE_FIELDS) {
        // Skip if prop already has the value or if we already enriched it
        const currentVal = prop[field];
        if (currentVal && currentVal !== "" && currentVal !== 0) continue;
        if (item.updates[field] !== undefined) continue;

        // Collect non-empty values from siblings (including their enriched updates)
        const vals = siblings.map((s: any) => {
          const sibItem = enriched.find((e: any) => e.id === s.id);
          return sibItem?.updates?.[field] || s[field];
        }).filter((v: any) => v && v !== "" && v !== 0);

        if (vals.length > 0 && vals.every((v: any) => String(v) === String(vals[0]))) {
          item.updates[field] = vals[0];
          siblingFieldsInferred++;
        }
      }

      if (Object.keys(item.updates).length > 0 && item.status === "no_results") {
        item.status = "inferred_from_siblings";
      }
    }

    if (siblingFieldsInferred > 0) {
      fieldsFound += siblingFieldsInferred;
      log.push(`Sibling inference: filled ${siblingFieldsInferred} fields from community neighbors`);
    }

    return new Response(JSON.stringify({
      enriched,
      summary: {
        total: properties.length,
        searched: searchesUsed,
        fieldsFound,
        log,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("enrich-properties error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
