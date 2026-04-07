import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ExternalLink, Save, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PaymentCalculatorProps {
  price: number;
  hoaFee?: number;
  propertyId?: string;
  userId?: string;
}

function calcPI(loanAmount: number, annualRate: number, years = 30): number {
  if (loanAmount <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function generateAmortization(loanAmount: number, annualRate: number, years: number) {
  if (loanAmount <= 0 || annualRate <= 0) return [];
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const payment = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let balance = loanAmount;
  const data: { year: number; principal: number; interest: number }[] = [];
  for (let y = 1; y <= years; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break;
      const intPayment = balance * r;
      const prinPayment = Math.min(payment - intPayment, balance);
      yearInterest += intPayment;
      yearPrincipal += prinPayment;
      balance -= prinPayment;
    }
    data.push({ year: y, principal: Math.round(yearPrincipal), interest: Math.round(yearInterest) });
  }
  return data;
}

const PIE_COLORS = [
  "hsl(210, 70%, 50%)",  // Principal - blue
  "hsl(0, 70%, 55%)",    // Interest - red/coral
  "hsl(40, 80%, 50%)",   // Taxes - amber
  "hsl(140, 50%, 45%)",  // Insurance - green
  "hsl(270, 50%, 55%)",  // HOA - purple
];

const TERM_OPTIONS = [5, 15, 20, 30];

export default function PaymentCalculator({ price, hoaFee = 0, propertyId, userId }: PaymentCalculatorProps) {
  const [offerPrice, setOfferPrice] = useState(price);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [taxRate, setTaxRate] = useState(2.2);
  const [insurance, setInsurance] = useState(150);
  const [hoa, setHoa] = useState(hoaFee);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loanTerm, setLoanTerm] = useState(30);

  useEffect(() => {
    if (!propertyId || !userId || loaded) return;
    const load = async () => {
      const { data } = await supabase
        .from("saved_estimates")
        .select("*")
        .eq("user_id", userId)
        .eq("property_id", propertyId)
        .maybeSingle();
      if (data) {
        setOfferPrice(Number(data.offer_price));
        setDownPct(Number(data.down_pct));
        setRate(Number(data.rate));
        setTaxRate(Number(data.tax_rate));
        setInsurance(Number(data.insurance));
        setHoa(Number(data.hoa));
      }
      setLoaded(true);
    };
    load();
  }, [propertyId, userId, loaded]);

  const handleSave = async () => {
    if (!propertyId || !userId) return;
    setSaving(true);
    await supabase.from("saved_estimates").upsert(
      { user_id: userId, property_id: propertyId, offer_price: offerPrice, down_pct: downPct, rate, tax_rate: taxRate, insurance, hoa },
      { onConflict: "user_id,property_id" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const downAmt = Math.round(offerPrice * downPct / 100);
  const loanAmount = offerPrice - downAmt;

  const pi = useMemo(() => Math.round(calcPI(loanAmount, rate, loanTerm)), [loanAmount, rate, loanTerm]);
  const monthlyInterest = useMemo(() => {
    if (loanAmount <= 0 || rate <= 0) return 0;
    return Math.round(loanAmount * (rate / 100 / 12));
  }, [loanAmount, rate]);
  const monthlyPrincipal = Math.max(0, pi - monthlyInterest);
  const monthlyTaxes = Math.round((offerPrice * taxRate / 100) / 12);

  const monthly = useMemo(() => pi + monthlyTaxes + insurance + hoa, [pi, monthlyTaxes, insurance, hoa]);

  // Pie chart data
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

  // Amortization bar chart data
  const amortData = useMemo(() => generateAmortization(loanAmount, rate, loanTerm), [loanAmount, rate, loanTerm]);

  const handleDownPct = (v: number) => setDownPct(Math.min(100, Math.max(0, v)));
  const handleDownAmt = (v: number) => {
    const pct = offerPrice > 0 ? (v / offerPrice) * 100 : 0;
    setDownPct(Math.min(100, Math.max(0, Math.round(pct * 10) / 10)));
  };

  return (
    <div className="mt-3 p-3.5 rounded border border-border bg-muted/30">
      <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground mb-3 font-body font-semibold">
        Payment Estimator
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column — Charts */}
        <div className="order-2 md:order-1 space-y-4">
          {/* Pie Chart */}
          <div className="p-3 rounded border border-border bg-card">
            <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground mb-2 font-body font-semibold">
              Monthly Payment Breakdown
            </div>
            <div className="relative" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
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
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-lg font-bold font-display text-foreground">${monthly.toLocaleString()}</div>
                  <div className="text-[9px] text-muted-foreground font-body">/month</div>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-[10px] text-muted-foreground font-body">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="p-3 rounded border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold">
                Principal vs Interest
              </div>
              <div className="flex gap-1">
                {TERM_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setLoanTerm(t)}
                    className={`px-2 py-0.5 text-[10px] font-body rounded transition-colors ${
                      loanTerm === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {t}yr
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 200 }}>
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
                  <Bar dataKey="principal" stackId="a" fill="hsl(210, 70%, 50%)" name="Principal" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="interest" stackId="a" fill="hsl(0, 70%, 55%)" name="Interest" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: "hsl(210, 70%, 50%)" }} />
                <span className="text-[10px] text-muted-foreground font-body">Principal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: "hsl(0, 70%, 55%)" }} />
                <span className="text-[10px] text-muted-foreground font-body">Interest</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Inputs & Result */}
        <div className="order-1 md:order-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground font-body block mb-1">Offer Price</label>
              <Input type="number" value={offerPrice} onChange={e => setOfferPrice(Number(e.target.value) || 0)} className="h-8 text-xs font-body" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-body block mb-1">Interest Rate %</label>
              <div className="flex items-center gap-2">
                <Slider value={[rate]} onValueChange={([v]) => setRate(Math.round(v * 100) / 100)} min={2} max={12} step={0.125} className="flex-1" />
                <Input type="number" value={rate} onChange={e => setRate(Number(e.target.value) || 0)} className="h-8 text-xs font-body w-16" step={0.125} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-body block mb-1">Down Payment %</label>
              <div className="flex items-center gap-2">
                <Slider value={[downPct]} onValueChange={([v]) => handleDownPct(Math.round(v * 10) / 10)} min={0} max={100} step={0.5} className="flex-1" />
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
                <Slider value={[taxRate]} onValueChange={([v]) => setTaxRate(Math.round(v * 100) / 100)} min={0} max={5} step={0.05} className="flex-1" />
                <Input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value) || 0)} className="h-8 text-xs font-body w-16" step={0.05} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-body block mb-1">Monthly Insurance $</label>
              <Input type="number" value={insurance} onChange={e => setInsurance(Number(e.target.value) || 0)} className="h-8 text-xs font-body" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-body block mb-1">Monthly HOA $</label>
              <Input type="number" value={hoa} onChange={e => setHoa(Number(e.target.value) || 0)} className="h-8 text-xs font-body" />
            </div>
          </div>

          {/* Result */}
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

          {/* Actions row */}
          <div className="flex items-center justify-between mt-3">
            <a
              href="https://equiforge.ai/try/payment"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold font-body text-primary hover:opacity-80 transition-opacity"
            >
              Advanced Calculator on EquiForge <ExternalLink className="h-3 w-3" />
            </a>
            {propertyId && userId && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold font-body text-primary hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer disabled:opacity-50"
              >
                {saved ? (<><Check className="h-3 w-3" /> Saved ✓</>) : (<><Save className="h-3 w-3" /> {saving ? "Saving…" : "Save Estimate"}</>)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
