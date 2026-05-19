import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, Trash2, Download, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import CmaEditor from "./CmaEditor";

export interface CmaReportRow {
  id: string;
  address: string;
  status: string;
  value_low: number | null;
  value_recommended: number | null;
  value_high: number | null;
  pdf_path: string | null;
  created_at: string;
  subject_data: any;
  comps_data: any;
  notes: string | null;
  narrative: string | null;
  executive_summary: string | null;
  ppsf_low: number | null;
  ppsf_recommended: number | null;
  ppsf_high: number | null;
  home_id: string | null;
  subject_sources: Record<string, string> | null;
}


export default function CmaWorkspace() {
  const [rows, setRows] = useState<CmaReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<CmaReportRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cma_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data || []) as CmaReportRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (row: CmaReportRow) => {
    if (!confirm(`Delete CMA for ${row.address}?`)) return;
    if (row.pdf_path) {
      await supabase.storage.from("cma-reports").remove([row.pdf_path]);
    }
    const { error } = await supabase.from("cma_reports").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  const handleDownload = async (row: CmaReportRow) => {
    if (!row.pdf_path) return;
    const { data, error } = await supabase.storage
      .from("cma-reports")
      .createSignedUrl(row.pdf_path, 300);
    if (error || !data) { toast.error("Could not get download link"); return; }
    window.open(data.signedUrl, "_blank");
  };

  if (active || creating) {
    return (
      <div>
        <button
          onClick={() => { setActive(null); setCreating(false); load(); }}
          className="flex items-center gap-2 text-xs font-body uppercase tracking-[2px] text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to CMA library
        </button>
        <CmaEditor
          initial={active}
          onSaved={() => { setActive(null); setCreating(false); load(); }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display text-xl">Comparative Market Analyses</h2>
          <p className="font-body text-xs text-muted-foreground mt-1">
            AI-assisted CMAs for San Antonio listings · {rows.length} saved
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="btn-er-primary !py-2.5 !px-5 !text-[10px] flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" /> New CMA
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-border p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-display text-lg mb-1">No CMAs yet</p>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Generate your first analyst-grade CMA in under two minutes.
          </p>
          <button onClick={() => setCreating(true)} className="btn-er-primary !py-2 !px-4 !text-[10px]">
            <Plus className="w-3.5 h-3.5 inline mr-1" /> Start a CMA
          </button>
        </div>
      ) : (
        <div className="bg-white border border-border divide-y divide-border">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-4 hover:bg-cream/40 transition-colors">
              <button
                onClick={() => setActive(r)}
                className="flex-1 text-left min-w-0"
              >
                <div className="font-display text-base text-foreground truncate">{r.address}</div>
                <div className="font-body text-xs text-muted-foreground mt-0.5">
                  {new Date(r.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  {r.status === "generated" && r.value_recommended && (
                    <> · <span className="text-primary font-medium">
                      ${Math.round(r.value_low || 0).toLocaleString()} – ${Math.round(r.value_high || 0).toLocaleString()}
                    </span></>
                  )}
                  {r.status === "draft" && <> · <span className="text-muted-foreground italic">Draft</span></>}
                  {r.status === "failed" && <> · <span className="text-destructive">Failed</span></>}
                </div>
              </button>
              <div className="flex items-center gap-2 ml-4">
                {r.pdf_path && (
                  <button
                    onClick={() => handleDownload(r)}
                    className="p-2 text-muted-foreground hover:text-primary"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(r)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
