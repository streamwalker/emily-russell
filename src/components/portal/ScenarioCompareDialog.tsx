import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedScenario, ScenarioInputs, computeBreakdown, generateAmortization } from "@/lib/paymentCalc";
import ScenarioEditor from "./ScenarioEditor";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarios: SavedScenario[];
  initialLeftId?: string;
  initialRightId?: string;
  onScenarioChange: (id: string, next: ScenarioInputs) => void;
}

const fmtCurrency = (v: number) => `$${Math.round(v).toLocaleString()}`;

function DeltaStat({ label, a, b }: { label: string; a: number; b: number }) {
  const diff = b - a;
  const isZero = Math.abs(diff) < 0.5;
  const better = diff < 0;
  const cls = isZero ? "text-muted-foreground" : better ? "text-primary" : "text-destructive";
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
  const text = isZero ? "—" : `${sign}${fmtCurrency(Math.abs(diff))}`;
  return (
    <div className="flex flex-col items-center justify-center px-3 py-2 rounded border border-border bg-card">
      <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold mb-1">
        {label}
      </div>
      <div className={`text-sm font-display font-bold tabular-nums ${cls}`}>{text}</div>
      <div className="text-[9px] font-body text-muted-foreground tabular-nums mt-0.5">
        {fmtCurrency(a)} → {fmtCurrency(b)}
      </div>
    </div>
  );
}

export default function ScenarioCompareDialog({
  open, onOpenChange, scenarios, initialLeftId, initialRightId, onScenarioChange,
}: Props) {
  const firstId = scenarios[0]?.id ?? "";
  const secondId = scenarios[1]?.id ?? scenarios[0]?.id ?? "";

  const [leftId, setLeftId] = useState(initialLeftId ?? firstId);
  const [rightId, setRightId] = useState(initialRightId ?? secondId);

  useEffect(() => {
    if (!scenarios.find(s => s.id === leftId)) setLeftId(scenarios[0]?.id ?? "");
    if (!scenarios.find(s => s.id === rightId)) setRightId(scenarios[1]?.id ?? scenarios[0]?.id ?? "");
  }, [scenarios, leftId, rightId]);

  const left = scenarios.find(s => s.id === leftId);
  const right = scenarios.find(s => s.id === rightId);

  if (!left || !right) return null;

  const lb = computeBreakdown(left);
  const rb = computeBreakdown(right);
  const lAmort = generateAmortization(lb.loanAmount, left.rate, left.loanTerm);
  const rAmort = generateAmortization(rb.loanAmount, right.rate, right.loanTerm);
  const lTotalInterest = lAmort.reduce((s, d) => s + d.interest, 0);
  const rTotalInterest = rAmort.reduce((s, d) => s + d.interest, 0);

  const pickers: Array<{
    label: string;
    id: string;
    setId: (v: string) => void;
    scenario: SavedScenario;
  }> = [
    { label: "Scenario A", id: leftId, setId: setLeftId, scenario: left },
    { label: "Scenario B", id: rightId, setId: setRightId, scenario: right },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] w-[96vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Compare Payment Scenarios</DialogTitle>
          <DialogDescription className="font-body text-xs">
            Edit either side — changes autosave to your scenario.
          </DialogDescription>
        </DialogHeader>

        {/* Editors side-by-side (stack below lg) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          {pickers.map(({ label, id, setId, scenario }) => (
            <div key={label} className="rounded border border-border bg-muted/30 p-3 space-y-3">
              <div className="flex flex-col gap-1">
                <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold">
                  {label}
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
            </div>
          ))}
        </div>

        {/* Delta strip */}
        <div className="mt-4">
          <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold mb-2">
            Delta (B − A) · lower is better
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <DeltaStat label="Monthly payment" a={lb.monthly} b={rb.monthly} />
            <DeltaStat label="Principal & Interest" a={lb.pi} b={rb.pi} />
            <DeltaStat label="Down payment" a={lb.downAmt} b={rb.downAmt} />
            <DeltaStat label="Total interest" a={lTotalInterest} b={rTotalInterest} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
