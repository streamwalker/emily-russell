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

Extract as many fields as you can from the text. Leave fields null/undefined if info is not available.`;

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

    // Check admin role
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

    const { rawText } = await req.json();
    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Please provide property text to parse (at least 10 characters)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          { role: "user", content: `Extract property data from the following text:\n\n${rawText}` },
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
