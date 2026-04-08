import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a real-estate data extraction assistant. You will receive raw text that contains property listings — addresses, MLS descriptions, URLs, or pasted blocks of listing info.

Your job is to extract structured property data and group them into tabs (typically by builder or community).

Each property has these fields (all optional except address):
- address (string, required)
- city (string)
- price (number, no commas or $)
- beds (number)
- baths (string, e.g. "2.5")
- sqft (number)
- stories (number)
- garages (number)
- builder (string)
- plan (string — the floor plan name)
- type (string, e.g. "Single Family", "Townhome")
- status (string, e.g. "Active", "Under Construction", "Sold")
- community (string — subdivision or neighborhood name)
- area (string — broader area like "North Austin")
- rentEst (string, e.g. "$2,200/mo")
- yieldEst (string, e.g. "5.2%")
- rentNote (string — any notes about rental potential)
- sourceUrl (string — listing URL if available)
- notes (string — any extra info)

Group properties into tabs. Each tab has:
- key: lowercase slug (e.g. "meritage_homes")
- label: display name (e.g. "Meritage Homes")
- color: a hex color (use distinct colors like #8B7355, #A0522D, #6B8E6B, #708090, #CD853F, #8FBC8F)

If you can't determine a builder, group under a tab with key "general", label "General", color "#8B7355".

Example property:
{
  "address": "1234 Oak Lane",
  "city": "Round Rock",
  "price": 385000,
  "beds": 4,
  "baths": "2.5",
  "sqft": 2400,
  "stories": 2,
  "garages": 2,
  "builder": "Meritage Homes",
  "plan": "The Aspen",
  "type": "Single Family",
  "status": "Active",
  "community": "Siena",
  "area": "Round Rock",
  "sourceUrl": "https://example.com/listing/1234"
}

Extract as many fields as you can from the text. Leave fields null/undefined if info is not available.

CRITICAL RULES:
- Even if you only have an address (and optionally a city/state/zip), you MUST still create a property entry with whatever fields are available.
- NEVER return an empty properties map if you can identify at least one address in the input.
- Every tab in the tabs array MUST have at least one corresponding entry in the properties map.
- When in doubt, create a property with just the address field filled in.

ADDRESS VALIDATION (very important):
- A valid street address MUST start with a house/street number (digits) followed by a street name (e.g. "13860 Chital Chase").
- Prices (e.g. "$227,999"), dollar amounts, plan/model names (e.g. "The Aspen"), bed/bath counts (e.g. "3/2"), sqft values, and percentages are NOT addresses — never put these in the address field.
- If a community or subdivision name appears alongside the address (e.g. "123 Oak Ln (Hidden Oasis)" or a column header like "Hidden Oasis"), extract the community name into the "community" field and keep only the street address in "address".
- If a price range appears (e.g. "$227,999–$238,399" or "$227,999-$238,399"), use the LOWER value for the "price" field.
- City and state should go in "city", NOT in "address". Strip state abbreviations and zip codes from the address field.

MERGING RULES (critical for PDFs and tabular data):
- Property data often spans MULTIPLE lines. A street address line may be followed by a separate line containing price, beds/baths, sqft, plan name, etc.
- If a line or data chunk has NO valid street address (no leading digits + street name), it is NOT a separate property. Merge its data (price, beds, baths, sqft, plan, status, etc.) into the most recent preceding property that HAS a valid address.
- NEVER create a property entry whose address field contains a price (e.g. "$227,999"), a bed/bath spec (e.g. "3/2"), a sqft value, or a plan/model name. These are attributes, not addresses.
- After extraction, review your output: if ANY property has an address that does not start with a house number followed by a street name, DELETE that entry and merge its data into the nearest valid property.
- Example of multi-line property data:
  Line 1: "13860 Chital Chase (Hidden Oasis)"
  Line 2: "$227,999–$238,399 | Beds/Baths: 3/2 | Sq Ft: 1,402 | Plan: Kitson"
  → This is ONE property: address="13860 Chital Chase", community="Hidden Oasis", price=227999, beds=3, baths="2", sqft=1402, plan="Kitson"`;

const URL_REGEX = /https?:\/\/[^\s<>"]+/gi;

// ── Firecrawl helpers ──────────────────────────────────────────────────

async function firecrawlSearch(query: string, apiKey: string): Promise<any[]> {
  console.log("Firecrawl search:", query);
  const resp = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 3,
      scrapeOptions: { formats: ["markdown"] },
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    console.error("Firecrawl search error:", resp.status, errText);
    return [];
  }
  const data = await resp.json();
  return data.data || [];
}

async function firecrawlScrape(url: string, apiKey: string): Promise<string> {
  console.log("Firecrawl scrape:", url);
  const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    console.error("Firecrawl scrape error:", resp.status, errText);
    return `[Failed to scrape ${url}]`;
  }
  const data = await resp.json();
  const markdown = data.data?.markdown || data.markdown || "";
  // Limit to 15k chars
  return markdown.slice(0, 15000);
}

// ── Legacy URL fetcher (fallback when Firecrawl unavailable) ───────────

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PropertyBot/1.0)",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
    });
    clearTimeout(timeout);
    if (!resp.ok) return `[Failed to fetch ${url}: HTTP ${resp.status}]`;
    const html = await resp.text();
    const trimmed = html.slice(0, 50000);
    const cleaned = trimmed
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return cleaned.slice(0, 15000);
  } catch (e) {
    return `[Failed to fetch ${url}: ${e instanceof Error ? e.message : "unknown error"}]`;
  }
}

// ── Main handler ───────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rawText, images } = await req.json();
    const hasImages = Array.isArray(images) && images.length > 0;
    if ((!rawText || typeof rawText !== "string" || rawText.trim().length < 10) && !hasImages) {
      return new Response(JSON.stringify({ error: "Please provide property text or images to parse" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const urls = (rawText || "").match(URL_REGEX) || [];
    let enrichedText = rawText || "";

    if (urls.length === 0 && FIRECRAWL_API_KEY) {
      // ── Research Agent: address-only input → search the web ──────────
      console.log("No URLs detected — triggering research agent");
      const searchQuery = `${rawText.trim()} property listing real estate`;
      const searchResults = await firecrawlSearch(searchQuery, FIRECRAWL_API_KEY);

      if (searchResults.length > 0) {
        const resultContents = searchResults.map((r: any) => {
          const url = r.url || "";
          const markdown = r.markdown || r.description || "";
          return `\n--- Content from ${url} ---\n${markdown.slice(0, 15000)}\n--- End ---`;
        }).join("\n");
        enrichedText = rawText + "\n\n[Research Agent found the following listings:]\n" + resultContents;
        console.log(`Research agent found ${searchResults.length} results`);
      } else {
        console.log("Research agent found no results, proceeding with raw text");
      }
    } else if (urls.length > 0) {
      // ── URLs present: scrape them (prefer Firecrawl, fallback to fetch) ──
      console.log(`Detected ${urls.length} URL(s), scraping...`);
      const fetches = await Promise.all(urls.slice(0, 5).map(async (url) => {
        const content = FIRECRAWL_API_KEY
          ? await firecrawlScrape(url, FIRECRAWL_API_KEY)
          : await fetchUrlContent(url);
        return { url, content };
      }));

      const urlContents = fetches
        .map(({ url, content }) => `\n--- Content from ${url} ---\n${content}\n--- End ---`)
        .join("\n");

      enrichedText = rawText + "\n\n" + urlContents;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build user message content parts (text + optional images)
    const userContent: any[] = [];
    if (enrichedText && enrichedText.trim().length > 0) {
      userContent.push({ type: "text", text: `Extract property data from the following text:\n\n${enrichedText}` });
    } else {
      userContent.push({ type: "text", text: "Extract property data from the following images:" });
    }
    if (hasImages) {
      for (const img of images.slice(0, 10)) {
        userContent.push({
          type: "image_url",
          image_url: { url: img },
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_dossier_data",
              description: "Create structured dossier data with tabs and properties extracted from the raw text.",
              parameters: {
                type: "object",
                properties: {
                  tabs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                        color: { type: "string" },
                      },
                      required: ["key", "label", "color"],
                      additionalProperties: false,
                    },
                  },
                  properties: {
                    type: "object",
                    description: "Map of tab key to array of property objects",
                    additionalProperties: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          address: { type: "string" },
                          city: { type: "string" },
                          price: { type: "number" },
                          beds: { type: "number" },
                          baths: { type: "string" },
                          sqft: { type: "number" },
                          stories: { type: "number" },
                          garages: { type: "number" },
                          builder: { type: "string" },
                          plan: { type: "string" },
                          type: { type: "string" },
                          status: { type: "string" },
                          community: { type: "string" },
                          area: { type: "string" },
                          rentEst: { type: "string" },
                          yieldEst: { type: "string" },
                          rentNote: { type: "string" },
                          sourceUrl: { type: "string" },
                          notes: { type: "string" },
                        },
                        required: ["address"],
                        additionalProperties: false,
                      },
                    },
                  },
                },
                required: ["tabs", "properties"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_dossier_data" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiResult));
      return new Response(JSON.stringify({ error: "AI did not return structured data. Try providing more detail." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let dossierData;
    try {
      dossierData = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
      return new Response(JSON.stringify({ error: "AI returned invalid data. Please try again." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: if AI returned tabs but empty properties, extract addresses from raw text
    const totalBeforeFallback = Object.values(dossierData.properties).reduce(
      (sum: number, arr: any) => sum + arr.length, 0
    );

    if (totalBeforeFallback === 0) {
      console.log("AI returned 0 properties, applying fallback extraction");
      const segments = rawText.split(/[;\n]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 3);
      const addressSegments = segments.length > 0 ? segments : [rawText.trim()];

      const properties: any[] = [];
      for (const seg of addressSegments) {
        if (!/\d/.test(seg)) continue;
        const parts = seg.split(/,\s*/);
        const address = parts[0]?.trim();
        if (!address) continue;

        const prop: any = { address };
        const remaining = parts.slice(1);
        if (remaining.length > 0) {
          const cityParts: string[] = [];
          for (const part of remaining) {
            if (/^\s*(?:TX|Texas)\s*$/i.test(part)) continue;
            if (/^\s*\d{5}(-\d{4})?\s*$/.test(part)) continue;
            if (/^\s*(?:TX|Texas)\s+\d{5}/i.test(part)) continue;
            cityParts.push(part.replace(/\s*(?:TX|Texas)\s*\d{0,5}.*/i, "").trim());
          }
          const city = cityParts.filter(Boolean).join(", ");
          if (city) prop.city = city;
        }
        properties.push(prop);
      }

      if (properties.length > 0) {
        dossierData.tabs = [{ key: "general", label: "General", color: "#8B7355" }];
        dossierData.properties["general"] = properties;
      }
    }

    // Add IDs to each property
    let propCounter = 0;
    for (const tabKey of Object.keys(dossierData.properties)) {
      dossierData.properties[tabKey] = dossierData.properties[tabKey].map((p: any) => ({
        ...p,
        id: `prop-${++propCounter}`,
      }));
    }

    const totalProps = Object.values(dossierData.properties).reduce(
      (sum: number, arr: any) => sum + arr.length, 0
    );

    return new Response(JSON.stringify({ dossierData, totalProperties: totalProps }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-properties error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
