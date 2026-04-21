import { Trophy } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
} from "recharts";
import {
  PIE_COLORS, SavedScenario, computeBreakdown, generateAmortization,
} from "@/lib/paymentCalc";

interface Props {
  scenarios: SavedScenario[]; // expects exactly 3
  winnerIndex: number;        // -1 if tied
  totalCosts: number[];
  totalInterests: number[];
  propertyAddress?: string;
  propertyCity?: string;
  propertyCommunity?: string;
  mapDataUrl?: string;
}

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;

const COL_WIDTH = 470;
const PIE_W = 440;
const PIE_H = 200;
const BAR_W = 440;
const BAR_H = 160;

function ColumnCard({
  label, scenario, isWinner, totalCost, totalInterest,
}: {
  label: string;
  scenario: SavedScenario;
  isWinner: boolean;
  totalCost: number;
  totalInterest: number;
}) {
  const b = computeBreakdown(scenario);
  const amort = generateAmortization(b.loanAmount, scenario.rate, scenario.loanTerm);

  const pieData = [
    { name: "Principal", value: b.monthlyPrincipal },
    { name: "Interest", value: b.monthlyInterest },
    { name: "Taxes", value: b.monthlyTaxes },
    { name: "Insurance", value: scenario.insurance },
  ];
  if (scenario.hoa > 0) pieData.push({ name: "HOA", value: scenario.hoa });

  const ringStyle: React.CSSProperties = isWinner
    ? { border: "2px solid hsl(var(--primary))", boxShadow: "0 0 0 2px hsla(var(--primary), 0.25)" }
    : { border: "1px solid hsl(var(--border))" };

  return (
    <div
      style={{
        width: COL_WIDTH,
        background: "hsl(var(--muted) / 0.3)",
        borderRadius: 6,
        padding: 12,
        ...ringStyle,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>
          {label}
        </div>
        {isWinner && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600,
            color: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.1)",
            padding: "2px 6px", borderRadius: 4,
          }}>
            <Trophy style={{ width: 10, height: 10 }} /> Lower total cost
          </div>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))" }}>
        {scenario.name}{scenario.is_pinned ? " · pinned" : ""}
      </div>

      {/* Donut */}
      <div style={{ padding: 10, borderRadius: 4, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 6 }}>
          Monthly Payment Breakdown
        </div>
        <div style={{ position: "relative", width: PIE_W, height: PIE_H }}>
          <PieChart width={PIE_W} height={PIE_H}>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none" isAnimationActive={false}>
              {pieData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i]} />))}
            </Pie>
          </PieChart>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "hsl(var(--foreground))" }}>${b.monthly.toLocaleString()}</div>
              <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))" }}>/month</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 12px", marginTop: 4 }}>
          {pieData.map((d, i) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i] }} />
              <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ padding: 10, borderRadius: 4, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>
            Principal vs Interest
          </div>
          <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>
            {scenario.loanTerm} yr
          </div>
        </div>
        <BarChart width={BAR_W} height={BAR_H} data={amort} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            interval={scenario.loanTerm <= 15 ? 1 : scenario.loanTerm <= 20 ? 3 : 4}
          />
          <YAxis hide />
          <Bar dataKey="principal" stackId="a" fill="hsl(210, 70%, 50%)" name="Principal" isAnimationActive={false} />
          <Bar dataKey="interest" stackId="a" fill="hsl(0, 70%, 55%)" name="Interest" radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
        <div style={{ textAlign: "center", fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 6 }}>
          Total Interest Over {scenario.loanTerm} Years:{" "}
          <span style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>${totalInterest.toLocaleString()}</span>
        </div>
      </div>

      {/* Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", fontSize: 11 }}>
        {[
          ["Offer Price", fmt(scenario.offerPrice)],
          ["Interest Rate", `${scenario.rate}%`],
          ["Down Payment %", `${scenario.downPct}%`],
          ["Down Payment $", fmt(b.downAmt)],
          ["Annual Tax Rate", `${scenario.taxRate}%`],
          ["Monthly Insurance", fmt(scenario.insurance)],
          ["Monthly HOA", fmt(scenario.hoa)],
          ["Loan Term", `${scenario.loanTerm} yr`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", borderRadius: 4 }}>
            <span style={{ color: "hsl(var(--muted-foreground))" }}>{k}</span>
            <span style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Est. Monthly */}
      <div style={{ padding: 10, borderRadius: 4, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "hsl(var(--muted-foreground))" }}>
              Est. Monthly Payment
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "hsl(var(--foreground))" }}>${b.monthly.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 10, color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>
            <div>P&I: ${b.pi.toLocaleString()}</div>
            <div>Taxes: ${b.monthlyTaxes.toLocaleString()}</div>
            <div>Ins: ${scenario.insurance.toLocaleString()} · HOA: ${scenario.hoa.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Total cost footer */}
      <div style={{ textAlign: "center", fontSize: 11, color: "hsl(var(--muted-foreground))", paddingTop: 6, borderTop: "1px solid hsl(var(--border))" }}>
        Total cost of loan:{" "}
        <span style={{ fontWeight: 700, color: isWinner ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}>
          {fmt(totalCost)}
        </span>
      </div>
    </div>
  );
}

function DeltaCellPrint({ base, value, isBase }: { base: number; value: number; isBase: boolean }) {
  if (isBase) {
    return <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>baseline</div>;
  }
  const diff = value - base;
  const isZero = Math.abs(diff) < 0.5;
  const better = diff < 0;
  const color = isZero ? "hsl(var(--muted-foreground))" : better ? "hsl(var(--primary))" : "hsl(var(--destructive))";
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
  const pct = base === 0 ? null : Math.round((diff / base) * 100);
  const pctText = isZero ? "" : pct === null ? " (—)" : ` (${sign}${Math.abs(pct)}%)`;
  const text = isZero ? "—" : `${sign}${fmt(Math.abs(diff))}${pctText}`;
  return <div style={{ fontSize: 10, fontWeight: 600, color, marginTop: 2 }}>vs A: {text}</div>;
}

function DeltaRowPrint({ label, values }: { label: string; values: number[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
      {values.map((v, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 12px", borderRadius: 4, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--foreground))" }}>{fmt(v)}</div>
          <DeltaCellPrint base={values[0]} value={v} isBase={i === 0} />
        </div>
      ))}
    </div>
  );
}

export default function ScenarioComparePrintView({
  scenarios, winnerIndex, totalCosts, totalInterests,
  propertyAddress, propertyCity, propertyCommunity, mapDataUrl,
}: Props) {
  const breakdowns = scenarios.map(computeBreakdown);
  const labels = ["Scenario A", "Scenario B", "Scenario C"];
  const hasPropertyContext = !!propertyAddress;
  const subtitleParts = [propertyCity, propertyCommunity].filter(Boolean);
  const streetNumberMatch = propertyAddress?.match(/^\s*(\d+)/);
  const streetNumber = streetNumberMatch?.[1] ?? "";
  return (
    <div
      style={{
        width: 1500,
        background: "#ffffff",
        padding: 24,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "hsl(var(--foreground))",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid hsl(var(--border))", gap: 16 }}>
        {hasPropertyContext ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            {mapDataUrl ? (
              <img
                src={mapDataUrl}
                alt=""
                style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 4, border: "1px solid hsl(var(--border))", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 120, height: 80, borderRadius: 4,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--muted))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 24, fontWeight: 700,
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                {streetNumber || "—"}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "hsl(var(--foreground))", lineHeight: 1.2 }}>
                {propertyAddress}
              </div>
              {subtitleParts.length > 0 && (
                <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                  {subtitleParts.join(" · ")}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
            Payment Scenario Comparison
          </div>
        )}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {hasPropertyContext && (
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>
              Payment Scenario Comparison
            </div>
          )}
          <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: hasPropertyContext ? 4 : 0 }}>
            Generated {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* 3 columns */}
      <div style={{ display: "flex", gap: 16, justifyContent: "space-between" }}>
        {scenarios.map((s, i) => (
          <ColumnCard
            key={s.id}
            label={labels[i]}
            scenario={s}
            isWinner={i === winnerIndex}
            totalCost={totalCosts[i]}
            totalInterest={totalInterests[i]}
          />
        ))}
      </div>

      {/* Delta strip */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 8 }}>
          Comparison · Scenario A is baseline · lower is better
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <DeltaRowPrint label="Monthly payment" values={breakdowns.map(b => b.monthly)} />
          <DeltaRowPrint label="Principal & Interest" values={breakdowns.map(b => b.pi)} />
          <DeltaRowPrint label="Down payment" values={breakdowns.map(b => b.downAmt)} />
          <DeltaRowPrint label="Total interest" values={totalInterests} />
        </div>
      </div>
    </div>
  );
}
