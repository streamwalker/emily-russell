import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Upload, RotateCw, Trash2, Sparkles, RefreshCcw, FileText } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import {
  buildPdf,
  docxToPdfBytes,
  getPdfPageCount,
  renderPdfPageToImage,
  type PageSource,
} from "@/lib/pdfBuilder";
import { rotateImage, scanImage } from "./DocumentScanner";

type PageTile = {
  id: string;
  kind: "image" | "pdfPage";
  /** display thumbnail */
  thumbUrl: string;
  /** for "image" — the current (possibly scanned/rotated) JPEG blob */
  imageBlob?: Blob;
  /** for "image" — the original blob, for revert */
  originalBlob?: Blob;
  /** for "pdfPage" */
  pdfBytes?: Uint8Array;
  pdfPageIndex?: number;
  /** label shown on the tile */
  label: string;
  /** true while a scan/rotation is in progress */
  busy?: boolean;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  ownerUserId: string;
  uploaderUserId: string;
  onSaved?: () => void;
}

export default function DocumentBuilder({
  open,
  onOpenChange,
  dossierId,
  ownerUserId,
  uploaderUserId,
  onSaved,
}: Props) {
  const [tiles, setTiles] = useState<PageTile[]>([]);
  const [filename, setFilename] = useState("Client Document");
  const [autoScan, setAutoScan] = useState(true);
  const [bw, setBw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Cleanup blob URLs when tiles change/unmount
  useEffect(() => {
    return () => {
      tiles.forEach(t => URL.revokeObjectURL(t.thumbUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    tiles.forEach(t => URL.revokeObjectURL(t.thumbUrl));
    setTiles([]);
    setFilename("Client Document");
    setBusy(false);
    setAdding(false);
  };

  const addFiles = async (files: FileList | File[]) => {
    setAdding(true);
    const list = Array.from(files);
    const newTiles: PageTile[] = [];

    for (const file of list) {
      try {
        const lower = file.name.toLowerCase();
        const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(lower);
        const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
        const isDocx = lower.endsWith(".docx") || lower.endsWith(".doc");

        if (isImage) {
          let blob: Blob = file;
          // HEIC -> JPEG
          if (/\.(heic|heif)$/i.test(lower) || file.type === "image/heic" || file.type === "image/heif") {
            try {
              const heic2any = (await import("heic2any")).default;
              blob = (await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 })) as Blob;
            } catch (e) {
              console.warn("HEIC conversion failed", e);
            }
          }
          let processed = blob;
          if (autoScan) {
            try {
              processed = await scanImage(blob, { blackAndWhite: bw });
            } catch (e) {
              console.warn("Scan failed, using original", e);
            }
          }
          newTiles.push({
            id: crypto.randomUUID(),
            kind: "image",
            thumbUrl: URL.createObjectURL(processed),
            imageBlob: processed,
            originalBlob: blob,
            label: file.name,
          });
        } else if (isPdf) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const count = await getPdfPageCount(bytes);
          for (let i = 0; i < count; i++) {
            const thumb = await renderPdfPageToImage(bytes, i, 1.2);
            newTiles.push({
              id: crypto.randomUUID(),
              kind: "pdfPage",
              thumbUrl: URL.createObjectURL(thumb),
              pdfBytes: bytes,
              pdfPageIndex: i,
              label: `${file.name} · p${i + 1}`,
            });
          }
        } else if (isDocx) {
          const pdfBytes = await docxToPdfBytes(file);
          const count = await getPdfPageCount(pdfBytes);
          for (let i = 0; i < count; i++) {
            const thumb = await renderPdfPageToImage(pdfBytes, i, 1.2);
            newTiles.push({
              id: crypto.randomUUID(),
              kind: "pdfPage",
              thumbUrl: URL.createObjectURL(thumb),
              pdfBytes,
              pdfPageIndex: i,
              label: `${file.name} · p${i + 1}`,
            });
          }
        } else {
          toast.error(`Unsupported file: ${file.name}`);
        }
      } catch (e) {
        console.error(e);
        toast.error(`Could not import ${file.name}`);
      }
    }

    setTiles(prev => [...prev, ...newTiles]);
    setAdding(false);
  };

  const updateTile = (id: string, patch: Partial<PageTile>) => {
    setTiles(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const rotate90 = async (id: string) => {
    const tile = tiles.find(t => t.id === id);
    if (!tile || tile.kind !== "image" || !tile.imageBlob) return;
    updateTile(id, { busy: true });
    try {
      const rotated = await rotateImage(tile.imageBlob, 90);
      URL.revokeObjectURL(tile.thumbUrl);
      updateTile(id, { imageBlob: rotated, thumbUrl: URL.createObjectURL(rotated), busy: false });
    } catch {
      updateTile(id, { busy: false });
      toast.error("Rotation failed");
    }
  };

  const rescan = async (id: string) => {
    const tile = tiles.find(t => t.id === id);
    if (!tile || tile.kind !== "image" || !tile.originalBlob) return;
    updateTile(id, { busy: true });
    try {
      const scanned = await scanImage(tile.originalBlob, { blackAndWhite: bw });
      URL.revokeObjectURL(tile.thumbUrl);
      updateTile(id, { imageBlob: scanned, thumbUrl: URL.createObjectURL(scanned), busy: false });
    } catch {
      updateTile(id, { busy: false });
      toast.error("Scan failed");
    }
  };

  const revert = async (id: string) => {
    const tile = tiles.find(t => t.id === id);
    if (!tile || tile.kind !== "image" || !tile.originalBlob) return;
    URL.revokeObjectURL(tile.thumbUrl);
    updateTile(id, {
      imageBlob: tile.originalBlob,
      thumbUrl: URL.createObjectURL(tile.originalBlob),
    });
  };

  const removeTile = (id: string) => {
    const tile = tiles.find(t => t.id === id);
    if (tile) URL.revokeObjectURL(tile.thumbUrl);
    setTiles(prev => prev.filter(t => t.id !== id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setTiles(prev => {
      const oldIdx = prev.findIndex(t => t.id === active.id);
      const newIdx = prev.findIndex(t => t.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const handleSave = async () => {
    if (tiles.length === 0) {
      toast.error("Add at least one page");
      return;
    }
    const cleanName = filename.trim().replace(/\.pdf$/i, "") || "Client Document";
    setBusy(true);
    try {
      const sources: PageSource[] = tiles.map(t =>
        t.kind === "image"
          ? { kind: "image", blob: t.imageBlob! }
          : { kind: "pdfPage", pdfBytes: t.pdfBytes!, pageIndex: t.pdfPageIndex! },
      );
      const pdfBytes = await buildPdf(sources);
      const documentId = crypto.randomUUID();
      const path = `${ownerUserId}/${documentId}.pdf`;
      const upload = await supabase.storage
        .from("dossier-documents")
        .upload(path, new Blob([pdfBytes], { type: "application/pdf" }), {
          contentType: "application/pdf",
          upsert: false,
        });
      if (upload.error) throw upload.error;

      const insert = await supabase.from("dossier_documents").insert({
        id: documentId,
        dossier_id: dossierId,
        user_id: ownerUserId,
        uploaded_by: uploaderUserId,
        filename: `${cleanName}.pdf`,
        storage_path: path,
        size_bytes: pdfBytes.byteLength,
        page_count: tiles.length,
      });
      if (insert.error) throw insert.error;

      toast.success("Document saved");
      onSaved?.();
      onOpenChange(false);
      reset();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to save document");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload &amp; Build PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="doc-name" className="text-xs">Document name</Label>
              <Input
                id="doc-name"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                placeholder="e.g., Pre-Approval Letter"
              />
            </div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Switch checked={autoScan} onCheckedChange={setAutoScan} />
                Auto-scan photos
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Switch checked={bw} onCheckedChange={setBw} disabled={!autoScan} />
                B&amp;W
              </label>
            </div>
          </div>

          <div
            className="border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInput.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm font-body">
              {adding ? "Importing…" : "Drop photos, PDFs, or Word documents here"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              JPG, PNG, HEIC, PDF, DOC, DOCX
            </div>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/*,.heic,.heif,.pdf,.doc,.docx"
              className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {tiles.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tiles.map(t => t.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {tiles.map((t, idx) => (
                    <SortableTile
                      key={t.id}
                      tile={t}
                      index={idx}
                      onRotate={() => rotate90(t.id)}
                      onRescan={() => rescan(t.id)}
                      onRevert={() => revert(t.id)}
                      onRemove={() => removeTile(t.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy || adding || tiles.length === 0}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Save PDF ({tiles.length} {tiles.length === 1 ? "page" : "pages"})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SortableTile({
  tile,
  index,
  onRotate,
  onRescan,
  onRevert,
  onRemove,
}: {
  tile: PageTile;
  index: number;
  onRotate: () => void;
  onRescan: () => void;
  onRevert: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tile.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const isImage = tile.kind === "image";
  return (
    <div ref={setNodeRef} style={style} className="border rounded-md bg-card overflow-hidden flex flex-col">
      <div
        className="relative bg-muted/30 aspect-[3/4] cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tile.thumbUrl} alt={tile.label} className="w-full h-full object-contain" />
        <div className="absolute top-1 left-1 bg-foreground/80 text-background text-[10px] font-bold rounded px-1.5 py-0.5">
          {index + 1}
        </div>
        {tile.busy && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
      <div className="p-1.5 flex items-center justify-between gap-1">
        <div className="text-[10px] truncate flex-1" title={tile.label}>{tile.label}</div>
      </div>
      <div className="px-1.5 pb-1.5 flex items-center gap-1">
        {isImage && (
          <>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRotate} title="Rotate 90°">
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRescan} title="Re-scan">
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRevert} title="Revert to original">
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        <div className="flex-1" />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onRemove}
          title="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
