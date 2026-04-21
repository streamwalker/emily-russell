import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Trophy, Download } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SavedScenario, ScenarioInputs, computeBreakdown, generateAmortization } from "@/lib/paymentCalc";
import ScenarioEditor from "./ScenarioEditor";
import ScenarioComparePrintView from "./ScenarioComparePrintView";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarios: SavedScenario[];
  initialLeftId?: string;
  initialRightId?: string;
  initialThirdId?: string;
  onScenarioChange: (id: string, next: ScenarioInputs) => void;
  propertyAddress?: string;
  propertyCity?: string;
  propertyCommunity?: string;
}

const fmtCurrency = (v: number) => `$${Math.round(v).toLocaleString()}`;

type SlotKey = "A" | "B" | "C";

function DeltaCell({ base, value, isBase }: { base: number; value: number; isBase?: boolean }) {
  if (isBase) {
    return (
      <div className="text-[9px] font-body text-muted-foreground tabular-nums mt-0.5">
        baseline
      </div>
    );
  }
  const diff = value - base;
  const isZero = Math.abs(diff) < 0.5;
  const better = diff < 0;
  const cls = isZero ? "text-muted-foreground" : better ? "text-primary" : "text-destructive";
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
  const pct = base === 0 ? null : Math.round((diff / base) * 100);
  const pctText = isZero ? "" : pct === null ? " (—)" : ` (${sign}${Math.abs(pct)}%)`;
  const text = isZero ? "—" : `${sign}${fmtCurrency(Math.abs(diff))}${pctText}`;
  return (
    <div className={`text-[10px] font-body font-semibold tabular-nums mt-0.5 ${cls}`}>
      vs A: {text}
    </div>
  );
}

function DeltaRow({
  label, values, baseIndex,
}: { label: string; values: number[]; baseIndex: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {values.map((v, i) => (
        <div key={i} className="flex flex-col items-center justify-center px-3 py-2 rounded border border-border bg-card">
          <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold mb-1">
            {label}
          </div>
          <div className="text-sm font-display font-bold tabular-nums">{fmtCurrency(v)}</div>
          <DeltaCell base={values[baseIndex]} value={v} isBase={i === baseIndex} />
        </div>
      ))}
    </div>
  );
}

export default function ScenarioCompareDialog({
  open, onOpenChange, scenarios, initialLeftId, initialRightId, initialThirdId, onScenarioChange,
  propertyAddress, propertyCity, propertyCommunity,
}: Props) {
  const firstId = scenarios[0]?.id ?? "";
  const secondId = scenarios[1]?.id ?? firstId;
  const thirdId = scenarios[2]?.id ?? secondId;

  const [leftId, setLeftId] = useState(initialLeftId ?? firstId);
  const [rightId, setRightId] = useState(initialRightId ?? secondId);
  const [extraId, setExtraId] = useState(initialThirdId ?? thirdId);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!scenarios.find(s => s.id === leftId)) setLeftId(scenarios[0]?.id ?? "");
    if (!scenarios.find(s => s.id === rightId)) setRightId(scenarios[1]?.id ?? scenarios[0]?.id ?? "");
    if (!scenarios.find(s => s.id === extraId)) setExtraId(scenarios[2]?.id ?? scenarios[1]?.id ?? scenarios[0]?.id ?? "");
  }, [scenarios, leftId, rightId, extraId]);

  const left = scenarios.find(s => s.id === leftId);
  const right = scenarios.find(s => s.id === rightId);
  const extra = scenarios.find(s => s.id === extraId);

  if (!left || !right || !extra) return null;

  const slots: Array<{
    key: SlotKey;
    label: string;
    id: string;
    setId: (v: string) => void;
    scenario: SavedScenario;
  }> = [
    { key: "A", label: "Scenario A", id: leftId, setId: setLeftId, scenario: left },
    { key: "B", label: "Scenario B", id: rightId, setId: setRightId, scenario: right },
    { key: "C", label: "Scenario C", id: extraId, setId: setExtraId, scenario: extra },
  ];

  const orderedScenarios = slots.map(s => s.scenario);
  const breakdowns = orderedScenarios.map(computeBreakdown);
  const totalInterests = orderedScenarios.map((s, i) =>
    generateAmortization(breakdowns[i].loanAmount, s.rate, s.loanTerm)
      .reduce((sum, d) => sum + d.interest, 0)
  );
  const totalCosts = orderedScenarios.map((_, i) => breakdowns[i].downAmt + breakdowns[i].loanAmount + totalInterests[i]);

  const minCost = Math.min(...totalCosts);
  const maxCost = Math.max(...totalCosts);
  const tied = maxCost - minCost < 1;
  const winnerIndex = tied ? -1 : totalCosts.indexOf(minCost);

  const handleExportPdf = async () => {
    const toastId = toast.loading("Preparing PDF…");
    setIsExporting(true);

    // Fetch map thumbnail (non-fatal if it fails)
    let mapDataUrl: string | undefined;
    if (propertyAddress) {
      try {
        const { data, error } = await supabase.functions.invoke("get-map-thumbnail", {
          body: { address: propertyAddress, city: propertyCity },
        });
        if (!error && data?.dataUrl) mapDataUrl = data.dataUrl;
      } catch (e) {
        console.warn("Map thumbnail fetch failed", e);
      }
    }

    // Mount print view offscreen
    const container = document.createElement("div");
    container.style.cssText =
      "position:fixed;left:-10000px;top:0;width:1500px;background:#ffffff;z-index:-1;";
    document.body.appendChild(container);
    const root = createRoot(container);

    try {
      root.render(
        <ScenarioComparePrintView
          scenarios={orderedScenarios}
          winnerIndex={winnerIndex}
          totalCosts={totalCosts}
          totalInterests={totalInterests}
          propertyAddress={propertyAddress}
          propertyCity={propertyCity}
          propertyCommunity={propertyCommunity}
          mapDataUrl={mapDataUrl}
        />
      );

      // Wait for fonts and render to settle
      if ((document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => setTimeout(r, 250));

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: 1500,
        width: 1500,
      });

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 24;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      let drawW = usableWidth;
      let drawH = (canvas.height / canvas.width) * usableWidth;
      if (drawH > usableHeight) {
        drawH = usableHeight;
        drawW = (canvas.width / canvas.height) * usableHeight;
      }
      const xPt = margin + (usableWidth - drawW) / 2;
      const yPt = margin + (usableHeight - drawH) / 2;

      doc.addImage(canvas.toDataURL("image/png"), "PNG", xPt, yPt, drawW, drawH);
      doc.save(`scenario-comparison-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Comparison PDF downloaded", { id: toastId });
    } catch (err) {
      console.error("PDF export failed", err);
      toast.error("Could not export PDF", { id: toastId });
    } finally {
      try { root.unmount(); } catch {}
      try { document.body.removeChild(container); } catch {}
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1500px] w-[97vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="font-display">Compare Payment Scenarios</DialogTitle>
              <DialogDescription className="font-body text-xs">
                Edit any column — changes autosave. Compare up to three scenarios side-by-side.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="font-body text-xs gap-1.5 shrink-0 mr-6"
            >
              <Download className="h-3.5 w-3.5" />
              {isExporting ? "Exporting…" : "Export PDF"}
            </Button>
          </div>
        </DialogHeader>

        {/* Editors side-by-side (stack below lg) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
          {slots.map(({ key, label, id, setId, scenario }, i) => {
            const isWinner = i === winnerIndex;
            return (
              <div
                key={key}
                className={`rounded border bg-muted/30 p-3 space-y-3 transition-colors ${
                  isWinner ? "border-primary ring-1 ring-primary/30" : "border-border"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold">
                      {label}
                    </div>
                    {isWinner && (
                      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[1.5px] text-primary font-body font-semibold bg-primary/10 px-1.5 py-0.5 rounded">
                        <Trophy className="h-2.5 w-2.5" /> Lower total cost
                      </span>
                    )}
                  </div>
                  <Select value={id} onValueChange={setId}>
                    <SelectTrigger className="h-8 text-xs font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.map(s => (
                        <SelectItem key={s.id} value={s.id} className="text-xs font-body">
                          {s.name}{s.is_pinned ? " · pinned" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ScenarioEditor
                  key={scenario.id}
                  inputs={scenario}
                  onChange={(next) => onScenarioChange(scenario.id, next)}
                  compact
                />
                <div className="text-[10px] text-muted-foreground text-center pt-1 border-t border-border font-body">
                  Total cost of loan:{" "}
                  <span className={`font-semibold tabular-nums ${isWinner ? "text-primary" : "text-foreground"}`}>
                    {fmtCurrency(totalCosts[i])}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delta strip — A is baseline */}
        <div className="mt-4 space-y-2">
          <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold">
            Comparison · Scenario A is baseline · lower is better
          </div>
          <div className="space-y-2">
            <DeltaRow label="Monthly payment" values={breakdowns.map(b => b.monthly)} baseIndex={0} />
            <DeltaRow label="Principal & Interest" values={breakdowns.map(b => b.pi)} baseIndex={0} />
            <DeltaRow label="Down payment" values={breakdowns.map(b => b.downAmt)} baseIndex={0} />
            <DeltaRow label="Total interest" values={totalInterests} baseIndex={0} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
