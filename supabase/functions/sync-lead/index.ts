import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  phone: z.string().trim().max(30, "Phone too long").optional().nullable(),
  intent: z.string().trim().max(500, "Intent too long").optional().nullable(),
  message: z.string().trim().max(2000, "Message too long").optional().nullable(),
  address: z.string().trim().max(500, "Address too long").optional().nullable(),
  form_type: z.enum(["valuation", "contact"]).optional().nullable(),
});

const LEADGENIUS_URL = Deno.env.get("LEADGENIUS_URL") ?? "";
const LEADGENIUS_KEY = Deno.env.get("LEADGENIUS_KEY") ?? "";

const RELOCATE_URL = Deno.env.get("RELOCATE_URL") ?? "";
const RELOCATE_KEY = Deno.env.get("RELOCATE_KEY") ?? "";

async function postToSupabase(url: string, key: string, table: string, data: Record<string, unknown>) {
  try {
    const res = await fetch(`${url}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Failed to insert into ${table} at ${url}: ${res.status} ${body}`);
      return { success: false, error: body };
    }
    return { success: true };
  } catch (err) {
    console.error(`Error posting to ${url}/${table}:`, err);
    return { success: false, error: String(err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const parsed = LeadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, phone, intent, message, address, form_type } = parsed.data;

    const results: Record<string, unknown> = {};

    // Sync to Lead Genius — leads table (user_id is required, so we use a placeholder approach)
    // The RLS may block this if user_id is required; the lead will still sync to Relocation Compass
    const leadGeniusData: Record<string, unknown> = {
      name,
      email: email || null,
      phone: phone || null,
      source: form_type === "valuation" ? "emily_russell_valuation" : "emily_russell_contact",
      score: "warm",
      city: "San Antonio",
      state: "TX",
      qualification_summary: intent
        ? `${intent}${message ? ` — ${message}` : ""}${address ? ` | Property: ${address}` : ""}`
        : message || null,
    };

    results.leadGenius = await postToSupabase(LEADGENIUS_URL, LEADGENIUS_KEY, "leads", leadGeniusData);

    // Sync to Relocation Compass — leads table (user_id is nullable, so this should work)
    const relocateLeadData: Record<string, unknown> = {
      name,
      email,
      phone: phone || null,
      source: form_type === "valuation" ? "Emily Russell - Home Valuation" : "Emily Russell - Contact Form",
      score: 65,
      status: "Warm",
      stage: "New",
      notes: [
        intent ? `Interest: ${intent}` : null,
        message ? `Message: ${message}` : null,
        address ? `Property: ${address}` : null,
      ].filter(Boolean),
      recommended_actions: ["Follow up within 24 hours", "Send neighborhood info"],
    };

    results.relocate = await postToSupabase(RELOCATE_URL, RELOCATE_KEY, "leads", relocateLeadData);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-lead error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
