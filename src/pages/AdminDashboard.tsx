import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import ExpenseEditor from "@/components/admin/ExpenseEditor";

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

  // New dossier form
  const [showNew, setShowNew] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newTitle, setNewTitle] = useState("Client Property Dossier");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newJson, setNewJson] = useState("{}");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [dossierRes, profileRes] = await Promise.all([
      supabase.from("client_dossiers").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, email, full_name"),
    ]);
    if (dossierRes.data) setDossiers(dossierRes.data as DossierRow[]);
    if (profileRes.data) setProfiles(profileRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/portal", { replace: true });
    if (!adminLoading && isAdmin) fetchData();
  }, [adminLoading, isAdmin, navigate, fetchData]);

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

  const createDossier = async () => {
    setSaving(true);
    setError("");
    try {
      const parsed = JSON.parse(newJson);
      const { error: err } = await supabase.from("client_dossiers").insert({
        user_id: newUserId,
        title: newTitle,
        prepared_date: newDate,
        dossier_data: parsed,
      });
      if (err) throw err;
      setShowNew(false);
      setNewJson("{}");
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
        <div className="text-gold font-body text-lg">Loading…</div>
      </div>
    );
  }

  return (
    <div className="font-body min-h-screen bg-cream text-charcoal">
      {/* Header */}
      <div className="bg-charcoal text-white px-6 py-5">
        <div className="max-w-[1100px] mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-display text-2xl font-bold m-0">Admin Dashboard</h1>
            <p className="text-[10px] tracking-[3px] uppercase opacity-45 mt-1">Manage Client Dossiers</p>
          </div>
          <div className="flex gap-3 items-center">
            <Link to="/portal" className="font-body text-[11px] uppercase tracking-[2px] text-white/70 no-underline hover:text-white transition-colors">
              My Portal
            </Link>
            <button onClick={handleLogout} className="font-body text-[11px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-white/30 text-white/70 px-4 py-2 hover:text-white hover:border-white/60 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 py-8">
        {/* Actions */}
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
            <div className="mb-4">
              <label className="er-label block mb-1">Dossier Data (JSON)</label>
              <textarea
                value={newJson}
                onChange={e => setNewJson(e.target.value)}
                rows={12}
                className="er-input font-mono text-xs"
                style={{ resize: "vertical" }}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={createDossier} disabled={saving || !newUserId} className="btn-er-primary !py-2.5 !px-6 !text-[10px]">
                {saving ? "Creating…" : "Create Dossier"}
              </button>
              <button onClick={() => setShowNew(false)} className="btn-outline-light !text-charcoal !border-border !py-2.5 !px-6 !text-[10px]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Dossier List */}
        {dossiers.length === 0 ? (
          <div className="text-center py-12 text-slate-er">No dossiers yet. Create one above.</div>
        ) : (
          <div className="space-y-3">
            {dossiers.map(d => (
              <div key={d.id} className="bg-white border border-border p-5 shadow-sm">
                {expenseEditId === d.id ? (
                  <ExpenseEditor
                    dossierData={d.dossier_data as any}
                    saving={saving}
                    onCancel={() => setExpenseEditId(null)}
                    onSave={async (updatedData) => {
                      setSaving(true);
                      setError("");
                      try {
                        const { error: err } = await supabase
                          .from("client_dossiers")
                          .update({ dossier_data: updatedData as any })
                          .eq("id", d.id);
                        if (err) throw err;
                        setExpenseEditId(null);
                        fetchData();
                      } catch (e: unknown) {
                        setError(e instanceof Error ? e.message : "Failed to save expenses");
                      }
                      setSaving(false);
                    }}
                  />
                ) : editingId === d.id ? (
                  <div>
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
                      <textarea
                        value={editJson}
                        onChange={e => setEditJson(e.target.value)}
                        rows={16}
                        className="er-input font-mono text-xs"
                        style={{ resize: "vertical" }}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={saveEdit} disabled={saving} className="btn-er-primary !py-2 !px-5 !text-[10px]">
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-outline-light !text-charcoal !border-border !py-2 !px-5 !text-[10px]">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-display text-base font-semibold">{d.title}</div>
                      <div className="font-body text-sm text-slate-er mt-1">
                        Client: <strong>{getClientEmail(d.user_id)}</strong>
                        {getClientName(d.user_id) && <span> ({getClientName(d.user_id)})</span>}
                      </div>
                      <div className="font-body text-xs text-slate-er mt-1 opacity-60">
                        Prepared: {d.prepared_date} · Updated: {new Date(d.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setExpenseEditId(d.id); setError(""); }} className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-primary/50 text-primary px-3 py-1.5 hover:border-primary hover:bg-primary/5 transition-colors">
                        💰 Expenses
                      </button>
                      <button onClick={() => startEdit(d)} className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-border text-charcoal px-3 py-1.5 hover:border-gold transition-colors">
                        Edit
                      </button>
                      <button onClick={() => deleteDossier(d.id)} className="font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-destructive/30 text-destructive px-3 py-1.5 hover:bg-destructive/5 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
