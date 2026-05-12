import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DocumentBuilder from "./DocumentBuilder";

interface DossierDocument {
  id: string;
  filename: string;
  storage_path: string;
  size_bytes: number;
  page_count: number;
  created_at: string;
}

interface Props {
  dossierId: string;
  ownerUserId: string;
  /** Read-only viewers (e.g. admin preview) can still view & download but the upload button can be hidden. */
  canUpload?: boolean;
  /** Allow viewer to delete (owner or admin). */
  canDelete?: boolean;
}

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DossierDocumentsCard({
  dossierId,
  ownerUserId,
  canUpload = true,
  canDelete = true,
}: Props) {
  const [uploaderId, setUploaderId] = useState<string>("");
  const [docs, setDocs] = useState<DossierDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dossier_documents")
      .select("id, filename, storage_path, size_bytes, page_count, created_at")
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Could not load documents");
    } else {
      setDocs(data || []);
    }
    setLoading(false);
  }, [dossierId]);

  useEffect(() => {
    if (dossierId) load();
  }, [dossierId, load]);

  const handleDownload = async (doc: DossierDocument) => {
    setDownloadingId(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from("dossier-documents")
        .createSignedUrl(doc.storage_path, 60);
      if (error || !data) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      toast.error("Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (doc: DossierDocument) => {
    if (!confirm(`Delete "${doc.filename}"?`)) return;
    const { error: storageErr } = await supabase.storage.from("dossier-documents").remove([doc.storage_path]);
    if (storageErr) console.warn(storageErr);
    const { error } = await supabase.from("dossier_documents").delete().eq("id", doc.id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Document deleted");
    load();
  };

  return (
    <div className="border rounded-lg bg-card p-4 print:hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base">Documents</h3>
          <span className="text-xs text-muted-foreground">({docs.length})</span>
        </div>
        {canUpload && (
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Upload &amp; Build PDF
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground py-4 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : docs.length === 0 ? (
        <div className="text-xs text-muted-foreground py-4">
          No documents yet. Upload photos, scans, PDFs, or Word documents and we'll build a clean PDF for you.
        </div>
      ) : (
        <ul className="divide-y">
          {docs.map(d => (
            <li key={d.id} className="py-2 flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{d.filename}</div>
                <div className="text-[11px] text-muted-foreground">
                  {d.page_count} {d.page_count === 1 ? "page" : "pages"} · {fmtSize(d.size_bytes)} ·{" "}
                  {new Date(d.created_at).toLocaleDateString()}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => handleDownload(d)}
                disabled={downloadingId === d.id}
                title="Download"
              >
                {downloadingId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
              {canDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(d)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canUpload && (
        <DocumentBuilder
          open={open}
          onOpenChange={setOpen}
          dossierId={dossierId}
          ownerUserId={ownerUserId}
          uploaderUserId={uploaderUserId}
          onSaved={load}
        />
      )}
    </div>
  );
}
