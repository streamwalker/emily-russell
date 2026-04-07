import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch analytics from Lovable API
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const projectId = "399e6676-0704-4ee9-9f14-f6d8700a13e7";

    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const analyticsRes = await fetch(
      `https://api.lovable.dev/v2/projects/${projectId}/analytics?startdate=${startDate}&enddate=${endDate}&granularity=daily`,
      {
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    let analyticsData = null;
    if (analyticsRes.ok) {
      analyticsData = await analyticsRes.json();
    }

    // Fetch custom analytics events
    const { data: clickEvents } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("event_type", "link_click")
      .order("created_at", { ascending: false })
      .limit(500);

    const { data: pageViewEvents } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("event_type", "page_view_duration")
      .order("created_at", { ascending: false })
      .limit(500);

    const { data: allPageViews } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("event_type", "page_view")
      .order("created_at", { ascending: false })
      .limit(500);

    // Aggregate click events by label
    const clickCounts: Record<string, { count: number; target: string }> = {};
    (clickEvents || []).forEach((e: any) => {
      const key = e.label || e.target || "Unknown";
      if (!clickCounts[key]) clickCounts[key] = { count: 0, target: e.target };
      clickCounts[key].count++;
    });

    // Aggregate dwell time by page
    const dwellTimes: Record<string, { total: number; count: number }> = {};
    (pageViewEvents || []).forEach((e: any) => {
      const page = e.page || "/";
      if (!dwellTimes[page]) dwellTimes[page] = { total: 0, count: 0 };
      dwellTimes[page].total += e.duration_ms || 0;
      dwellTimes[page].count++;
    });

    // Client activity from property_interactions
    const { data: interactions } = await supabase
      .from("property_interactions")
      .select("user_id, is_favorite, grade, preferred_tour_date, comments");

    const clientActivity: Record<string, { favorites: number; grades: number; tours: number; comments: number }> = {};
    (interactions || []).forEach((i: any) => {
      if (!clientActivity[i.user_id]) clientActivity[i.user_id] = { favorites: 0, grades: 0, tours: 0, comments: 0 };
      if (i.is_favorite) clientActivity[i.user_id].favorites++;
      if (i.grade) clientActivity[i.user_id].grades++;
      if (i.preferred_tour_date) clientActivity[i.user_id].tours++;
      if (i.comments) clientActivity[i.user_id].comments++;
    });

    // Recent agreements
    const { data: agreements } = await supabase
      .from("signed_agreements")
      .select("client_name, agreement_type, signed_at, client_email")
      .order("signed_at", { ascending: false })
      .limit(10);

    // Profiles for name resolution
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, full_name");

    return new Response(
      JSON.stringify({
        builtInAnalytics: analyticsData,
        customEvents: {
          topClicks: Object.entries(clickCounts)
            .map(([label, v]) => ({ label, count: v.count, target: v.target }))
            .sort((a, b) => b.count - a.count),
          dwellTimes: Object.entries(dwellTimes)
            .map(([page, v]) => ({ page, avgMs: Math.round(v.total / v.count), sessions: v.count }))
            .sort((a, b) => b.avgMs - a.avgMs),
          totalCustomPageViews: (allPageViews || []).length,
        },
        clientActivity: Object.entries(clientActivity).map(([userId, stats]) => {
          const profile = (profiles || []).find((p: any) => p.user_id === userId);
          return { userId, email: profile?.email, name: profile?.full_name, ...stats };
        }),
        recentAgreements: agreements || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
