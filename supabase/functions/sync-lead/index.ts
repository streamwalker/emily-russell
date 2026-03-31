const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LEADGENIUS_URL = "https://cjsnpkvxajgyudlsange.supabase.co";
const LEADGENIUS_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqc25wa3Z4YWpneXVkbHNhbmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDExNDQsImV4cCI6MjA4ODU3NzE0NH0.V6NxUw3XTUf9Xssu_tC5T3Mg2TrssveMs6RkrsZEY34";

const RELOCATE_URL = "https://kicutcjdmsdannmkbzhq.supabase.co";
const RELOCATE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpY3V0Y2pkbXNkYW5ubWtiemhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTc4MzIsImV4cCI6MjA4ODczMzgzMn0.PARYFRc5dYer4baQaIfRlHoxyQKrfqe9TNxwCmhCRxg";

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
    const { name, email, phone, intent, message, address, form_type } = await req.json();

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
