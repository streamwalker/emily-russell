import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, ExternalLink, Image as ImageIcon, Loader2, Plus, Trash2, Video, X } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";

/**
 * Photo/video gallery attached to a single property inside a dossier.
 * Files live in the existing private `dossier-documents` bucket under the
 * dossier-owner's folder so existing storage RLS covers access.
 */

const MAX_PHOTO_BYTES = 20 * 1024 * 1024;        // 20MB per photo
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;       // 100MB per video
const ALLOWED_IMAGE = /^image\/(jpe?g|png|webp|heic|heif|gif)$/i;
const ALLOWED_VIDEO = /^video\/(mp4|quicktime|webm)$/i;

export interface PropertyMediaRow {
  id: string;
  dossier_id: string;
  property_id: string;
  user_id: string;
  uploaded_by: string;
  uploader_role: "admin" | "client";
  kind: "photo" | "video";
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  caption: string | null;
  created_at: string;
}

interface Props {
  dossierId: string;
  propertyId: string;
  /** Dossier owner (client) user id — used for storage folder + user_id column. */
  ownerUserId: string;
  /** Compact thumbnail strip (used on card header) vs. full grid (used in expanded detail). */
  variant: "strip" | "full";
  /** Show upload/delete controls. */
  canEdit?: boolean;
  /** Optional accent color for the strip border/count chip. */
  accentColor?: string;
  /** Property address — used as root of stored filenames. */
  propertyAddress?: string;
}

interface SignedItem extends PropertyMediaRow {
  url?: string;
}

const slugifyAddress = (addr?: string) => {
  const s = (addr || "property")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "property";
};


const extFromMime = (m: string) => {
  const map: Record<string, string> = {
    "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
    "image/webp": "webp", "image/heic": "heic", "image/heif": "heif", "image/gif": "gif",
    "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm",
  };
  return map[m.toLowerCase()] || "bin";
};

export default function PropertyMediaGallery({
  dossierId, propertyId, ownerUserId, variant, canEdit = false, accentColor, propertyAddress,
}: Props) {
  const { isAdmin } = useAdminCheck();
  const effectiveCanEdit = canEdit || isAdmin;
  const [items, setItems] = useState<SignedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("property_media")
      .select("*")
      .eq("dossier_id", dossierId)
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true });
    if (error) { console.error(error); toast.error("Could not load property media"); setLoading(false); return; }
    const rows = (data as PropertyMediaRow[]) || [];
    // Sign URLs in bulk
    const signed: SignedItem[] = await Promise.all(rows.map(async (r) => {
      const { data: s } = await supabase.storage.from("dossier-documents").createSignedUrl(r.storage_path, 60 * 60);
      return { ...r, url: s?.signedUrl };
    }));
    setItems(signed);
    setLoading(false);
  }, [dossierId, propertyId]);

  useEffect(() => { if (dossierId && propertyId) load(); }, [dossierId, propertyId, load]);

  const handleFiles = async (fl: FileList | null) => {
    if (!fl || fl.length === 0) return;
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) { toast.error("You must be signed in to upload."); return; }
    const uploaderRole: "admin" | "client" = isAdmin ? "admin" : "client";

    setUploading(true);
    let successCount = 0;
    const base = slugifyAddress(propertyAddress);
    const existingPhotos = items.filter((i) => i.kind === "photo").length;
    const existingVideos = items.filter((i) => i.kind === "video").length;
    let photoBatchIdx = 0;
    let videoBatchIdx = 0;
    for (const file of Array.from(fl)) {
      const isImage = ALLOWED_IMAGE.test(file.type);
      const isVideo = ALLOWED_VIDEO.test(file.type);
      if (!isImage && !isVideo) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }
      const limit = isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
      if (file.size > limit) {
        toast.error(`${file.name} is too large (max ${isVideo ? "100MB" : "20MB"}).`);
        continue;
      }
      const ext = extFromMime(file.type);
      const kind = isVideo ? "video" : "photo";
      const seqNum = isVideo ? existingVideos + (++videoBatchIdx) : existingPhotos + (++photoBatchIdx);
      const seq = String(seqNum).padStart(2, "0");
      const shortId = crypto.randomUUID().slice(0, 8);
      const path = `${ownerUserId}/property-media/${propertyId}/${base}-${kind}-${seq}-${shortId}.${ext}`;
      const { error: upErr } = await supabase.storage.from("dossier-documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) { console.error(upErr); toast.error(`Upload failed: ${file.name}`); continue; }


      const { error: insErr } = await supabase.from("property_media").insert({
        dossier_id: dossierId,
        property_id: propertyId,
        user_id: ownerUserId,
        uploaded_by: uid,
        uploader_role: uploaderRole,
        kind: isVideo ? "video" : "photo",
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (insErr) {
        console.error(insErr);
        await supabase.storage.from("dossier-documents").remove([path]);
        toast.error(`Save failed: ${file.name}`);
        continue;
      }
      successCount++;
      if (isVideo && /quicktime|mov/i.test(file.type)) {
        toast.info("Uploaded. Note: .mov may not preview in all browsers — use 'Open in new tab' to view.");
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (successCount > 0) {
      toast.success(`${successCount} file${successCount === 1 ? "" : "s"} uploaded`);
      await load();
    }
  };

  const handleDelete = async (row: SignedItem) => {
    if (!confirm("Delete this file?")) return;
    const { error: sErr } = await supabase.storage.from("dossier-documents").remove([row.storage_path]);
    if (sErr) console.warn(sErr);
    const { error } = await supabase.from("property_media").delete().eq("id", row.id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("File deleted");
    setLightboxIdx(null);
    load();
  };

  /* ── Strip variant: horizontal thumb row + "view all" ── */
  if (variant === "strip") {
    if (loading) return null;
    if (items.length === 0) return null;
    const preview = items.slice(0, 5);
    const extra = items.length - preview.length;
    return (
      <div className="flex items-center gap-1.5 mt-1.5 print:hidden">
        {preview.map((it, i) => (
          <button
            key={it.id}
            type="button"
            onClick={(e) => { e.stopPropagation(); setGalleryOpen(true); setLightboxIdx(i); }}
            className="relative h-10 w-10 rounded overflow-hidden border border-border bg-muted flex-shrink-0 hover:opacity-80 transition"
            title={it.kind === "video" ? "Video" : "Photo"}
          >
            {it.kind === "photo" && it.url
              ? <img src={it.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              : <div className="h-full w-full flex items-center justify-center bg-black/70 text-white">
                  <Video className="h-4 w-4" />
                </div>}
          </button>
        ))}
        {extra > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setGalleryOpen(true); }}
            className="h-10 min-w-10 px-2 rounded border border-border bg-muted text-[11px] font-semibold text-muted-foreground hover:bg-muted/70 transition"
            style={accentColor ? { color: accentColor, borderColor: `${accentColor}40` } : undefined}
          >
            +{extra}
          </button>
        )}
        <GalleryDialog
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          items={items}
          canEdit={effectiveCanEdit}
          onDelete={handleDelete}
          initialIndex={lightboxIdx}
        />
      </div>
    );
  }

  /* ── Full variant: labeled section with grid + upload ── */
  return (
    <div className="mt-4 print:hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold">
            Photos &amp; Video
          </span>
          <span className="text-[10px] text-muted-foreground">({items.length})</span>
        </div>
        {effectiveCanEdit && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif,video/mp4,video/quicktime,video/webm"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              {uploading ? "Uploading..." : "Add"}
            </Button>
          </>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground py-3 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading media…
        </div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground py-3 italic">
          No photos or videos yet.{effectiveCanEdit ? " Click Add to upload." : ""}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {items.map((it, i) => (
            <div key={it.id} className="relative group aspect-square rounded overflow-hidden border border-border bg-muted">
              <button
                type="button"
                onClick={() => setLightboxIdx(i)}
                className="absolute inset-0 w-full h-full"
                title={it.uploader_role === "admin" ? "Uploaded by Emily" : "Uploaded by client"}
              >
                {it.kind === "photo" && it.url ? (
                  <img src={it.url} alt={it.caption ?? ""} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/80 text-white">
                    <Video className="h-6 w-6" />
                  </div>
                )}
              </button>
              <span
                className="absolute top-1 left-1 text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded text-white pointer-events-none"
                style={{ background: it.uploader_role === "admin" ? "hsl(var(--gold))" : "hsl(var(--sage))", color: "#fff" }}
              >
                {it.uploader_role === "admin" ? "Emily" : "You"}
              </span>
              {effectiveCanEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(it); }}
                  className="absolute top-1 right-1 h-5 w-5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Lightbox
        open={lightboxIdx !== null}
        onOpenChange={(v) => { if (!v) setLightboxIdx(null); }}
        items={items}
        index={lightboxIdx ?? 0}
        onIndex={setLightboxIdx}
      />
    </div>
  );
}

/* ── Shared dialog components ── */

function Lightbox({
  open, onOpenChange, items, index, onIndex,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: SignedItem[];
  index: number;
  onIndex: (i: number) => void;
}) {
  const it = items[index];
  if (!it) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
        <DialogHeader className="sr-only"><DialogTitle>Media viewer</DialogTitle></DialogHeader>
        <div className="relative w-full max-h-[80vh] flex items-center justify-center">
          {it.kind === "photo" && it.url ? (
            <img src={it.url} alt={it.caption ?? ""} className="max-w-full max-h-[80vh] object-contain" />
          ) : it.url ? (
            <VideoPlayer url={it.url} mime={it.mime_type} className="max-w-full max-h-[80vh]" />
          ) : null}
          {items.length > 1 && (
            <>
              <button
                onClick={() => onIndex((index - 1 + items.length) % items.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white h-9 w-9 rounded-full"
              >‹</button>
              <button
                onClick={() => onIndex((index + 1) % items.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white h-9 w-9 rounded-full"
              >›</button>
            </>
          )}
        </div>
        <div className="px-4 py-2 text-xs text-white/80 bg-black flex items-center justify-between">
          <span>{index + 1} / {items.length}</span>
          <span className="capitalize">{it.uploader_role === "admin" ? "Uploaded by Emily" : "Uploaded by client"} · {new Date(it.created_at).toLocaleDateString()}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GalleryDialog({
  open, onOpenChange, items, canEdit, onDelete, initialIndex,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: SignedItem[];
  canEdit: boolean;
  onDelete: (r: SignedItem) => void;
  initialIndex: number | null;
}) {
  const [idx, setIdx] = useState<number | null>(initialIndex);
  useEffect(() => { if (open) setIdx(initialIndex); }, [open, initialIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Property media ({items.length})</DialogTitle></DialogHeader>
        {idx !== null && items[idx] ? (
          <div className="space-y-3">
            <div className="relative bg-black rounded overflow-hidden flex items-center justify-center max-h-[60vh]">
              {items[idx].kind === "photo" ? (
                <img src={items[idx].url} alt="" className="max-h-[60vh] object-contain" />
              ) : (
                <VideoPlayer url={items[idx].url!} mime={items[idx].mime_type} className="max-h-[60vh] w-full" />
              )}
              <button
                onClick={() => setIdx(null)}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center"
              ><X className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{idx + 1} / {items.length} · {items[idx].uploader_role === "admin" ? "Emily" : "Client"}</span>
              {canEdit && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(items[idx])}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[70vh] overflow-y-auto">
            {items.map((it, i) => (
              <button
                key={it.id}
                onClick={() => setIdx(i)}
                className="relative aspect-square rounded overflow-hidden border border-border bg-muted hover:opacity-80"
              >
                {it.kind === "photo" && it.url ? (
                  <img src={it.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/80 text-white">
                    <Video className="h-5 w-5" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Video player with graceful fallback for unsupported formats (e.g. .mov) ── */
function VideoPlayer({ url, mime, className }: { url: string; mime: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const isQuickTime = /quicktime|mov/i.test(mime);

  useEffect(() => {
    setFailed(false);
    // Proactively detect: if the browser reports it can't play this type, show fallback.
    const v = document.createElement("video");
    const can = v.canPlayType(mime || "");
    if (!can && isQuickTime) {
      setFailed(true);
    }
  }, [url, mime, isQuickTime]);

  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 p-6 text-center bg-black text-white ${className ?? ""}`}>
        <Video className="h-10 w-10 opacity-80" />
        <div className="text-sm">
          This video format {isQuickTime ? "(QuickTime .mov) " : ""}isn't supported by this browser.
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open in new tab
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={url} download>
              <Download className="h-3.5 w-3.5 mr-1" /> Download
            </a>
          </Button>
        </div>
        <div className="text-[10px] text-white/60">Tip: iPhone .mov files play best in Safari or after downloading.</div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      preload="metadata"
      className={className}
      onError={() => setFailed(true)}
    >
      <source src={url} type={mime || undefined} />
      Your browser can't play this video.
    </video>
  );
}
