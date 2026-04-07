import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import ExpenseEditor from "@/components/admin/ExpenseEditor";
import PropertyEditor from "@/components/admin/PropertyEditor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, GraduationCap, Calendar, MessageSquare, Users, BarChart3, MousePointerClick, Clock, FileText, TrendingUp, Eye, Globe, Monitor, Smartphone, Sparkles, Loader2, ArrowLeft, Trash2, Pencil, BookTemplate, Copy, Send } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

interface DossierRow {
  id: string;
  user_id: string;
  title: string;
  dossier_data: Record<string, unknown>;
  prepared_date: string;
  created_at: string;
  updated_at: string;
  client_email?: string;
}

interface ClientInteractionSummary {
  userId: string;
  email?: string;
  name?: string;
  favorites: number;
  grades: number;
  tours: number;
  comments: number;
}

interface AnalyticsData {
  builtInAnalytics: any;
  customEvents: {
    topClicks: { label: string; count: number; target: string }[];
    dwellTimes: { page: string; avgMs: number; sessions: number }[];
    totalCustomPageViews: number;
  };
  clientActivity: ClientInteractionSummary[];
  recentAgreements: { client_name: string; agreement_type: string; signed_at: string; client_email: string | null }[];
}

const CHART_COLORS = ["hsl(27, 35%, 59%)", "hsl(27, 50%, 72%)", "hsl(15, 38%, 62%)", "hsl(140, 30%, 55%)", "hsl(220, 30%, 55%)"];

function KpiCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="font-body text-[10px] tracking-[2px] uppercase text-muted-foreground">{label}</span>
      </div>
      <div className="font-display text-2xl font-semibold text-foreground">{value}</div>
      {sub && <div className="font-body text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [dossiers, setDossiers] = useState<DossierRow[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; email: string; full_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expenseEditId, setExpenseEditId] = useState<string | null>(null);
  const [propertyEditId, setPropertyEditId] = useState<string | null>(null);

  // New dossier form
  const [showNew, setShowNew] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newTitle, setNewTitle] = useState("Client Property Dossier");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newJson, setNewJson] = useState("{}");
  const [newRawText, setNewRawText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [useRawJson, setUseRawJson] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<{ id: string; name: string; description: string | null; dossier_data: Record<string, unknown>; created_at: string; updated_at: string }[]>([]);
  const [templateEditId, setTemplateEditId] = useState<string | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [newTemplateData, setNewTemplateData] = useState<any>(null);
  const [newTemplateRawText, setNewTemplateRawText] = useState("");
  const [newTemplateUseRawJson, setNewTemplateUseRawJson] = useState(false);
  const [newTemplateJson, setNewTemplateJson] = useState("{}");
  const [templateExtracting, setTemplateExtracting] = useState(false);

  // Client interaction summaries (for dossier tab)
  const [interactionSummaries, setInteractionSummaries] = useState<Record<string, { favorites: number; grades: number; tours: number; comments: number }>>({});

  // Comment detail dialog
  const [commentDialogUserId, setCommentDialogUserId] = useState<string | null>(null);
  const [commentDetails, setCommentDetails] = useState<{ interactionId: string; propertyId: string; address: string; builder: string; comment: string; updatedAt: string; dossierId: string | null; replies: { id: string; reply_text: string; created_at: string }[] }[]>([]);
  const [commentDetailsLoading, setCommentDetailsLoading] = useState(false);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replyingSaving, setReplyingSaving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [dossierRes, profileRes, interactionsRes, templatesRes] = await Promise.all([
      supabase.from("client_dossiers").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, email, full_name"),
      supabase.from("property_interactions").select("user_id, is_favorite, grade, preferred_tour_date, comments"),
      supabase.from("dossier_templates").select("*").order("updated_at", { ascending: false }),
    ]);
    if (dossierRes.data) setDossiers(dossierRes.data as DossierRow[]);
    if (profileRes.data) setProfiles(profileRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data as any);

    // Aggregate interactions per user
    const summaries: Record<string, { favorites: number; grades: number; tours: number; comments: number }> = {};
    (interactionsRes.data || []).forEach((i) => {
      if (!summaries[i.user_id]) summaries[i.user_id] = { favorites: 0, grades: 0, tours: 0, comments: 0 };
      if (i.is_favorite) summaries[i.user_id].favorites++;
      if (i.grade) summaries[i.user_id].grades++;
      if (i.preferred_tour_date) summaries[i.user_id].tours++;
      if (i.comments) summaries[i.user_id].comments++;
    });
    setInteractionSummaries(summaries);
    setLoading(false);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-site-analytics");
      if (!error && data) setAnalytics(data as AnalyticsData);
    } catch (e) {
      console.error("Failed to fetch analytics:", e);
    }
    setAnalyticsLoading(false);
  }, []);

  // Resolve property address/builder from dossier data
  const resolvePropertyFromDossiers = useCallback((propertyId: string, userId: string) => {
    const userDossiers = dossiers.filter(d => d.user_id === userId);
    for (const d of userDossiers) {
      const data = d.dossier_data as any;
      if (!data?.tabs || !data?.properties) continue;
      for (const tab of data.tabs) {
        const tabKey = tab.key || tab.id;
        const propsArray = data.properties[tabKey];
        if (!Array.isArray(propsArray)) continue;
        const found = propsArray.find((p: any) => p.id === propertyId);
        if (found) {
          return { address: found.address || propertyId, builder: tab.label || tab.builder || "Unknown", dossierId: d.id };
        }
      }
    }
    return { address: propertyId, builder: "Unknown", dossierId: null };
  }, [dossiers]);

  // Fetch comment details for a user
  const openCommentDialog = useCallback(async (userId: string) => {
    setCommentDialogUserId(userId);
    setCommentDetailsLoading(true);
    setReplyTexts({});
    const { data } = await supabase
      .from("property_interactions")
      .select("id, property_id, comments, updated_at")
      .eq("user_id", userId)
      .not("comments", "is", null);
    
    // Fetch replies for all interactions
    const interactionIds = (data || []).map(r => r.id);
    let repliesMap: Record<string, { id: string; reply_text: string; created_at: string }[]> = {};
    if (interactionIds.length > 0) {
      const { data: repliesData } = await supabase
        .from("comment_replies")
        .select("id, interaction_id, reply_text, created_at")
        .in("interaction_id", interactionIds)
        .order("created_at", { ascending: true });
      for (const r of repliesData || []) {
        if (!repliesMap[r.interaction_id]) repliesMap[r.interaction_id] = [];
        repliesMap[r.interaction_id].push({ id: r.id, reply_text: r.reply_text, created_at: r.created_at });
      }
    }

    const details = (data || []).map(row => {
      const resolved = resolvePropertyFromDossiers(row.property_id, userId);
      return {
        interactionId: row.id,
        propertyId: row.property_id,
        address: resolved.address,
        builder: resolved.builder,
        comment: row.comments!,
        updatedAt: row.updated_at || "",
        dossierId: resolved.dossierId,
        replies: repliesMap[row.id] || [],
      };
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    setCommentDetails(details);
    setCommentDetailsLoading(false);
  }, [resolvePropertyFromDossiers]);

  const submitReply = useCallback(async (interactionId: string) => {
    const text = replyTexts[interactionId]?.trim();
    if (!text) return;
    setReplyingSaving(interactionId);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("comment_replies").insert({
      interaction_id: interactionId,
      admin_user_id: userData.user?.id || "",
      reply_text: text,
    });
    if (error) {
      toast.error("Failed to send reply");
    } else {
      toast.success("Reply sent");
      setReplyTexts(prev => ({ ...prev, [interactionId]: "" }));
      // Refresh replies
      if (commentDialogUserId) openCommentDialog(commentDialogUserId);
    }
    setReplyingSaving(null);
  }, [replyTexts, commentDialogUserId, openCommentDialog]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/portal", { replace: true });
    if (!adminLoading && isAdmin) {
      fetchData();
      fetchAnalytics();
    }
  }, [adminLoading, isAdmin, navigate, fetchData, fetchAnalytics]);

  // Realtime subscription for new comments
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel("admin-comment-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "property_interactions" },
        (payload) => {
          const row = payload.new as any;
          if (row.comments) {
            const profile = profiles.find(p => p.user_id === row.user_id);
            const clientName = profile?.full_name || profile?.email || "A client";
            const resolved = resolvePropertyFromDossiers(row.property_id, row.user_id);
            toast.info(`${clientName} commented on ${resolved.address}`, {
              description: row.comments.length > 80 ? row.comments.slice(0, 80) + "…" : row.comments,
              duration: 8000,
            });
            // Update interaction summaries
            fetchData();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "property_interactions" },
        (payload) => {
          const row = payload.new as any;
          const old = payload.old as any;
          if (row.comments && row.comments !== old.comments) {
            const profile = profiles.find(p => p.user_id === row.user_id);
            const clientName = profile?.full_name || profile?.email || "A client";
            const resolved = resolvePropertyFromDossiers(row.property_id, row.user_id);
            toast.info(`${clientName} commented on ${resolved.address}`, {
              description: row.comments.length > 80 ? row.comments.slice(0, 80) + "…" : row.comments,
              duration: 8000,
            });
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, profiles, resolvePropertyFromDossiers, fetchData]);

  const getClientEmail = (userId: string) => profiles.find(p => p.user_id === userId)?.email || userId;
  const getClientName = (userId: string) => profiles.find(p => p.user_id === userId)?.full_name || "";

  const startEdit = (d: DossierRow) => {
    setEditingId(d.id);
    setEditTitle(d.title);
    setEditDate(d.prepared_date);
    setEditJson(JSON.stringify(d.dossier_data, null, 2));
    setError("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      const parsed = JSON.parse(editJson);
      const { error: err } = await supabase
        .from("client_dossiers")
        .update({ title: editTitle, prepared_date: editDate, dossier_data: parsed })
        .eq("id", editingId);
      if (err) throw err;
      setEditingId(null);
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid JSON or save failed");
    }
    setSaving(false);
  };

  const deleteDossier = async (id: string) => {
    if (!confirm("Delete this dossier? This cannot be undone.")) return;
    await supabase.from("client_dossiers").delete().eq("id", id);
    fetchData();
  };

  const saveAsTemplate = async (dossierData: Record<string, unknown>, defaultName: string) => {
    const name = prompt("Template name:", defaultName);
    if (!name) return;
    const desc = prompt("Description (optional):", "") || null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: err } = await supabase.from("dossier_templates").insert({
      name,
      description: desc,
      dossier_data: dossierData as any,
      created_by: user.id,
    });
    if (err) { setError(err.message); return; }
    fetchData();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    await supabase.from("dossier_templates").delete().eq("id", id);
    fetchData();
  };

  const saveTemplate = async (id: string, updatedData: any) => {
    setSaving(true);
    const { error: err } = await supabase.from("dossier_templates").update({ dossier_data: updatedData }).eq("id", id);
    if (err) { setError(err.message); }
    else { setTemplateEditId(null); fetchData(); }
    setSaving(false);
  };

  const createTemplate = async (dossierDataOverride?: any) => {
    setSaving(true);
    setError("");
    try {
      if (!newTemplateName.trim()) throw new Error("Template name is required.");
      const finalData = dossierDataOverride || (newTemplateUseRawJson ? JSON.parse(newTemplateJson) : newTemplateData);
      if (!finalData) throw new Error("No template data. Extract properties or enter JSON first.");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error: err } = await supabase.from("dossier_templates").insert({
        name: newTemplateName,
        description: newTemplateDesc || null,
        dossier_data: finalData,
        created_by: user.id,
      });
      if (err) throw err;
      setShowNewTemplate(false);
      setNewTemplateName("");
      setNewTemplateDesc("");
      setNewTemplateData(null);
      setNewTemplateRawText("");
      setNewTemplateJson("{}");
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create template");
    }
    setSaving(false);
  };

  const extractTemplateProperties = async () => {
    setTemplateExtracting(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("parse-properties", {
        body: { rawText: newTemplateRawText },
      });
      if (fnErr) throw new Error(fnErr.message || "Extraction failed");
      if (data?.error) throw new Error(data.error);
      setNewTemplateData(data.dossierData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to extract properties");
    }
    setTemplateExtracting(false);
  };

  const extractProperties = async () => {
    setExtracting(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("parse-properties", {
        body: { rawText: newRawText },
      });
      if (fnErr) throw new Error(fnErr.message || "Extraction failed");
      if (data?.error) throw new Error(data.error);
      setExtractedData(data.dossierData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to extract properties");
    }
    setExtracting(false);
  };

  const createDossier = async (dossierDataOverride?: any) => {
    setSaving(true);
    setError("");
    try {
      const finalData = dossierDataOverride || (useRawJson ? JSON.parse(newJson) : extractedData);
      if (!finalData) throw new Error("No dossier data. Extract properties or enter JSON first.");
      const { error: err } = await supabase.from("client_dossiers").insert({
        user_id: newUserId,
        title: newTitle,
        prepared_date: newDate,
        dossier_data: finalData,
      });
      if (err) throw err;
      setShowNew(false);
      setNewJson("{}");
      setNewRawText("");
      setExtractedData(null);
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create dossier");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/portal/login", { replace: true });
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-primary font-body text-lg">Loading…</div>
      </div>
    );
  }

  // Parse built-in analytics
  const visitorTimeSeries = analytics?.builtInAnalytics?.timeSeries?.find((ts: any) => ts.name === "visitors")?.data || [];
  const pageviewTimeSeries = analytics?.builtInAnalytics?.timeSeries?.find((ts: any) => ts.name === "pageviews")?.data || [];
  const totals = analytics?.builtInAnalytics?.timeSeries || [];
  const totalVisitors = totals.find((t: any) => t.name === "visitors")?.total || 0;
  const totalPageviews = totals.find((t: any) => t.name === "pageviews")?.total || 0;
  const avgSessionDuration = totals.find((t: any) => t.name === "sessionDuration")?.total || 0;
  const bounceRate = totals.find((t: any) => t.name === "bounceRate")?.total || 0;

  const breakdowns = analytics?.builtInAnalytics?.breakdowns || {};
  const topPages = breakdowns.page || [];
  const trafficSources = breakdowns.source || [];
  const deviceBreakdown = breakdowns.device || [];
  const countryBreakdown = breakdowns.country || [];

  const chartData = (visitorTimeSeries as any[])
    .filter((d: any) => d.value > 0)
    .map((d: any, i: number) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      visitors: d.value,
      pageviews: (pageviewTimeSeries as any[])[i]?.value || 0,
    }));

  return (
    <div className="font-body min-h-screen bg-cream text-charcoal">
      {/* Header */}
      <div className="bg-charcoal text-white px-6 py-5">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-display text-2xl font-bold m-0">Admin Dashboard</h1>
            <p className="text-[10px] tracking-[3px] uppercase opacity-45 mt-1">Dossiers · Templates · Analytics · Engagement</p>
          </div>
          <div className="flex gap-3 items-center">
            <Link to="/portal" className="font-body text-[11px] uppercase tracking-[2px] text-white/70 no-underline hover:text-white transition-colors">
              My Portal
            </Link>
            <Link to="/" className="font-body text-[11px] uppercase tracking-[2px] text-white/70 no-underline hover:text-white transition-colors">
              Main Site
            </Link>
            <button onClick={handleLogout} className="font-body text-[11px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-white/30 text-white/70 px-4 py-2 hover:text-white hover:border-white/60 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Tabs defaultValue="dossiers">
          <TabsList className="mb-6 bg-white border border-border">
            <TabsTrigger value="dossiers" className="flex items-center gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Client Dossiers
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" /> Templates
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" /> Site Analytics
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center gap-1.5 text-xs">
              <MousePointerClick className="w-3.5 h-3.5" /> Engagement
            </TabsTrigger>
          </TabsList>

          {/* ═══════════ TAB 1: CLIENT DOSSIERS ═══════════ */}
          <TabsContent value="dossiers">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl">All Dossiers ({dossiers.length})</h2>
              <button onClick={() => { setShowNew(true); setError(""); }} className="btn-er-primary !py-2.5 !px-5 !text-[10px]">
                + New Dossier
              </button>
            </div>

            {error && <div className="text-destructive text-sm mb-4 font-body p-3 bg-white border border-destructive/20 rounded">{error}</div>}

            {/* New Dossier Form */}
            {showNew && (
              <div className="bg-white p-6 border border-border mb-6 shadow-sm">
                <h3 className="font-display text-lg mb-4">Create New Dossier</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="er-label block mb-1">Client</label>
                    <select value={newUserId} onChange={e => setNewUserId(e.target.value)} className="er-input">
                      <option value="">Select client…</option>
                      {profiles.map(p => (
                        <option key={p.user_id} value={p.user_id}>
                          {p.email} {p.full_name ? `(${p.full_name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="er-label block mb-1">Title</label>
                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="er-input" />
                  </div>
                  <div>
                    <label className="er-label block mb-1">Prepared Date</label>
                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="er-input" />
                  </div>
                </div>
                {/* Template selector */}
                <div className="mb-4">
                  <label className="er-label block mb-1">Load Template</label>
                  <select
                    value=""
                    onChange={e => {
                      const val = e.target.value;
                      if (val.startsWith("tpl:")) {
                        const tpl = templates.find(t => t.id === val.slice(4));
                        if (tpl) { setExtractedData(JSON.parse(JSON.stringify(tpl.dossier_data))); setUseRawJson(false); }
                      } else {
                        const templateDossier = dossiers.find(d => d.id === val);
                        if (templateDossier) { setExtractedData(JSON.parse(JSON.stringify(templateDossier.dossier_data))); setUseRawJson(false); }
                      }
                    }}
                    className="er-input"
                  >
                    <option value="">— None (start fresh) —</option>
                    {templates.length > 0 && (
                      <optgroup label="Saved Templates">
                        {templates.map(t => (
                          <option key={`tpl:${t.id}`} value={`tpl:${t.id}`}>{t.name}{t.description ? ` — ${t.description}` : ""}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="From Existing Dossier">
                      {dossiers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.title} — {getClientEmail(d.user_id)}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                {/* Smart Input / Raw JSON toggle */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <label className="er-label flex items-center gap-2 cursor-pointer">
                      <Switch checked={useRawJson} onCheckedChange={setUseRawJson} />
                      <span className="text-xs">{useRawJson ? "Raw JSON mode" : "Smart AI extraction"}</span>
                    </label>
                  </div>

                  {useRawJson ? (
                    <div>
                      <label className="er-label block mb-1">Dossier Data (JSON)</label>
                      <textarea value={newJson} onChange={e => setNewJson(e.target.value)} rows={12} className="er-input font-mono text-xs" style={{ resize: "vertical" }} />
                    </div>
                  ) : extractedData ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="font-body text-sm font-semibold text-foreground">
                            Extracted Properties — Review & Edit
                          </span>
                        </div>
                        <button
                          onClick={() => setExtractedData(null)}
                          className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-border text-muted-foreground px-3 py-1.5 hover:border-primary transition-colors"
                        >
                          ← Back to Input
                        </button>
                      </div>
                      <PropertyEditor
                        dossierData={extractedData}
                        saving={saving}
                        onCancel={() => setExtractedData(null)}
                        onSave={(updatedData) => createDossier(updatedData)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="er-label block mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Paste property info (addresses, MLS data, listing descriptions, URLs)
                      </label>
                      <textarea
                        value={newRawText}
                        onChange={e => setNewRawText(e.target.value)}
                        rows={12}
                        placeholder={"Paste listing info here. For example:\n\n1234 Oak Lane, Round Rock TX 78665\n$385,000 | 4 bed 2.5 bath | 2,400 sqft\nBuilder: Meritage Homes | Plan: The Aspen\nCommunity: Siena\nhttps://zillow.com/listing/1234\n\n5678 Elm Dr, Georgetown TX 78626\n$420,000 | 3 bed 2 bath | 1,800 sqft\nBuilder: Taylor Morrison"}
                        className="er-input text-sm"
                        style={{ resize: "vertical" }}
                      />
                      <button
                        onClick={extractProperties}
                        disabled={extracting || newRawText.trim().length < 10}
                        className="btn-er-primary !py-2.5 !px-6 !text-[10px] mt-3 flex items-center gap-2"
                      >
                        {extracting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Extracting…
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Extract Properties
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Show Create/Cancel only when NOT in extracted review mode (PropertyEditor has its own save) */}
                {!extractedData && (
                  <div className="flex gap-3">
                    {useRawJson && (
                      <button onClick={() => createDossier()} disabled={saving || !newUserId} className="btn-er-primary !py-2.5 !px-6 !text-[10px]">
                        {saving ? "Creating…" : "Create Dossier"}
                      </button>
                    )}
                    <button onClick={() => { setShowNew(false); setExtractedData(null); }} className="btn-outline-light !text-charcoal !border-border !py-2.5 !px-6 !text-[10px]">Cancel</button>
                  </div>
                )}
              </div>
            )}

            {/* Dossier List */}
            {dossiers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No dossiers yet. Create one above.</div>
            ) : (
              <div className="space-y-3">
                {dossiers.map(d => {
                  const summary = interactionSummaries[d.user_id];
                  return (
                    <div key={d.id} className="bg-white border border-border p-5 shadow-sm">
                      {propertyEditId === d.id ? (
                        <div>
                          <button
                            onClick={() => setPropertyEditId(null)}
                            className="flex items-center gap-1.5 font-body text-[11px] uppercase tracking-[2px] text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none mb-4 transition-colors"
                          >
                            <ArrowLeft className="w-4 h-4" /> Back to Dossiers
                          </button>
                          <PropertyEditor
                            dossierData={d.dossier_data as any}
                            saving={saving}
                            onCancel={() => setPropertyEditId(null)}
                            onSave={async (updatedData) => {
                              setSaving(true); setError("");
                              try {
                                const { error: err } = await supabase.from("client_dossiers").update({ dossier_data: updatedData as any }).eq("id", d.id);
                                if (err) throw err;
                                setPropertyEditId(null); fetchData();
                              } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to save properties"); }
                              setSaving(false);
                            }}
                          />
                        </div>
                      ) : expenseEditId === d.id ? (
                        <div>
                          <button
                            onClick={() => setExpenseEditId(null)}
                            className="flex items-center gap-1.5 font-body text-[11px] uppercase tracking-[2px] text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none mb-4 transition-colors"
                          >
                            <ArrowLeft className="w-4 h-4" /> Back to Dossiers
                          </button>
                          <ExpenseEditor
                            dossierData={d.dossier_data as any}
                            saving={saving}
                            onCancel={() => setExpenseEditId(null)}
                            onSave={async (updatedData) => {
                              setSaving(true); setError("");
                              try {
                                const { error: err } = await supabase.from("client_dossiers").update({ dossier_data: updatedData as any }).eq("id", d.id);
                                if (err) throw err;
                                setExpenseEditId(null); fetchData();
                              } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to save expenses"); }
                              setSaving(false);
                            }}
                          />
                        </div>
                      ) : editingId === d.id ? (
                        <div>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1.5 font-body text-[11px] uppercase tracking-[2px] text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none mb-4 transition-colors"
                          >
                            <ArrowLeft className="w-4 h-4" /> Back to Dossiers
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="er-label block mb-1">Client</label>
                              <div className="er-input bg-warm cursor-not-allowed">{getClientEmail(d.user_id)}</div>
                            </div>
                            <div>
                              <label className="er-label block mb-1">Title</label>
                              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="er-input" />
                            </div>
                            <div>
                              <label className="er-label block mb-1">Prepared Date</label>
                              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="er-input" />
                            </div>
                          </div>
                          <div className="mb-4">
                            <label className="er-label block mb-1">Dossier Data (JSON)</label>
                            <textarea value={editJson} onChange={e => setEditJson(e.target.value)} rows={16} className="er-input font-mono text-xs" style={{ resize: "vertical" }} />
                          </div>
                          <div className="flex gap-3">
                            <button onClick={saveEdit} disabled={saving} className="btn-er-primary !py-2 !px-5 !text-[10px]">{saving ? "Saving…" : "Save Changes"}</button>
                            <button onClick={() => setEditingId(null)} className="btn-outline-light !text-charcoal !border-border !py-2 !px-5 !text-[10px]">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-display text-base font-semibold">{d.title}</div>
                              <div className="font-body text-sm text-muted-foreground mt-1">
                                Client: <strong>{getClientEmail(d.user_id)}</strong>
                                {getClientName(d.user_id) && <span> ({getClientName(d.user_id)})</span>}
                              </div>
                              <div className="font-body text-xs text-muted-foreground mt-1 opacity-60">
                                Prepared: {d.prepared_date} · Updated: {new Date(d.updated_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => { setPropertyEditId(d.id); setExpenseEditId(null); setEditingId(null); setError(""); }} className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-primary/50 text-primary px-3 py-1.5 hover:border-primary hover:bg-primary/5 transition-colors">
                                🏠 Properties
                              </button>
                              <button onClick={() => { setExpenseEditId(d.id); setPropertyEditId(null); setEditingId(null); setError(""); }} className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-primary/50 text-primary px-3 py-1.5 hover:border-primary hover:bg-primary/5 transition-colors">
                                💰 Expenses
                              </button>
                              <button onClick={() => startEdit(d)} className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-border text-charcoal px-3 py-1.5 hover:border-primary transition-colors">
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  const clonedData = JSON.parse(JSON.stringify(d.dossier_data));
                                  setShowNew(true);
                                  setNewTitle(d.title);
                                  setNewDate(new Date().toISOString().split("T")[0]);
                                  setNewUserId("");
                                  setUseRawJson(false);
                                  setExtractedData(clonedData);
                                  setError("");
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-primary/50 text-primary px-3 py-1.5 hover:border-primary hover:bg-primary/5 transition-colors"
                              >
                                📋 Use as Template
                              </button>
                              <button
                                onClick={() => saveAsTemplate(d.dossier_data as Record<string, unknown>, d.title)}
                                className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-primary/50 text-primary px-3 py-1.5 hover:border-primary hover:bg-primary/5 transition-colors"
                              >
                                💾 Save as Template
                              </button>
                              <button onClick={() => deleteDossier(d.id)} className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-destructive/30 text-destructive px-3 py-1.5 hover:bg-destructive/5 transition-colors">
                                Delete
                              </button>
                            </div>
                          </div>
                          {/* Interaction Summary */}
                          {summary && (
                            <div className="flex gap-4 mt-3 pt-3 border-t border-border">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Heart className="w-3 h-3 text-destructive" /> {summary.favorites} favorites
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <GraduationCap className="w-3 h-3 text-primary" /> {summary.grades} graded
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3 text-primary" /> {summary.tours} tours
                              </div>
                              <button
                                onClick={() => openCommentDialog(d.user_id)}
                                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 cursor-pointer bg-transparent border-none underline underline-offset-2 transition-colors"
                              >
                                <MessageSquare className="w-3 h-3" /> {summary.comments} comments
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ═══════════ TAB 2: TEMPLATES ═══════════ */}
          <TabsContent value="templates">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl">Template Library ({templates.length})</h2>
              <button onClick={() => { setShowNewTemplate(true); setError(""); }} className="btn-er-primary !py-2.5 !px-5 !text-[10px]">
                + New Template
              </button>
            </div>

            {error && <div className="text-destructive text-sm mb-4 font-body p-3 bg-white border border-destructive/20 rounded">{error}</div>}

            {/* New Template Form */}
            {showNewTemplate && (
              <div className="bg-white p-6 border border-border mb-6 shadow-sm">
                <h3 className="font-display text-lg mb-4">Create New Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="er-label block mb-1">Template Name *</label>
                    <input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} className="er-input" placeholder="e.g. Georgetown New Construction" />
                  </div>
                  <div>
                    <label className="er-label block mb-1">Description</label>
                    <input value={newTemplateDesc} onChange={e => setNewTemplateDesc(e.target.value)} className="er-input" placeholder="Optional description" />
                  </div>
                </div>

                {/* Smart Input / Raw JSON toggle */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <label className="er-label flex items-center gap-2 cursor-pointer">
                      <Switch checked={newTemplateUseRawJson} onCheckedChange={setNewTemplateUseRawJson} />
                      <span className="text-xs">{newTemplateUseRawJson ? "Raw JSON mode" : "Smart AI extraction"}</span>
                    </label>
                  </div>

                  {newTemplateUseRawJson ? (
                    <div>
                      <label className="er-label block mb-1">Template Data (JSON)</label>
                      <textarea value={newTemplateJson} onChange={e => setNewTemplateJson(e.target.value)} rows={12} className="er-input font-mono text-xs" style={{ resize: "vertical" }} />
                    </div>
                  ) : newTemplateData ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="font-body text-sm font-semibold text-foreground">Extracted Properties — Review & Edit</span>
                        </div>
                        <button onClick={() => setNewTemplateData(null)} className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-border text-muted-foreground px-3 py-1.5 hover:border-primary transition-colors">
                          ← Back to Input
                        </button>
                      </div>
                      <PropertyEditor
                        dossierData={newTemplateData}
                        saving={saving}
                        onCancel={() => setNewTemplateData(null)}
                        onSave={(updatedData) => createTemplate(updatedData)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="er-label block mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Paste property info (addresses, MLS data, listing descriptions, URLs)
                      </label>
                      <textarea
                        value={newTemplateRawText}
                        onChange={e => setNewTemplateRawText(e.target.value)}
                        rows={12}
                        placeholder="Paste listing info here…"
                        className="er-input text-sm"
                        style={{ resize: "vertical" }}
                      />
                      <button
                        onClick={extractTemplateProperties}
                        disabled={templateExtracting || newTemplateRawText.trim().length < 10}
                        className="btn-er-primary !py-2.5 !px-6 !text-[10px] mt-3 flex items-center gap-2"
                      >
                        {templateExtracting ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting…</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" /> Extract Properties</>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {!newTemplateData && (
                  <div className="flex gap-3">
                    {newTemplateUseRawJson && (
                      <button onClick={() => createTemplate()} disabled={saving || !newTemplateName.trim()} className="btn-er-primary !py-2.5 !px-6 !text-[10px]">
                        {saving ? "Creating…" : "Create Template"}
                      </button>
                    )}
                    <button onClick={() => { setShowNewTemplate(false); setNewTemplateData(null); }} className="btn-outline-light !text-charcoal !border-border !py-2.5 !px-6 !text-[10px]">Cancel</button>
                  </div>
                )}
              </div>
            )}

            {/* Template List */}
            {templates.length === 0 && !showNewTemplate ? (
              <div className="text-center py-12 text-muted-foreground">No templates yet. Create one above or save an existing dossier as a template.</div>
            ) : (
              <div className="space-y-3">
                {templates.map(t => {
                  const data = t.dossier_data as any;
                  const tabCount = data?.tabs ? Object.keys(data.tabs).length : 0;
                  const propCount: number = data?.tabs ? (Object.values(data.tabs) as any[]).reduce((sum: number, tab: any) => sum + (Array.isArray(tab) ? tab.length : 0), 0) : 0;

                  if (templateEditId === t.id) {
                    return (
                      <div key={t.id} className="bg-white border border-border p-5 shadow-sm">
                        <button
                          onClick={() => setTemplateEditId(null)}
                          className="flex items-center gap-1.5 font-body text-[11px] uppercase tracking-[2px] text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none mb-4 transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back to Templates
                        </button>
                        <PropertyEditor
                          dossierData={data}
                          saving={saving}
                          onCancel={() => setTemplateEditId(null)}
                          onSave={(updatedData) => saveTemplate(t.id, updatedData)}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={t.id} className="bg-white border border-border p-5 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-display text-base font-semibold">{t.name}</div>
                          {t.description && <div className="font-body text-sm text-muted-foreground mt-1">{t.description}</div>}
                          <div className="font-body text-xs text-muted-foreground mt-1 opacity-60">
                            {tabCount} tab{tabCount !== 1 ? "s" : ""} · {propCount} propert{propCount !== 1 ? "ies" : "y"} · Updated: {new Date(t.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setTemplateEditId(t.id); setError(""); }} className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-primary/50 text-primary px-3 py-1.5 hover:border-primary hover:bg-primary/5 transition-colors">
                            <Pencil className="w-3 h-3 inline mr-1" /> Edit
                          </button>
                          <button onClick={() => deleteTemplate(t.id)} className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-destructive/30 text-destructive px-3 py-1.5 hover:bg-destructive/5 transition-colors">
                            <Trash2 className="w-3 h-3 inline mr-1" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ═══════════ TAB 3: SITE ANALYTICS ═══════════ */}
          <TabsContent value="analytics">
            {analyticsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading analytics…</div>
            ) : (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon={Eye} label="Visitors (30d)" value={totalVisitors} />
                  <KpiCard icon={TrendingUp} label="Pageviews" value={totalPageviews} />
                  <KpiCard icon={Clock} label="Avg Session" value={`${Math.round(avgSessionDuration)}s`} />
                  <KpiCard icon={TrendingUp} label="Bounce Rate" value={`${Math.round(bounceRate)}%`} />
                </div>

                {/* Visitors Over Time */}
                {chartData.length > 0 && (
                  <div className="bg-white border border-border p-5 shadow-sm">
                    <h3 className="font-display text-base font-semibold mb-4">Visitors & Pageviews (Last 30 Days)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="visitors" stroke="hsl(27, 35%, 59%)" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="pageviews" stroke="hsl(15, 38%, 62%)" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Pages */}
                  <div className="bg-white border border-border p-5 shadow-sm">
                    <h3 className="font-display text-base font-semibold mb-4">Top Pages</h3>
                    <div className="space-y-2">
                      {(topPages as any[]).map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground truncate max-w-[200px]">{p.name || p[0]}</span>
                          <span className="font-semibold">{p.value || p[1]} views</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Traffic Sources */}
                  <div className="bg-white border border-border p-5 shadow-sm">
                    <h3 className="font-display text-base font-semibold mb-4">Traffic Sources</h3>
                    {(trafficSources as any[]).length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={(trafficSources as any[]).map((s: any) => ({ name: s.name || s[0], value: s.value || s[1] }))}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(27, 35%, 59%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-sm text-muted-foreground">No source data available</div>
                    )}
                  </div>

                  {/* Device Breakdown */}
                  <div className="bg-white border border-border p-5 shadow-sm">
                    <h3 className="font-display text-base font-semibold mb-4">Devices</h3>
                    {(deviceBreakdown as any[]).length > 0 ? (
                      <div className="flex items-center gap-6">
                        <ResponsiveContainer width={150} height={150}>
                          <PieChart>
                            <Pie
                              data={(deviceBreakdown as any[]).map((d: any) => ({ name: d.name || d[0], value: d.value || d[1] }))}
                              cx="50%" cy="50%" outerRadius={60} dataKey="value"
                            >
                              {(deviceBreakdown as any[]).map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">
                          {(deviceBreakdown as any[]).map((d: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              {(d.name || d[0]) === "desktop" ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                              <span className="capitalize">{d.name || d[0]}</span>
                              <span className="font-semibold ml-auto">{d.value || d[1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No device data available</div>
                    )}
                  </div>

                  {/* Country Breakdown */}
                  <div className="bg-white border border-border p-5 shadow-sm">
                    <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Countries
                    </h3>
                    <div className="space-y-2">
                      {(countryBreakdown as any[]).slice(0, 8).map((c: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{c.name || c[0]}</span>
                          <span className="font-semibold">{c.value || c[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ═══════════ TAB 3: ENGAGEMENT ═══════════ */}
          <TabsContent value="engagement">
            {analyticsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading engagement data…</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Most Clicked Links */}
                  <div className="bg-white border border-border p-5 shadow-sm">
                    <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
                      <MousePointerClick className="w-4 h-4 text-primary" /> Most Clicked Links
                    </h3>
                    {(analytics?.customEvents?.topClicks || []).length > 0 ? (
                      <div className="space-y-2">
                        {analytics!.customEvents.topClicks.slice(0, 15).map((c, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground truncate max-w-[250px]">{c.label}</span>
                            <span className="font-semibold">{c.count} clicks</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No click data yet. Events will appear as visitors interact with links on the main site.</div>
                    )}
                  </div>

                  {/* Page Dwell Time */}
                  <div className="bg-white border border-border p-5 shadow-sm">
                    <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> Page Dwell Time
                    </h3>
                    {(analytics?.customEvents?.dwellTimes || []).length > 0 ? (
                      <div className="space-y-2">
                        {analytics!.customEvents.dwellTimes.map((d, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{d.page}</span>
                            <span className="font-semibold">{Math.round(d.avgMs / 1000)}s avg ({d.sessions} sessions)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No dwell time data yet.</div>
                    )}
                  </div>
                </div>

                {/* Client Activity Summary */}
                <div className="bg-white border border-border p-5 shadow-sm">
                  <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Client Activity
                  </h3>
                  {(analytics?.clientActivity || []).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-body text-[10px] tracking-[2px] uppercase text-muted-foreground">Client</th>
                            <th className="text-center py-2 font-body text-[10px] tracking-[2px] uppercase text-muted-foreground">Favorites</th>
                            <th className="text-center py-2 font-body text-[10px] tracking-[2px] uppercase text-muted-foreground">Graded</th>
                            <th className="text-center py-2 font-body text-[10px] tracking-[2px] uppercase text-muted-foreground">Tours</th>
                            <th className="text-center py-2 font-body text-[10px] tracking-[2px] uppercase text-muted-foreground">Comments</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics!.clientActivity.map((c, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-2">
                                <div className="font-semibold">{c.name || "—"}</div>
                                <div className="text-xs text-muted-foreground">{c.email}</div>
                              </td>
                              <td className="text-center">{c.favorites}</td>
                              <td className="text-center">{c.grades}</td>
                              <td className="text-center">{c.tours}</td>
                              <td className="text-center">{c.comments}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No client activity recorded yet.</div>
                  )}
                </div>

                {/* Recent Agreements */}
                <div className="bg-white border border-border p-5 shadow-sm">
                  <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Recent Signed Agreements
                  </h3>
                  {(analytics?.recentAgreements || []).length > 0 ? (
                    <div className="space-y-2">
                      {analytics!.recentAgreements.map((a, i) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                          <div>
                            <span className="font-semibold">{a.client_name}</span>
                            {a.client_email && <span className="text-muted-foreground ml-2 text-xs">{a.client_email}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(a.signed_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No signed agreements yet.</div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Comment Details Dialog */}
      <Dialog open={!!commentDialogUserId} onOpenChange={(open) => { if (!open) setCommentDialogUserId(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Comments — {commentDialogUserId ? (getClientName(commentDialogUserId) || getClientEmail(commentDialogUserId)) : ""}
            </DialogTitle>
          </DialogHeader>
          {commentDetailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : commentDetails.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">No comments found.</div>
          ) : (
            <div className="space-y-4">
              {commentDetails.map((c, i) => (
                <div key={i} className="border border-border rounded p-3">
                  <div
                    className={`${c.dossierId ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
                    onClick={() => {
                      if (c.dossierId) {
                        setCommentDialogUserId(null);
                        setPropertyEditId(c.dossierId);
                        setExpenseEditId(null);
                        setEditingId(null);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-body text-sm font-semibold text-foreground">{c.address}</div>
                        <div className="font-body text-[10px] uppercase tracking-[1.5px] text-muted-foreground">{c.builder}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-body text-[10px] text-muted-foreground whitespace-nowrap">
                          {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                        </div>
                        {c.dossierId && <span className="text-muted-foreground text-xs">→</span>}
                      </div>
                    </div>
                    <div className="font-body text-sm text-foreground bg-muted/30 rounded p-2 italic">"{c.comment}"</div>
                  </div>

                  {/* Existing replies */}
                  {c.replies.length > 0 && (
                    <div className="mt-2 ml-4 space-y-1.5 border-l-2 border-primary/20 pl-3">
                      {c.replies.map(r => (
                        <div key={r.id} className="text-xs">
                          <span className="font-semibold text-primary">Admin</span>
                          <span className="text-muted-foreground ml-2">
                            {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                          <div className="text-foreground mt-0.5">{r.reply_text}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      placeholder="Reply to this comment…"
                      className="flex-1 font-body text-xs border border-border rounded px-2 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      value={replyTexts[c.interactionId] || ""}
                      onChange={e => setReplyTexts(prev => ({ ...prev, [c.interactionId]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") submitReply(c.interactionId); }}
                    />
                    <button
                      onClick={() => submitReply(c.interactionId)}
                      disabled={!replyTexts[c.interactionId]?.trim() || replyingSaving === c.interactionId}
                      className="flex items-center gap-1 font-body text-[10px] uppercase tracking-[1.5px] bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {replyingSaving === c.interactionId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
