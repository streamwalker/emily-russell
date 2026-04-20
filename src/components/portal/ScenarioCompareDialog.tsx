import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedScenario, computeBreakdown, generateAmortization } from "@/lib/paymentCalc";
import ScenarioEditor from "./ScenarioEditor";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarios: SavedScenario[];
  initialLeftId?: string;
  initialRightId?: string;
  onScenarioChange: (id: string, partial: Partial<SavedScenario>) => void;
}

function StatRow({ label, a, b, format = (v: number) => `$${Math.round(v).toLocaleString()}` }: {
  label: string; a: number; b: number; format?: (v: number) => string;
}) {
  const diff = b - a;
  const better = diff < 0; // lower cost = better for monthly/interest comparisons
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
      <div className="text-[11px] font-body text-muted-foreground">{label}</div>
      <div className="text-xs font-body font-semibold text-foreground tabular-nums text-right">{format(a)}</div>
      <div className="text-xs font-body font-semibold text-foreground tabular-nums text-right">{format(b)}</div>
      <div className={`text-[10px] font-body tabular-nums text-right min-w-[60px] ${
        diff === 0 ? "text-muted-foreground" : better ? "text-primary" : "text-destructive"
      }`}>
        {diff === 0 ? "—" : `${sign}${format(Math.abs(diff)).replace("$", "$")}`}
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1400px] w-[95vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Compare Payment Scenarios</DialogTitle>
          <DialogDescription className="font-body text-xs">
            Edit either scenario in place — changes auto-save to your saved scenarios.
          </DialogDescription>
        </DialogHeader>

        {/* Diff summary */}
        <div className="rounded border border-border bg-muted/30 p-3 mb-2">
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 pb-2 mb-1 border-b border-border">
            <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold">Metric</div>
            <div className="text-[10px] font-body font-semibold text-foreground text-right truncate max-w-[140px]">{left.name}</div>
            <div className="text-[10px] font-body font-semibold text-foreground text-right truncate max-w-[140px]">{right.name}</div>
            <div className="text-[10px] font-body font-semibold text-muted-foreground text-right min-w-[60px]">Δ</div>
          </div>
          <StatRow label="Monthly payment" a={lb.monthly} b={rb.monthly} />
          <StatRow label="Principal & Interest" a={lb.pi} b={rb.pi} />
          <StatRow label="Down payment" a={lb.downAmt} b={rb.downAmt} />
          <StatRow label="Loan amount" a={lb.loanAmount} b={rb.loanAmount} />
          <StatRow label="Total interest (life of loan)" a={lTotalInterest} b={rTotalInterest} />
          <StatRow label="Loan term" a={left.loanTerm} b={right.loanTerm} format={(v) => `${v} yr`} />
        </div>

        {/* Two editors side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {([{ side: "left", id: leftId, setId: setLeftId, scenario: left },
             { side: "right", id: rightId, setId: setRightId, scenario: right }] as const).map(({ side, id, setId, scenario }) => (
            <div key={side} className="rounded border border-border bg-background p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold shrink-0">
                  {side === "left" ? "Scenario A" : "Scenario B"}
                </div>
                <Select value={id} onValueChange={setId}>
                  <SelectTrigger className="h-7 text-xs font-body">
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
                inputs={scenario}
                onChange={(next) => onScenarioChange(scenario.id, next)}
                compact
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
