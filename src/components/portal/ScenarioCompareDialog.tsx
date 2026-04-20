import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedScenario, computeBreakdown, generateAmortization } from "@/lib/paymentCalc";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarios: SavedScenario[];
  initialLeftId?: string;
  initialRightId?: string;
}

type DeltaDirection = "lower-better" | "neutral";

const fmtCurrency = (v: number) => `$${Math.round(v).toLocaleString()}`;
const fmtPct = (v: number) => `${v.toFixed(2)}%`;
const fmtYears = (v: number) => `${v} yr`;

function StatRow({
  label, a, b, format = fmtCurrency, direction = "lower-better",
}: {
  label: string;
  a: number;
  b: number;
  format?: (v: number) => string;
  direction?: DeltaDirection;
}) {
  const diff = b - a;
  const isZero = Math.abs(diff) < 0.005;
  // For lower-better: negative diff (B < A) means B is better → green on B side
  const better = direction === "lower-better" && diff < 0;
  const worse = direction === "lower-better" && diff > 0;
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
  const deltaClass = isZero
    ? "text-muted-foreground"
    : direction === "neutral"
      ? "text-muted-foreground"
      : better
        ? "text-primary"
        : "text-destructive";
  const deltaText = isZero ? "—" : `${sign}${format(Math.abs(diff))}`;

  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
      <div className="text-[11px] font-body text-muted-foreground">{label}</div>
      <div className="text-xs font-body font-semibold text-foreground tabular-nums text-right">{format(a)}</div>
      <div className="text-xs font-body font-semibold text-foreground tabular-nums text-right">{format(b)}</div>
      <div className={`text-[10px] font-body tabular-nums text-right ${deltaClass}`}>
        {deltaText}
      </div>
    </div>
  );
}

export default function ScenarioCompareDialog({
  open, onOpenChange, scenarios, initialLeftId, initialRightId,
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
  const lTotalCost = lb.pi * left.loanTerm * 12;
  const rTotalCost = rb.pi * right.loanTerm * 12;
  const lMonthlyInsurance = left.insurance;
  const rMonthlyInsurance = right.insurance;
  const lMonthlyHoa = left.hoa;
  const rMonthlyHoa = right.hoa;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Compare Payment Scenarios</DialogTitle>
          <DialogDescription className="font-body text-xs">
            Side-by-side numbers for two saved scenarios.
          </DialogDescription>
        </DialogHeader>

        {/* Scenario pickers */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {([{ label: "Scenario A", id: leftId, setId: setLeftId },
             { label: "Scenario B", id: rightId, setId: setRightId }] as const).map(({ label, id, setId }) => (
            <div key={label} className="flex flex-col gap-1">
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
          ))}
        </div>

        {/* Numbers table */}
        <div className="rounded border border-border bg-muted/30 p-3">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-3 pb-2 mb-1 border-b border-border">
            <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold">Metric</div>
            <div className="text-[10px] font-body font-semibold text-foreground text-right truncate">{left.name}</div>
            <div className="text-[10px] font-body font-semibold text-foreground text-right truncate">{right.name}</div>
            <div className="text-[10px] font-body font-semibold text-muted-foreground text-right">Δ (B − A)</div>
          </div>
          <StatRow label="Monthly payment (PITI + HOA)" a={lb.monthly} b={rb.monthly} />
          <StatRow label="Principal & Interest" a={lb.pi} b={rb.pi} />
          <StatRow label="Monthly taxes" a={lb.monthlyTaxes} b={rb.monthlyTaxes} />
          <StatRow label="Monthly insurance" a={lMonthlyInsurance} b={rMonthlyInsurance} />
          <StatRow label="Monthly HOA" a={lMonthlyHoa} b={rMonthlyHoa} />
          <StatRow label="Down payment" a={lb.downAmt} b={rb.downAmt} />
          <StatRow label="Loan amount" a={lb.loanAmount} b={rb.loanAmount} />
          <StatRow label="Interest rate" a={left.rate} b={right.rate} format={fmtPct} direction="neutral" />
          <StatRow label="Loan term" a={left.loanTerm} b={right.loanTerm} format={fmtYears} direction="neutral" />
          <StatRow label="Total interest (life of loan)" a={lTotalInterest} b={rTotalInterest} />
          <StatRow label="Total cost of loan (P&I × term)" a={lTotalCost} b={rTotalCost} />
        </div>

        <p className="text-[10px] font-body text-muted-foreground italic mt-2 text-center">
          To edit values, close this and switch to a scenario tab.
        </p>
      </DialogContent>
    </Dialog>
  );
}
