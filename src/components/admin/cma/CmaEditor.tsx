import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Save, Plus, Trash2, ClipboardPaste, Download, Wand2, RefreshCw, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { buildCmaPdf, type CmaSubject, type CmaComp, type CmaResult } from "@/lib/cmaPdf";
import type { CmaReportRow } from "./CmaWorkspace";

function normAddressKey(a: string): string {
  return (a || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}


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
  yearBuilt: null,
  builder: "",
  priorOwners: null,
  listingAgent: "",
  listingBroker: "",
  everRented: "unknown",
  insuranceClaims: "",
});

// When confidence is strong, prefer the new value; otherwise only fill if existing is blank.
function pickField<T>(existing: T, incoming: T | null | undefined, strong: boolean): T {
  const blank = existing == null || existing === "" || (typeof existing === "number" && existing === 0);
  if (incoming == null || incoming === "") return existing;
  if (strong || blank) return incoming as T;
  return existing;
}



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
  const [subjectSources, setSubjectSources] = useState<Record<string, string>>(
    (initial?.subject_sources as Record<string, string>) || {},
  );
  const [reportId, setReportId] = useState<string | null>(initial?.id || null);
  const [homeId, setHomeId] = useState<string | null>(initial?.home_id || null);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(initial ? new Date() : null);
  const [openDetails, setOpenDetails] = useState<Record<number, boolean>>({});
  const saveTimer = useRef<number | null>(null);
  const hydratedAddressKey = useRef<string>(normAddressKey(initial?.address || ""));
  const skipNextSave = useRef<boolean>(true); // skip initial mount save


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

      const sMeta = data?.subjectMeta;
      const cMeta = data?.compsMeta;

      if ((mode === "subject" || mode === "both")) {
        if (data?.subject && sMeta?.accepted) {
          // Only overwrite fields when (a) currently empty, or (b) confidence is strong (score >= 6)
          const strong = (sMeta?.score ?? 0) >= 6;
          setSubject((s) => ({
            ...s,
            beds: pickField(s.beds, data.subject.beds, strong),
            baths: pickField(s.baths, data.subject.baths, strong),
            sqft: pickField(s.sqft, data.subject.sqft, strong),
            yearBuilt: pickField(s.yearBuilt, data.subject.yearBuilt, strong),
            lotSize: pickField(s.lotSize, data.subject.lotSize, strong),
            builder: pickField(s.builder, data.subject.builder, strong),
            condition: pickField(s.condition, data.subject.condition, strong),
          }));
          // Merge per-field source URLs (only for fields we actually accepted)
          const incomingSrc = (data.subject.sources && typeof data.subject.sources === "object") ? data.subject.sources : {};
          setSubjectSources((prev) => {
            const next = { ...prev };
            for (const k of ["beds","baths","sqft","yearBuilt","lotSize","builder","condition"]) {
              const v = data.subject[k];
              if (v != null && v !== "" && typeof incomingSrc[k] === "string" && incomingSrc[k]) {
                next[k] = incomingSrc[k];
              }
            }
            return next;
          });
          toast.success(
            `Subject updated — ${sMeta.fields}/7 fields, confidence ${sMeta.score}/10` +
              (strong ? "" : " (only filled blanks; existing values kept)"),
          );

        } else if (mode === "subject" || (mode === "both" && !data?.subject)) {
          toast.warning(
            `Subject result was too thin to trust — kept your existing values${
              sMeta ? ` (${sMeta.fields}/7 fields, addressMatch=${sMeta.addressMatch})` : ""
            }`,
          );
        }
      }

      if (mode === "comps" || mode === "both") {
        const newComps: any[] = Array.isArray(data?.comps) ? data.comps : [];
        const existingValid = comps.filter((c) => c.address && c.salePrice > 0).length;
        const sufficient = cMeta?.sufficient ?? newComps.length >= 3;
        // Require: ≥3 comps AND at least as many as we already have (so a 1-comp result never wipes 5 good comps)
        const safeToReplace = sufficient && newComps.length >= Math.max(3, Math.min(existingValid, 5));

        if (newComps.length && safeToReplace) {
          const mapped: CmaComp[] = newComps.map((c: any) => ({
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
            sourceUrl: typeof c.sourceUrl === "string" ? c.sourceUrl : null,
            yearBuilt: c.yearBuilt ?? null,
            builder: c.builder || "",
            priorOwners: c.priorOwners ?? null,
            listingAgent: c.listingAgent || "",
            listingBroker: c.listingBroker || "",
            everRented: c.everRented === "yes" || c.everRented === "no" ? c.everRented : "unknown",
            insuranceClaims: c.insuranceClaims || "",
          }));

          setComps(mapped);
          toast.success(
            `Replaced comps — ${mapped.length} kept of ${cMeta?.raw ?? mapped.length} found`,
          );
        } else if (newComps.length) {
          toast.warning(
            `Only ${newComps.length} usable comp${newComps.length === 1 ? "" : "s"} found (need ≥${Math.max(3, Math.min(existingValid, 5))}). Kept your existing comps — widen radius or window.`,
          );
        } else {
          toast.warning("No usable comps after filters — kept your existing comps.");
        }
      }

      setAutoLog(Array.isArray(data?.log) ? data.log : []);


    } catch (e: any) {
      console.error(e);
      toast.error("Auto-fill failed: " + (e?.message || String(e)));
    } finally {
      setAutoFilling(null);
    }
  };


  // ─────────────────────────────────────────────────────────
  // Auto-save: debounced upsert of homes + cma_reports
  // ─────────────────────────────────────────────────────────
  const persistNow = useCallback(async () => {
    const addr = subject.address?.trim();
    if (!addr || addr.length < 5) return;
    setAutoSaveState("saving");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const key = normAddressKey(addr);
      const validComps = comps.filter((c) => c.address && c.salePrice > 0);

      // 1) Upsert homes (canonical record per address)
      const { data: homeRow, error: homeErr } = await supabase
        .from("homes")
        .upsert(
          {
            address: addr,
            address_key: key,
            beds: subject.beds ?? null,
            baths: subject.baths ?? null,
            sqft: subject.sqft ?? null,
            year_built: subject.yearBuilt ?? null,
            lot_size: subject.lotSize || null,
            builder: subject.builder || null,
            condition: subject.condition || null,
            sources: subjectSources || {},
            last_autofill_at: Object.keys(subjectSources || {}).length ? new Date().toISOString() : null,
            created_by: user.id,
          },
          { onConflict: "address_key" },
        )
        .select("id")
        .single();
      if (homeErr) throw homeErr;
      const newHomeId = homeRow?.id || null;
      if (newHomeId && newHomeId !== homeId) setHomeId(newHomeId);

      // 2) Upsert cma_reports — update existing or insert new
      const reportPayload: any = {
        created_by: user.id,
        address: addr,
        subject_data: subject as any,
        comps_data: validComps as any,
        subject_sources: subjectSources || {},
        notes: notes || null,
        home_id: newHomeId,
        status: result ? "generated" : "draft",
      };

      if (reportId) {
        const { error: upErr } = await supabase.from("cma_reports").update(reportPayload).eq("id", reportId);
        if (upErr) throw upErr;
      } else {
        const { data: ins, error: insErr } = await supabase
          .from("cma_reports")
          .insert(reportPayload)
          .select("id")
          .single();
        if (insErr) throw insErr;
        if (ins?.id) setReportId(ins.id);
      }

      setLastSavedAt(new Date());
      setAutoSaveState("saved");
    } catch (e: any) {
      console.error("auto-save failed", e);
      setAutoSaveState("error");
    }
  }, [subject, comps, notes, subjectSources, reportId, homeId, result]);

  // Debounced trigger on edits
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (!subject.address || subject.address.trim().length < 5) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      persistNow();
    }, 1000);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [subject, comps, notes, subjectSources, persistNow]);

  // Hydrate from existing homes record when the address changes/blurs to a new value
  useEffect(() => {
    const key = normAddressKey(subject.address);
    if (!key || key.length < 5) return;
    if (key === hydratedAddressKey.current) return;
    // address changed — try hydrate from homes
    let cancelled = false;
    (async () => {
      const { data, error: hErr } = await supabase
        .from("homes")
        .select("id, beds, baths, sqft, year_built, lot_size, builder, condition, sources")
        .eq("address_key", key)
        .maybeSingle();
      if (cancelled || hErr || !data) {
        hydratedAddressKey.current = key;
        return;
      }
      hydratedAddressKey.current = key;
      // Only fill blanks — never clobber what the user has typed
      skipNextSave.current = true;
      setSubject((s) => ({
        ...s,
        beds: s.beds ?? data.beds,
        baths: s.baths ?? data.baths,
        sqft: s.sqft ?? data.sqft,
        yearBuilt: s.yearBuilt ?? data.year_built,
        lotSize: s.lotSize || data.lot_size || "",
        builder: s.builder || data.builder || "",
        condition: s.condition || data.condition || "",
      }));
      setSubjectSources((prev) => ({ ...((data.sources as any) || {}), ...prev }));
      setHomeId(data.id);
      toast.success("Loaded saved details for this address");
    })();
    return () => { cancelled = true; };
  }, [subject.address]);

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
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-base font-semibold">Subject Property</h3>
            <AutoSavePill state={autoSaveState} lastSavedAt={lastSavedAt} onRetry={persistNow} />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => runAutoFill("subject")}
              disabled={!!autoFilling || !subject.address}
              className="flex items-center gap-1.5 text-xs font-body uppercase tracking-[2px] text-primary hover:text-primary/80 px-3 py-1.5 border border-primary/40 disabled:opacity-40"
              title="Look up beds/baths/sqft/year/builder from web sources"
            >
              {autoFilling === "subject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              Auto-Fill Subject
            </button>
            <button
              onClick={() => runAutoFill("both")}
              disabled={!!autoFilling || !subject.address}
              className="flex items-center gap-1.5 text-xs font-body uppercase tracking-[2px] bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 border border-primary disabled:opacity-40"
              title="Subject details + recent comps in one shot"
            >
              {autoFilling === "both" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Auto-Fill Everything
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Address" value={subject.address} onChange={(v) => updateSubject("address", v)} placeholder="3850 Millbrook Way, San Antonio, TX 78258" wide />
          <NumInput label="Beds" value={subject.beds} onChange={(v) => updateSubject("beds", v)} sourceUrl={subjectSources.beds} />
          <NumInput label="Baths" value={subject.baths} onChange={(v) => updateSubject("baths", v)} step={0.5} sourceUrl={subjectSources.baths} />
          <NumInput label="Square Feet" value={subject.sqft} onChange={(v) => updateSubject("sqft", v)} sourceUrl={subjectSources.sqft} />
          <NumInput label="Year Built" value={subject.yearBuilt} onChange={(v) => updateSubject("yearBuilt", v)} sourceUrl={subjectSources.yearBuilt} />
          <Input label="Lot Size" value={subject.lotSize || ""} onChange={(v) => updateSubject("lotSize", v)} placeholder="0.25 acres" sourceUrl={subjectSources.lotSize} />
          <Input label="Builder" value={subject.builder || ""} onChange={(v) => updateSubject("builder", v)} placeholder="Lennar, KB Home, etc." sourceUrl={subjectSources.builder} />
          <Input label="Condition" value={subject.condition || ""} onChange={(v) => updateSubject("condition", v)} placeholder="Updated kitchen, original baths" wide sourceUrl={subjectSources.condition} />
        </div>
        {Object.keys(subjectSources).length > 0 && (
          <div className="mt-3 p-3 bg-cream/30 border border-border">
            <div className="text-[10px] font-body uppercase tracking-[2px] text-muted-foreground mb-2">
              Field sources (auto-fill)
            </div>
            <ul className="space-y-1 text-[11px] font-body">
              {Object.entries(subjectSources).map(([field, url]) => {
                let host = url;
                try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
                const labelMap: Record<string, string> = {
                  beds: "Beds", baths: "Baths", sqft: "Sqft", yearBuilt: "Year Built",
                  lotSize: "Lot Size", builder: "Builder", condition: "Condition",
                };
                return (
                  <li key={field} className="flex items-center gap-2">
                    <span className="font-semibold text-charcoal min-w-[80px]">{labelMap[field] || field}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate" title={url}>
                      {host}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <p className="font-body text-[11px] text-muted-foreground mt-3">
          Auto-fill scrapes public web sources (Zillow, Redfin, county records). Always verify — every field is editable.
        </p>

      </section>

      {/* Comps */}
      <section className="bg-white border border-border p-5">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h3 className="font-display text-base font-semibold">Comparable Sales</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => runAutoFill("comps")}
              disabled={!!autoFilling || !subject.address}
              className="flex items-center gap-1.5 text-xs font-body uppercase tracking-[2px] text-primary hover:text-primary/80 px-3 py-1.5 border border-primary/40 disabled:opacity-40"
            >
              {autoFilling === "comps" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Find Comps
            </button>
            <button onClick={pasteComps} className="flex items-center gap-1.5 text-xs font-body uppercase tracking-[2px] text-muted-foreground hover:text-primary px-3 py-1.5 border border-border">
              <ClipboardPaste className="w-3.5 h-3.5" /> Paste CSV
            </button>
            <button onClick={addComp} className="flex items-center gap-1.5 text-xs font-body uppercase tracking-[2px] text-primary hover:text-primary/80 px-3 py-1.5 border border-primary/30">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-cream/30 border border-border">
          <div>
            <div className="flex justify-between text-[10px] font-body uppercase tracking-[2px] text-muted-foreground mb-1">
              <span>Radius</span>
              <span className="text-primary font-semibold">{radiusMiles.toFixed(2)} mi</span>
            </div>
            <input
              type="range" min={0.25} max={2} step={0.25}
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <div className="flex justify-between text-[10px] font-body uppercase tracking-[2px] text-muted-foreground mb-1">
              <span>Window</span>
              <span className="text-primary font-semibold">{monthsBack} months</span>
            </div>
            <input
              type="range" min={3} max={24} step={1}
              value={monthsBack}
              onChange={(e) => setMonthsBack(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between gap-3 pt-2 border-t border-border/60">
            <p className="font-body text-[11px] text-muted-foreground">
              Adjusted the sliders? Rerun to pull fresh results with the new radius and window.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => runAutoFill("comps")}
                disabled={!!autoFilling || !subject.address}
                className="flex items-center gap-1.5 text-xs font-body uppercase tracking-[2px] text-primary hover:text-primary/80 px-3 py-1.5 border border-primary/40 disabled:opacity-40 bg-white"
              >
                {autoFilling === "comps" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Rerun Comps
              </button>
              <button
                onClick={() => runAutoFill("both")}
                disabled={!!autoFilling || !subject.address}
                className="flex items-center gap-1.5 text-xs font-body uppercase tracking-[2px] bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 border border-primary disabled:opacity-40"
              >
                {autoFilling === "both" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Rerun Subject + Comps
              </button>
            </div>
          </div>
        </div>


        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 mb-1 px-1">
          <div className="col-span-4 text-[10px] font-body uppercase tracking-[2px] text-muted-foreground">Address</div>
          <div className="col-span-2 text-[10px] font-body uppercase tracking-[2px] text-muted-foreground">Sale Price</div>
          <div className="col-span-1 text-[10px] font-body uppercase tracking-[2px] text-muted-foreground">Sqft</div>
          <div className="col-span-1 text-[10px] font-body uppercase tracking-[2px] text-muted-foreground">Bd</div>
          <div className="col-span-1 text-[10px] font-body uppercase tracking-[2px] text-muted-foreground">Ba</div>
          <div className="col-span-2 text-[10px] font-body uppercase tracking-[2px] text-muted-foreground">Sale Date</div>
          <div className="col-span-1" />
        </div>

        <div className="space-y-2">
          {comps.map((c, i) => {
            let srcHost = "";
            if (c.sourceUrl) {
              try { srcHost = new URL(c.sourceUrl).hostname.replace(/^www\./, ""); } catch { srcHost = c.sourceUrl; }
            }
            const hasDetails = !!(
              c.yearBuilt || c.builder || c.priorOwners != null ||
              c.listingAgent || c.listingBroker ||
              (c.everRented && c.everRented !== "unknown") ||
              c.insuranceClaims
            );
            const isOpen = openDetails[i] ?? hasDetails;
            return (
            <div key={i} className="space-y-1 border-b border-border/40 pb-2">
              <div className="grid grid-cols-12 gap-2 items-center text-sm">
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

              <div className="flex items-center gap-3 flex-wrap pl-1">
                <button
                  type="button"
                  onClick={() => setOpenDetails((m) => ({ ...m, [i]: !isOpen }))}
                  className="text-[10px] font-body uppercase tracking-[2px] text-muted-foreground hover:text-primary"
                >
                  {isOpen ? "▾ Details" : "▸ Details"}
                </button>
                {c.sourceUrl && (
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-body text-primary hover:underline"
                    title={c.sourceUrl}
                  >
                    <ExternalLink className="w-3 h-3" />
                    source: {srcHost}
                  </a>
                )}
              </div>

              {isOpen && (
                <div className="grid grid-cols-12 gap-2 pt-1 pb-1">
                  <input
                    className="col-span-2 px-2 py-1.5 border border-border bg-white text-sm"
                    placeholder="Year built"
                    type="number"
                    value={c.yearBuilt ?? ""}
                    onChange={(e) => updateComp(i, { yearBuilt: e.target.value ? parseInt(e.target.value) : null })}
                  />
                  <input
                    className="col-span-3 px-2 py-1.5 border border-border bg-white text-sm"
                    placeholder="Builder"
                    value={c.builder || ""}
                    onChange={(e) => updateComp(i, { builder: e.target.value })}
                  />
                  <input
                    className="col-span-2 px-2 py-1.5 border border-border bg-white text-sm"
                    placeholder="# Prior owners"
                    type="number"
                    value={c.priorOwners ?? ""}
                    onChange={(e) => updateComp(i, { priorOwners: e.target.value ? parseInt(e.target.value) : null })}
                  />
                  <input
                    className="col-span-3 px-2 py-1.5 border border-border bg-white text-sm"
                    placeholder="Listing agent"
                    value={c.listingAgent || ""}
                    onChange={(e) => updateComp(i, { listingAgent: e.target.value })}
                  />
                  <input
                    className="col-span-2 px-2 py-1.5 border border-border bg-white text-sm"
                    placeholder="Listing broker"
                    value={c.listingBroker || ""}
                    onChange={(e) => updateComp(i, { listingBroker: e.target.value })}
                  />
                  <div className="col-span-3 flex items-center gap-2">
                    <label className="text-[10px] font-body uppercase tracking-[2px] text-muted-foreground whitespace-nowrap">
                      Ever Rented
                    </label>
                    <select
                      className="flex-1 px-2 py-1.5 border border-border bg-white text-sm"
                      value={c.everRented || "unknown"}
                      onChange={(e) => updateComp(i, { everRented: e.target.value as "yes" | "no" | "unknown" })}
                    >
                      <option value="unknown">Unknown</option>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <textarea
                    className="col-span-9 px-2 py-1.5 border border-border bg-white text-sm"
                    placeholder="Major insurance claims (fire, water damage, hail, etc.)"
                    rows={2}
                    value={c.insuranceClaims || ""}
                    onChange={(e) => updateComp(i, { insuranceClaims: e.target.value })}
                  />
                </div>
              )}
            </div>
          );})}
        </div>


        <p className="font-body text-[11px] text-muted-foreground mt-3">
          Tip: paste a tab- or comma-separated list as <em>address, price, sqft, bd, ba, date</em>.
        </p>
        {autoLog.length > 0 && (
          <details className="mt-3 text-[11px] font-body text-muted-foreground">
            <summary className="cursor-pointer hover:text-primary">Auto-fill log ({autoLog.length})</summary>
            <ul className="mt-2 space-y-0.5 pl-4 list-disc">
              {autoLog.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </details>
        )}
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

function SourceBadge({ url }: { url?: string | null }) {
  if (!url) return null;
  let host = url;
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Source: ${url}`}
      aria-label={`Source: ${url}`}
      className="inline-flex items-center gap-0.5 text-[9px] font-body text-primary hover:underline normal-case tracking-normal"
    >
      <ExternalLink className="w-2.5 h-2.5" />
      <span className="truncate max-w-[120px]">{host}</span>
    </a>
  );
}

function FieldLabel({ label, sourceUrl }: { label: string; sourceUrl?: string | null }) {
  return (
    <label className="flex items-center justify-between gap-2 text-[10px] font-body uppercase tracking-[2px] text-muted-foreground mb-1">
      <span>{label}</span>
      <SourceBadge url={sourceUrl} />
    </label>
  );
}

function Input({
  label, value, onChange, placeholder, wide, sourceUrl,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean; sourceUrl?: string | null }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <FieldLabel label={label} sourceUrl={sourceUrl} />
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
  label, value, onChange, step = 1, sourceUrl,
}: { label: string; value: number | null | undefined; onChange: (v: number | null) => void; step?: number; sourceUrl?: string | null }) {
  return (
    <div>
      <FieldLabel label={label} sourceUrl={sourceUrl} />
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

function AutoSavePill({
  state, lastSavedAt, onRetry,
}: {
  state: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  onRetry: () => void;
}) {
  if (state === "idle" && !lastSavedAt) return null;
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-[2px] text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (state === "error") {
    return (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-[2px] text-destructive hover:underline"
      >
        Unsaved — retry
      </button>
    );
  }
  const stamp = lastSavedAt ? lastSavedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-[2px] text-sage">
      <Check className="w-3 h-3" /> Saved {stamp && `· ${stamp}`}
    </span>
  );
}
