import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  PIE_COLORS, TERM_OPTIONS, ScenarioInputs, computeBreakdown, generateAmortization,
} from "@/lib/paymentCalc";

interface Props {
  inputs: ScenarioInputs;
  onChange: (next: ScenarioInputs) => void;
  /** Compact mode renders side-by-side inside the comparison modal. */
  compact?: boolean;
}

export default function ScenarioEditor({ inputs, onChange, compact = false }: Props) {
  const { offerPrice, downPct, rate, taxRate, insurance, hoa, loanTerm } = inputs;
  const set = <K extends keyof ScenarioInputs>(k: K, v: ScenarioInputs[K]) =>
    onChange({ ...inputs, [k]: v });

  const { downAmt, monthly, pi, monthlyInterest, monthlyPrincipal, monthlyTaxes, loanAmount } =
    computeBreakdown(inputs);

  const pieData = useMemo(() => {
    const segments = [
      { name: "Principal", value: monthlyPrincipal },
      { name: "Interest", value: monthlyInterest },
      { name: "Taxes", value: monthlyTaxes },
      { name: "Insurance", value: insurance },
    ];
    if (hoa > 0) segments.push({ name: "HOA", value: hoa });
    return segments;
  }, [monthlyPrincipal, monthlyInterest, monthlyTaxes, insurance, hoa]);

  const amortData = useMemo(
    () => generateAmortization(loanAmount, rate, loanTerm),
    [loanAmount, rate, loanTerm]
  );

  const handleDownPct = (v: number) =>
    set("downPct", Math.min(100, Math.max(0, Math.round(v * 10) / 10)));
  const handleDownAmt = (v: number) => {
    const pct = offerPrice > 0 ? (v / offerPrice) * 100 : 0;
    set("downPct", Math.min(100, Math.max(0, Math.round(pct * 10) / 10)));
  };

  const pieHeight = compact ? 200 : 260;
  const barHeight = compact ? 160 : 220;
  const innerR = compact ? 50 : 70;
  const outerR = compact ? 75 : 100;

  return (
    <div className={`grid gap-6 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
      {/* Left — Charts */}
      <div className={compact ? "space-y-3" : "order-2 md:order-1 space-y-4"}>
        <div className="p-3 rounded border border-border bg-card">
          <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground mb-2 font-body font-semibold">
            Monthly Payment Breakdown
          </div>
          <div className="relative" style={{ height: pieHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={innerR} outerRadius={outerR} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()} (${monthly > 0 ? Math.round((value / monthly) * 100) : 0}%)`,
                    name,
                  ]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-lg font-bold font-display text-foreground">${monthly.toLocaleString()}</div>
                <div className="text-[9px] text-muted-foreground font-body">/month</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-[10px] text-muted-foreground font-body">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold">
              Principal vs Interest
            </div>
            <div className="flex gap-1">
              {TERM_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => set("loanTerm", t)}
                  className={`px-2 py-0.5 text-[10px] font-body rounded transition-colors ${
                    loanTerm === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t}yr
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: barHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={amortData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  interval={loanTerm <= 15 ? 1 : loanTerm <= 20 ? 3 : 4}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Bar dataKey="principal" stackId="a" fill="hsl(210, 70%, 50%)" name="Principal" />
                <Bar dataKey="interest" stackId="a" fill="hsl(0, 70%, 55%)" name="Interest" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-[10px] text-muted-foreground font-body mt-2">
            Total Interest Over {loanTerm} Years:{" "}
            <span className="font-semibold text-foreground">
              ${amortData.reduce((sum, d) => sum + d.interest, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Right — Inputs */}
      <div className={compact ? "" : "order-1 md:order-2"}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground font-body block mb-1">Offer Price</label>
            <Input type="number" value={offerPrice} onChange={e => set("offerPrice", Number(e.target.value) || 0)} className="h-8 text-xs font-body" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-body block mb-1">Interest Rate %</label>
            <div className="flex items-center gap-2">
              <Slider value={[rate]} onValueChange={([v]) => set("rate", Math.round(v * 100) / 100)} min={2} max={12} step={0.125} className="flex-1" />
              <Input type="number" value={rate} onChange={e => set("rate", Number(e.target.value) || 0)} className="h-8 text-xs font-body w-16" step={0.125} />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-body block mb-1">Down Payment %</label>
            <div className="flex items-center gap-2">
              <Slider value={[downPct]} onValueChange={([v]) => handleDownPct(v)} min={0} max={100} step={0.5} className="flex-1" />
              <Input type="number" value={downPct} onChange={e => handleDownPct(Number(e.target.value) || 0)} className="h-8 text-xs font-body w-16" step={0.5} />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-body block mb-1">Down Payment $</label>
            <Input type="number" value={downAmt} onChange={e => handleDownAmt(Number(e.target.value) || 0)} className="h-8 text-xs font-body" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-body block mb-1">Annual Tax Rate %</label>
            <div className="flex items-center gap-2">
              <Slider value={[taxRate]} onValueChange={([v]) => set("taxRate", Math.round(v * 100) / 100)} min={0} max={5} step={0.05} className="flex-1" />
              <Input type="number" value={taxRate} onChange={e => set("taxRate", Number(e.target.value) || 0)} className="h-8 text-xs font-body w-16" step={0.05} />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-body block mb-1">Monthly Insurance $</label>
            <Input type="number" value={insurance} onChange={e => set("insurance", Number(e.target.value) || 0)} className="h-8 text-xs font-body" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-body block mb-1">Monthly HOA $</label>
            <Input type="number" value={hoa} onChange={e => set("hoa", Number(e.target.value) || 0)} className="h-8 text-xs font-body" />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-muted-foreground font-body block mb-1">Loan Term</label>
            <div className="flex gap-1">
              {TERM_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => set("loanTerm", t)}
                  className={`px-3 py-1 text-[11px] font-body rounded transition-colors ${
                    loanTerm === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t} yr
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded bg-card border border-border">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body">Est. Monthly Payment</div>
              <div className="text-xl font-bold font-display text-foreground">${monthly.toLocaleString()}</div>
            </div>
            <div className="text-right text-[11px] font-body text-muted-foreground leading-relaxed">
              <div>P&I: ${pi.toLocaleString()}</div>
              <div>Taxes: ${monthlyTaxes.toLocaleString()}</div>
              <div>Ins: ${insurance.toLocaleString()} · HOA: ${hoa.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
