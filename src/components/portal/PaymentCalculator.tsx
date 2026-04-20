import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ExternalLink, Check, Loader2, Plus, Pin, PinOff, Pencil, Trash2, GitCompare,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ScenarioInputs, SavedScenario, defaultInputs,
} from "@/lib/paymentCalc";
import ScenarioEditor from "./ScenarioEditor";
import ScenarioCompareDialog from "./ScenarioCompareDialog";

interface PaymentCalculatorProps {
  price: number;
  hoaFee?: number;
  propertyId?: string;
  userId?: string;
}

function rowToScenario(row: any): SavedScenario {
  return {
    id: row.id,
    name: row.name ?? "Default",
    is_pinned: !!row.is_pinned,
    offerPrice: Number(row.offer_price),
    downPct: Number(row.down_pct),
    rate: Number(row.rate),
    taxRate: Number(row.tax_rate),
    insurance: Number(row.insurance),
    hoa: Number(row.hoa),
    loanTerm: row.loan_term != null ? Number(row.loan_term) : 30,
  };
}

function scenarioToRow(s: SavedScenario, userId: string, propertyId: string) {
  return {
    id: s.id,
    user_id: userId,
    property_id: propertyId,
    name: s.name,
    is_pinned: s.is_pinned,
    offer_price: s.offerPrice,
    down_pct: s.downPct,
    rate: s.rate,
    tax_rate: s.taxRate,
    insurance: s.insurance,
    hoa: s.hoa,
    loan_term: s.loanTerm,
  };
}

export default function PaymentCalculator({ price, hoaFee = 0, propertyId, userId }: PaymentCalculatorProps) {
  const persistenceOn = !!(propertyId && userId);

  // Local-only fallback when no userId/propertyId (e.g., anon preview)
  const [localInputs, setLocalInputs] = useState<ScenarioInputs>(() => defaultInputs(price, hoaFee));

  // Persistent state
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [loaded, setLoaded] = useState(!persistenceOn);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [compareOpen, setCompareOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyIdsRef = useRef<Set<string>>(new Set());

  // ── Initial load ──
  useEffect(() => {
    if (!persistenceOn || loaded) return;
    (async () => {
      const { data, error } = await supabase
        .from("saved_estimates")
        .select("*")
        .eq("user_id", userId!)
        .eq("property_id", propertyId!);
      if (error) {
        toast.error("Couldn't load saved scenarios");
        setLoaded(true);
        return;
      }
      const list = (data ?? []).map(rowToScenario);
      if (list.length === 0) {
        // Create initial Default scenario from system defaults
        const seed = {
          ...defaultInputs(price, hoaFee),
          name: "Default",
          is_pinned: true,
        };
        const { data: inserted, error: insErr } = await supabase
          .from("saved_estimates")
          .insert([{
            user_id: userId!,
            property_id: propertyId!,
            name: seed.name,
            is_pinned: seed.is_pinned,
            offer_price: seed.offerPrice,
            down_pct: seed.downPct,
            rate: seed.rate,
            tax_rate: seed.taxRate,
            insurance: seed.insurance,
            hoa: seed.hoa,
            loan_term: seed.loanTerm,
          }])
          .select()
          .single();
        if (!insErr && inserted) {
          const s = rowToScenario(inserted);
          setScenarios([s]);
          setActiveId(s.id);
        }
      } else {
        const sorted = [...list].sort((a, b) =>
          a.is_pinned === b.is_pinned ? a.name.localeCompare(b.name) : a.is_pinned ? -1 : 1
        );
        setScenarios(sorted);
        const pinned = sorted.find(s => s.is_pinned) ?? sorted[0];
        setActiveId(pinned.id);
      }
      setLoaded(true);
    })();
  }, [persistenceOn, loaded, propertyId, userId, price, hoaFee]);

  // ── Debounced auto-save for dirty rows ──
  const flushDirty = useCallback(async () => {
    if (!persistenceOn || dirtyIdsRef.current.size === 0) return;
    const ids = Array.from(dirtyIdsRef.current);
    dirtyIdsRef.current.clear();
    setSaveStatus("saving");
    const rows = scenarios
      .filter(s => ids.includes(s.id))
      .map(s => scenarioToRow(s, userId!, propertyId!));
    if (rows.length === 0) return;
    const { error } = await supabase
      .from("saved_estimates")
      .upsert(rows as any, { onConflict: "id" });
    if (error) {
      setSaveStatus("idle");
      toast.error("Couldn't save scenario");
    } else {
      setSaveStatus("saved");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 1800);
    }
  }, [persistenceOn, scenarios, userId, propertyId]);

  const queueSave = useCallback((id: string) => {
    if (!persistenceOn) return;
    dirtyIdsRef.current.add(id);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(flushDirty, 600);
  }, [persistenceOn, flushDirty]);

  const updateScenario = useCallback((id: string, patch: Partial<SavedScenario>) => {
    setScenarios(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
    queueSave(id);
  }, [queueSave]);

  const updateInputs = useCallback((id: string, next: ScenarioInputs) => {
    updateScenario(id, next);
  }, [updateScenario]);

  // ── Scenario CRUD ──
  const createScenario = async (mode: "blank" | "duplicate") => {
    if (!persistenceOn) return;
    const baseInputs: ScenarioInputs = mode === "duplicate" && active
      ? { offerPrice: active.offerPrice, downPct: active.downPct, rate: active.rate, taxRate: active.taxRate, insurance: active.insurance, hoa: active.hoa, loanTerm: active.loanTerm }
      : defaultInputs(price, hoaFee);

    // Find a unique name
    const existingNames = new Set(scenarios.map(s => s.name.toLowerCase()));
    let candidate = mode === "duplicate" && active ? `${active.name} copy` : "Scenario";
    if (existingNames.has(candidate.toLowerCase())) {
      let i = 2;
      while (existingNames.has(`${candidate} ${i}`.toLowerCase())) i++;
      candidate = `${candidate} ${i}`;
    }

    const { data, error } = await supabase
      .from("saved_estimates")
      .insert([{
        user_id: userId!,
        property_id: propertyId!,
        name: candidate,
        is_pinned: false,
        offer_price: baseInputs.offerPrice,
        down_pct: baseInputs.downPct,
        rate: baseInputs.rate,
        tax_rate: baseInputs.taxRate,
        insurance: baseInputs.insurance,
        hoa: baseInputs.hoa,
        loan_term: baseInputs.loanTerm,
      }])
      .select()
      .single();
    if (error || !data) {
      toast.error("Couldn't create scenario");
      return;
    }
    const s = rowToScenario(data);
    setScenarios(prev => [...prev, s]);
    setActiveId(s.id);
    setRenamingId(s.id);
    setRenameDraft(s.name);
    toast.success(`Created "${s.name}"`);
  };

  const deleteScenario = async (id: string) => {
    if (!persistenceOn) return;
    if (scenarios.length <= 1) {
      toast.error("Can't delete the last scenario");
      return;
    }
    const target = scenarios.find(s => s.id === id);
    if (!target) return;
    const { error } = await supabase.from("saved_estimates").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete scenario");
      return;
    }
    const next = scenarios.filter(s => s.id !== id);
    // If we deleted the pinned one, pin the first remaining
    if (target.is_pinned && next.length > 0) {
      next[0] = { ...next[0], is_pinned: true };
      await supabase.from("saved_estimates").update({ is_pinned: true }).eq("id", next[0].id);
    }
    setScenarios(next);
    if (activeId === id) {
      setActiveId(next[0]?.id ?? "");
    }
    toast.success(`Deleted "${target.name}"`);
  };

  const togglePin = async (id: string) => {
    if (!persistenceOn) return;
    const target = scenarios.find(s => s.id === id);
    if (!target) return;
    if (target.is_pinned) {
      // Unpin
      const { error } = await supabase.from("saved_estimates").update({ is_pinned: false }).eq("id", id);
      if (!error) {
        setScenarios(prev => prev.map(s => s.id === id ? { ...s, is_pinned: false } : s));
      }
    } else {
      // Pin this one, unpin others (in this property)
      await supabase
        .from("saved_estimates")
        .update({ is_pinned: false })
        .eq("user_id", userId!)
        .eq("property_id", propertyId!);
      const { error } = await supabase.from("saved_estimates").update({ is_pinned: true }).eq("id", id);
      if (!error) {
        setScenarios(prev => prev.map(s => ({ ...s, is_pinned: s.id === id })));
      }
    }
  };

  const commitRename = async () => {
    if (!renamingId) return;
    const trimmed = renameDraft.trim();
    if (!trimmed) {
      setRenamingId(null);
      return;
    }
    // Uniqueness check (client-side; DB will also enforce)
    if (scenarios.some(s => s.id !== renamingId && s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A scenario with that name already exists");
      return;
    }
    const { error } = await supabase.from("saved_estimates").update({ name: trimmed }).eq("id", renamingId);
    if (error) {
      toast.error("Couldn't rename scenario");
      return;
    }
    setScenarios(prev => prev.map(s => s.id === renamingId ? { ...s, name: trimmed } : s));
    setRenamingId(null);
  };

  const resetActive = async () => {
    if (!active) return;
    const defaults = defaultInputs(price, hoaFee);
    updateInputs(active.id, defaults);
    // flush immediately
    await flushDirty();
    toast.success(`"${active.name}" reset to defaults`);
  };

  const active = scenarios.find(s => s.id === activeId);

  // Decide which inputs to render (persistent active scenario OR local fallback)
  const renderedInputs: ScenarioInputs = active ?? localInputs;
  const onRenderedChange = (next: ScenarioInputs) => {
    if (active) updateInputs(active.id, next);
    else setLocalInputs(next);
  };

  if (persistenceOn && !loaded) {
    return (
      <div className="mt-3 p-6 rounded border border-border bg-muted/30 flex items-center justify-center gap-2 text-xs font-body text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading payment estimator…
      </div>
    );
  }

  return (
    <div className="mt-3 p-3.5 rounded border border-border bg-muted/30">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold">
          Payment Estimator
        </div>
        {persistenceOn && scenarios.length >= 2 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCompareOpen(true)}
            className="h-7 text-[11px] font-body gap-1.5"
          >
            <GitCompare className="h-3 w-3" /> Compare
          </Button>
        )}
      </div>

      {/* Scenario tabs */}
      {persistenceOn && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {scenarios.map(s => {
            const isActive = s.id === activeId;
            const isRenaming = renamingId === s.id;
            return (
              <div
                key={s.id}
                className={`group inline-flex items-center gap-1 rounded-full border transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {isRenaming ? (
                  <Input
                    autoFocus
                    value={renameDraft}
                    onChange={e => setRenameDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="h-6 text-[11px] font-body px-2 py-0 w-32 border-0 focus-visible:ring-0"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    onDoubleClick={() => {
                      setRenamingId(s.id);
                      setRenameDraft(s.name);
                    }}
                    className="px-3 py-1 text-[11px] font-body font-semibold inline-flex items-center gap-1.5"
                    title="Click to switch · Double-click to rename"
                  >
                    {s.is_pinned && <Pin className="h-2.5 w-2.5 fill-current" />}
                    {s.name}
                  </button>
                )}
                {isActive && !isRenaming && (
                  <div className="flex items-center pr-1.5 gap-0.5">
                    <button
                      type="button"
                      onClick={() => { setRenamingId(s.id); setRenameDraft(s.name); }}
                      className="p-1 rounded hover:bg-background/60 text-muted-foreground hover:text-foreground"
                      title="Rename"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePin(s.id)}
                      className="p-1 rounded hover:bg-background/60 text-muted-foreground hover:text-foreground"
                      title={s.is_pinned ? "Unpin" : "Pin as default"}
                    >
                      {s.is_pinned ? <PinOff className="h-2.5 w-2.5" /> : <Pin className="h-2.5 w-2.5" />}
                    </button>
                    {scenarios.length > 1 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            title="Delete scenario"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{s.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes this scenario. Other scenarios for this property aren't affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteScenario(s.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-[11px] font-body text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
              >
                <Plus className="h-2.5 w-2.5" /> New scenario
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="font-body">
              <DropdownMenuItem onClick={() => createScenario("blank")} className="text-xs">
                Blank · system defaults
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => createScenario("duplicate")}
                disabled={!active}
                className="text-xs"
              >
                Duplicate "{active?.name ?? "current"}"
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Editor */}
      <ScenarioEditor inputs={renderedInputs} onChange={onRenderedChange} />

      {/* Actions row */}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <a
          href="https://equiforge.ai/try/payment"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold font-body text-primary hover:opacity-80 transition-opacity"
        >
          Advanced Calculator on EquiForge <ExternalLink className="h-3 w-3" />
        </a>
        {persistenceOn && active && (
          <div className="flex items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="text-[11px] font-body text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                >
                  Reset to defaults
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset "{active.name}" to defaults?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This resets the values in this scenario to the system defaults. The scenario itself stays — only its inputs are cleared.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetActive}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <span className="text-muted-foreground/50">·</span>
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-body text-muted-foreground"
              aria-live="polite"
            >
              {saveStatus === "saving" ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
              ) : saveStatus === "saved" ? (
                <><Check className="h-3 w-3 text-primary" /> <span className="text-primary font-semibold">Saved</span></>
              ) : (
                <span className="opacity-70">Auto-saved</span>
              )}
            </div>
          </div>
        )}
      </div>

      {persistenceOn && scenarios.length >= 2 && (
        <ScenarioCompareDialog
          open={compareOpen}
          onOpenChange={setCompareOpen}
          scenarios={scenarios}
          initialLeftId={activeId}
          initialRightId={scenarios.find(s => s.id !== activeId)?.id}
          onScenarioChange={updateScenario}
        />
      )}
    </div>
  );
}
