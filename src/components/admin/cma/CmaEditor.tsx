import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Save, Plus, Trash2, ClipboardPaste, Download, Wand2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { buildCmaPdf, type CmaSubject, type CmaComp, type CmaResult } from "@/lib/cmaPdf";
import type { CmaReportRow } from "./CmaWorkspace";

interface Props {
  initial: CmaReportRow | null;
  onSaved: () => void;
}

const emptySubject: CmaSubject = {
  address: "",
  beds: null,
  baths: null,
  sqft: null,
  yearBuilt: null,
  lotSize: "",
  builder: "",
  condition: "",
};

const emptyComp = (): CmaComp => ({
  address: "",
  salePrice: 0,
  sqft: null,
  beds: null,
  baths: null,
  saleDate: "",
  distanceMiles: null,
  condition: "",
  adjustment: null,
  notes: "",
});

export default function CmaEditor({ initial, onSaved }: Props) {
  const [subject, setSubject] = useState<CmaSubject>(initial?.subject_data || emptySubject);
  const [comps, setComps] = useState<CmaComp[]>(
    initial?.comps_data?.length ? initial.comps_data : [emptyComp(), emptyComp(), emptyComp()],
  );
  const [notes, setNotes] = useState<string>(initial?.notes || "");
  const [result, setResult] = useState<CmaResult | null>(() =>
    initial?.narrative
      ? {
          narrative: initial.narrative || undefined,
          executiveSummary: initial.executive_summary || undefined,
          valueLow: initial.value_low ?? undefined,
          valueRecommended: initial.value_recommended ?? undefined,
          valueHigh: initial.value_high ?? undefined,
          ppsfLow: initial.ppsf_low ?? undefined,
          ppsfRecommended: initial.ppsf_recommended ?? undefined,
          ppsfHigh: initial.ppsf_high ?? undefined,
        }
      : null,
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [autoFilling, setAutoFilling] = useState<null | "subject" | "comps" | "both">(null);
  const [radiusMiles, setRadiusMiles] = useState(0.5);
  const [monthsBack, setMonthsBack] = useState(6);
  const [autoLog, setAutoLog] = useState<string[]>([]);

  const runAutoFill = async (mode: "subject" | "comps" | "both") => {
    if (!subject.address || subject.address.trim().length < 5) {
      toast.error("Enter an address first");
      return;
    }
    setAutoFilling(mode);
    setAutoLog([]);
    try {
      const { data, error: invErr } = await supabase.functions.invoke("cma-autofill", {
        body: { address: subject.address, mode, radiusMiles, monthsBack },
      });
      if (invErr) throw invErr;
      if (data?.error) throw new Error(data.error);

      if (data?.subject && (mode === "subject" || mode === "both")) {
        setSubject((s) => ({
          ...s,
          beds: data.subject.beds ?? s.beds,
          baths: data.subject.baths ?? s.baths,
          sqft: data.subject.sqft ?? s.sqft,
          yearBuilt: data.subject.yearBuilt ?? s.yearBuilt,
          lotSize: data.subject.lotSize ?? s.lotSize,
          builder: data.subject.builder ?? s.builder,
          condition: data.subject.condition ?? s.condition,
        }));
      }
      if (Array.isArray(data?.comps) && (mode === "comps" || mode === "both")) {
        const mapped: CmaComp[] = data.comps.map((c: any) => ({
          address: c.address || "",
          salePrice: Number(c.salePrice) || 0,
          sqft: c.sqft ?? null,
          beds: c.beds ?? null,
          baths: c.baths ?? null,
          saleDate: c.saleDate || "",
          distanceMiles: c.distanceMiles ?? null,
          condition: c.condition || "",
          adjustment: null,
          notes: "",
        }));
        if (mapped.length) {
          setComps(mapped);
          toast.success(`Found ${mapped.length} comps`);
        } else {
          toast.warning("No comps found — try widening the radius or window");
        }
      }
      if (mode !== "comps" && data?.subject) {
        const filled = Object.keys(data.subject).length;
        toast.success(`Auto-filled ${filled} subject field${filled === 1 ? "" : "s"}`);
      }
      setAutoLog(Array.isArray(data?.log) ? data.log : []);
    } catch (e: any) {
      console.error(e);
      toast.error("Auto-fill failed: " + (e?.message || String(e)));
    } finally {
      setAutoFilling(null);
    }
  };


  const updateSubject = <K extends keyof CmaSubject>(k: K, v: CmaSubject[K]) =>
    setSubject((s) => ({ ...s, [k]: v }));
  const updateComp = (i: number, patch: Partial<CmaComp>) =>
    setComps((c) => c.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addComp = () => setComps((c) => [...c, emptyComp()]);
  const removeComp = (i: number) => setComps((c) => c.filter((_, idx) => idx !== i));

  const pasteComps = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.trim().split(/\n/);
      const parsed = lines.map((line): CmaComp | null => {
        const cells = line.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((s) => s.trim().replace(/^"|"$/g, ""));
        if (cells.length < 2) return null;
        const num = (s: string) => {
          const n = parseFloat(s.replace(/[$,]/g, ""));
          return isNaN(n) ? null : n;
        };
        return {
          address: cells[0] || "",
          salePrice: num(cells[1] || "") || 0,
          sqft: num(cells[2] || ""),
          beds: num(cells[3] || ""),
          baths: num(cells[4] || ""),
          saleDate: cells[5] || "",
          distanceMiles: num(cells[6] || ""),
          condition: cells[7] || "",
          adjustment: null,
          notes: "",
        };
      }).filter(Boolean) as CmaComp[];
      if (parsed.length) {
        setComps(parsed);
        toast.success(`Pasted ${parsed.length} comps`);
      } else {
        toast.error("Could not parse clipboard");
      }
    } catch {
      toast.error("Clipboard access denied");
    }
  };

  const canGenerate =
    subject.address.trim().length > 3 && comps.some((c) => c.address && c.salePrice > 0);

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    try {
      const validComps = comps.filter((c) => c.address && c.salePrice > 0);
      const { data, error: invErr } = await supabase.functions.invoke("generate-cma-narrative", {
        body: { subject, comps: validComps, notes: notes || null },
      });
      if (invErr) throw invErr;
      if (data?.error) throw new Error(data.error);
      setResult(data as CmaResult);
      toast.success("CMA generated");
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || String(e);
      setError(msg);
      toast.error("Generation failed: " + msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (alsoDownload = false) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      let pdfPath: string | null = initial?.pdf_path || null;
      const validComps = comps.filter((c) => c.address && c.salePrice > 0);

      if (result) {
        const bytes = await buildCmaPdf(subject, validComps, result, notes);
        const filename = `${user.id}/${Date.now()}-${subject.address.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}.pdf`;
        const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
        const { error: upErr } = await supabase.storage.from("cma-reports").upload(filename, blob, {
          contentType: "application/pdf",
          upsert: false,
        });
        if (upErr) throw upErr;
        pdfPath = filename;

        if (alsoDownload) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `CMA-${subject.address.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }

      const payload: any = {
        created_by: user.id,
        address: subject.address,
        subject_data: subject as any,
        comps_data: validComps as any,
        notes: notes || null,
        narrative: result?.narrative || null,
        executive_summary: result?.executiveSummary || null,
        value_low: result?.valueLow ?? null,
        value_recommended: result?.valueRecommended ?? null,
        value_high: result?.valueHigh ?? null,
        ppsf_low: result?.ppsfLow ?? null,
        ppsf_recommended: result?.ppsfRecommended ?? null,
        ppsf_high: result?.ppsfHigh ?? null,
        status: result ? "generated" : "draft",
        pdf_path: pdfPath,
      };

      if (initial) {
        const { error: upErr } = await supabase.from("cma_reports").update(payload).eq("id", initial.id);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase.from("cma_reports").insert(payload);
        if (insErr) throw insErr;
      }
      toast.success("Saved");
      onSaved();
    } catch (e: any) {
      console.error(e);
      toast.error("Save failed: " + (e?.message || String(e)));
    } finally {
      setSaving(false);
    }
  };

  const fmt$ = (n?: number | null) =>
    n == null ? "—" : "$" + Math.round(n).toLocaleString("en-US");

  return (
    <div className="space-y-6">
      {/* Subject */}
      <section className="bg-white border border-border p-5">
        <h3 className="font-display text-base font-semibold mb-4">Subject Property</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Address" value={subject.address} onChange={(v) => updateSubject("address", v)} placeholder="3850 Millbrook Way, San Antonio, TX 78258" wide />
          <NumInput label="Beds" value={subject.beds} onChange={(v) => updateSubject("beds", v)} />
          <NumInput label="Baths" value={subject.baths} onChange={(v) => updateSubject("baths", v)} step={0.5} />
          <NumInput label="Square Feet" value={subject.sqft} onChange={(v) => updateSubject("sqft", v)} />
          <NumInput label="Year Built" value={subject.yearBuilt} onChange={(v) => updateSubject("yearBuilt", v)} />
          <Input label="Lot Size" value={subject.lotSize || ""} onChange={(v) => updateSubject("lotSize", v)} placeholder="0.25 acres" />
          <Input label="Condition" value={subject.condition || ""} onChange={(v) => updateSubject("condition", v)} placeholder="Updated kitchen, original baths" wide />
        </div>
      </section>

      {/* Comps */}
      <section className="bg-white border border-border p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-base font-semibold">Comparable Sales</h3>
          <div className="flex gap-2">
            <button onClick={pasteComps} className="flex items-center gap-1.5 text-xs font-body uppercase tracking-[2px] text-muted-foreground hover:text-primary px-3 py-1.5 border border-border">
              <ClipboardPaste className="w-3.5 h-3.5" /> Paste CSV
            </button>
            <button onClick={addComp} className="flex items-center gap-1.5 text-xs font-body uppercase tracking-[2px] text-primary hover:text-primary/80 px-3 py-1.5 border border-primary/30">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {comps.map((c, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center text-sm">
              <input
                className="col-span-4 px-2 py-1.5 border border-border bg-white text-sm"
                placeholder="Address"
                value={c.address}
                onChange={(e) => updateComp(i, { address: e.target.value })}
              />
              <input
                className="col-span-2 px-2 py-1.5 border border-border bg-white text-sm"
                placeholder="Sale price"
                type="number"
                value={c.salePrice || ""}
                onChange={(e) => updateComp(i, { salePrice: parseFloat(e.target.value) || 0 })}
              />
              <input
                className="col-span-1 px-2 py-1.5 border border-border bg-white text-sm"
                placeholder="Sqft"
                type="number"
                value={c.sqft ?? ""}
                onChange={(e) => updateComp(i, { sqft: e.target.value ? parseFloat(e.target.value) : null })}
              />
              <input
                className="col-span-1 px-2 py-1.5 border border-border bg-white text-sm"
                placeholder="Bd"
                type="number"
                value={c.beds ?? ""}
                onChange={(e) => updateComp(i, { beds: e.target.value ? parseFloat(e.target.value) : null })}
              />
              <input
                className="col-span-1 px-2 py-1.5 border border-border bg-white text-sm"
                placeholder="Ba"
                type="number"
                step="0.5"
                value={c.baths ?? ""}
                onChange={(e) => updateComp(i, { baths: e.target.value ? parseFloat(e.target.value) : null })}
              />
              <input
                className="col-span-2 px-2 py-1.5 border border-border bg-white text-sm"
                placeholder="Sale date"
                value={c.saleDate || ""}
                onChange={(e) => updateComp(i, { saleDate: e.target.value })}
              />
              <button
                onClick={() => removeComp(i)}
                className="col-span-1 p-1.5 text-muted-foreground hover:text-destructive flex justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <p className="font-body text-[11px] text-muted-foreground mt-3">
          Tip: paste a tab- or comma-separated list as <em>address, price, sqft, bd, ba, date</em>.
        </p>
      </section>

      {/* Notes */}
      <section className="bg-white border border-border p-5">
        <h3 className="font-display text-base font-semibold mb-3">Agent Notes <span className="font-body text-xs text-muted-foreground font-normal">(optional)</span></h3>
        <textarea
          className="w-full px-3 py-2 border border-border bg-white text-sm min-h-[80px]"
          placeholder="Market conditions, condition vs comps, unique features…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      {/* Generate */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className="btn-er-primary !py-3 !px-6 !text-xs flex items-center gap-2 disabled:opacity-40"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {result ? "Regenerate Narrative" : "Generate CMA"}
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={saving || !subject.address}
          className="px-5 py-3 text-xs font-body uppercase tracking-[2px] border border-border bg-white hover:bg-cream flex items-center gap-2 disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
        {result && (
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-5 py-3 text-xs font-body uppercase tracking-[2px] border border-primary text-primary hover:bg-primary/5 flex items-center gap-2 disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Save + Download PDF
          </button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive font-body">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <section className="bg-cream/40 border border-primary/30 p-6">
          <h3 className="font-display text-lg mb-4">AI Analysis</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Low", v: result.valueLow, p: result.ppsfLow },
              { label: "Recommended", v: result.valueRecommended, p: result.ppsfRecommended, accent: true },
              { label: "High", v: result.valueHigh, p: result.ppsfHigh },
            ].map((b) => (
              <div key={b.label} className={`p-4 text-center border ${b.accent ? "border-primary bg-white" : "border-border bg-white/60"}`}>
                <div className={`text-[10px] font-body uppercase tracking-[2px] ${b.accent ? "text-primary" : "text-muted-foreground"}`}>
                  {b.label}
                </div>
                <div className={`font-display text-2xl mt-1 ${b.accent ? "text-primary" : "text-foreground"}`}>{fmt$(b.v)}</div>
                {b.p != null && (
                  <div className="font-body text-[11px] text-muted-foreground mt-0.5">${Math.round(b.p)}/sqft</div>
                )}
              </div>
            ))}
          </div>
          {result.executiveSummary && (
            <div className="mb-4">
              <div className="text-[10px] font-body uppercase tracking-[2px] text-primary mb-1.5">Executive Summary</div>
              <p className="font-body text-sm leading-relaxed">{result.executiveSummary}</p>
            </div>
          )}
          {result.narrative && (
            <div className="mb-4">
              <div className="text-[10px] font-body uppercase tracking-[2px] text-primary mb-1.5">Market Analysis</div>
              <div className="font-body text-sm leading-relaxed whitespace-pre-wrap">{result.narrative}</div>
            </div>
          )}
          {result.compAnalysis?.length ? (
            <div>
              <div className="text-[10px] font-body uppercase tracking-[2px] text-primary mb-1.5">Comp Adjustments</div>
              <ul className="space-y-2">
                {result.compAnalysis.map((ca, i) => (
                  <li key={i} className="font-body text-sm">
                    <span className="font-semibold">{ca.address}</span> — adjusted to {fmt$(ca.adjustedValue)}
                    <div className="text-muted-foreground text-xs mt-0.5">{ca.rationale}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

function Input({
  label, value, onChange, placeholder, wide,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="block text-[10px] font-body uppercase tracking-[2px] text-muted-foreground mb-1">{label}</label>
      <input
        className="w-full px-3 py-2 border border-border bg-white text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function NumInput({
  label, value, onChange, step = 1,
}: { label: string; value: number | null | undefined; onChange: (v: number | null) => void; step?: number }) {
  return (
    <div>
      <label className="block text-[10px] font-body uppercase tracking-[2px] text-muted-foreground mb-1">{label}</label>
      <input
        type="number"
        step={step}
        className="w-full px-3 py-2 border border-border bg-white text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
      />
    </div>
  );
}
