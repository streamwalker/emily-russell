import { useEffect, useRef, useState } from "react";
import { Trophy, Download } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SavedScenario, ScenarioInputs, computeBreakdown, generateAmortization } from "@/lib/paymentCalc";
import ScenarioEditor from "./ScenarioEditor";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarios: SavedScenario[];
  initialLeftId?: string;
  initialRightId?: string;
  initialThirdId?: string;
  onScenarioChange: (id: string, next: ScenarioInputs) => void;
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
  const text = isZero ? "—" : `${sign}${fmtCurrency(Math.abs(diff))}`;
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
}: Props) {
  const firstId = scenarios[0]?.id ?? "";
  const secondId = scenarios[1]?.id ?? firstId;
  const thirdId = scenarios[2]?.id ?? secondId;

  const [leftId, setLeftId] = useState(initialLeftId ?? firstId);
  const [rightId, setRightId] = useState(initialRightId ?? secondId);
  const [extraId, setExtraId] = useState(initialThirdId ?? thirdId);

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

  const breakdowns = slots.map(s => computeBreakdown(s.scenario));
  const totalInterests = slots.map((s, i) =>
    generateAmortization(breakdowns[i].loanAmount, s.scenario.rate, s.scenario.loanTerm)
      .reduce((sum, d) => sum + d.interest, 0)
  );
  const totalCosts = slots.map((_, i) => breakdowns[i].downAmt + breakdowns[i].loanAmount + totalInterests[i]);

  // Winner = lowest total cost. Tie if all within $1.
  const minCost = Math.min(...totalCosts);
  const maxCost = Math.max(...totalCosts);
  const tied = maxCost - minCost < 1;
  const winnerIndex = tied ? -1 : totalCosts.indexOf(minCost);

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const now = new Date().toLocaleString();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Payment Scenario Comparison", 40, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Generated ${now}`, 40, 66);
      doc.setTextColor(0);

      const headers = ["Metric", ...slots.map((s, i) => {
        const tag = i === winnerIndex ? "  ★ Lower total cost" : "";
        return `${s.label}: ${s.scenario.name}${tag}`;
      })];

      const fmt = (v: number) => fmtCurrency(v);
      const pct = (v: number) => `${v}%`;

      const rows: (string | number)[][] = [
        ["Offer price", ...slots.map(s => fmt(s.scenario.offerPrice))],
        ["Down payment %", ...slots.map(s => pct(s.scenario.downPct))],
        ["Down payment $", ...breakdowns.map(b => fmt(b.downAmt))],
        ["Loan amount", ...breakdowns.map(b => fmt(b.loanAmount))],
        ["Interest rate", ...slots.map(s => pct(s.scenario.rate))],
        ["Loan term (years)", ...slots.map(s => String(s.scenario.loanTerm))],
        ["Property tax rate", ...slots.map(s => pct(s.scenario.taxRate))],
        ["Monthly taxes", ...breakdowns.map(b => fmt(b.monthlyTaxes))],
        ["Monthly insurance", ...slots.map(s => fmt(s.scenario.insurance))],
        ["Monthly HOA", ...slots.map(s => fmt(s.scenario.hoa))],
        ["Principal & Interest", ...breakdowns.map(b => fmt(b.pi))],
        ["Monthly payment (PITI+HOA)", ...breakdowns.map(b => fmt(b.monthly))],
        ["Total interest paid", ...totalInterests.map(fmt)],
        ["Total cost of loan", ...totalCosts.map(fmt)],
      ];

      autoTable(doc, {
        startY: 84,
        head: [headers],
        body: rows,
        styles: { font: "helvetica", fontSize: 9, cellPadding: 6, halign: "right" },
        headStyles: { fillColor: [40, 40, 40], textColor: 255, halign: "center", fontStyle: "bold" },
        columnStyles: { 0: { halign: "left", fontStyle: "bold", fillColor: [245, 245, 245] } },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index >= 1) {
            const colSlot = data.column.index - 1;
            if (colSlot === winnerIndex && data.row.index === rows.length - 1) {
              data.cell.styles.fillColor = [232, 244, 232];
              data.cell.styles.textColor = [20, 90, 40];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        margin: { left: 40, right: 40 },
        tableWidth: pageWidth - 80,
      });

      doc.save(`scenario-comparison-${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success("Comparison PDF downloaded");
    } catch (err) {
      console.error("PDF export failed", err);
      toast.error("Could not export PDF");
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
              className="font-body text-xs gap-1.5 shrink-0 mr-6"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
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
