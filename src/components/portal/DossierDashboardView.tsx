import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { Property, PropertyInteraction } from "./ClientDossierView";

interface DossierDashboardViewProps {
  properties: Property[];
  interactions: Record<string, PropertyInteraction>;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const GRADE_COLORS: Record<string, string> = {
  A: "hsl(152, 69%, 31%)",
  B: "hsl(217, 91%, 60%)",
  C: "hsl(48, 96%, 53%)",
  D: "hsl(25, 95%, 53%)",
  F: "hsl(0, 72%, 51%)",
};

const EXPENSE_COLORS = [
  "hsl(var(--primary))",
  "hsl(217, 91%, 60%)",
  "hsl(152, 69%, 31%)",
  "hsl(48, 96%, 53%)",
  "hsl(25, 95%, 53%)",
  "hsl(280, 68%, 51%)",
  "hsl(0, 72%, 51%)",
];

function shortAddr(address: string) {
  if (address.length <= 25) return address;
  const parts = address.split(" ");
  if (parts.length <= 3) return address;
  const short = parts.slice(0, 3).join(" ");
  return short.length > 25 ? short.slice(0, 22) + "…" : short + "…";
}

function parseRentNum(rentEst?: string): number {
  if (!rentEst) return 0;
  const m = rentEst.replace(/,/g, "").match(/\$?([\d]+)/);
  return m ? parseInt(m[1], 10) : 0;
}

export default function DossierDashboardView({
  properties,
  interactions,
}: DossierDashboardViewProps) {
  const [filter, setFilter] = useState<"all" | "selected">("all");

  const filteredProps = useMemo(() => {
    if (filter === "all") return properties;
    return properties.filter(
      (p) => interactions[p.id]?.is_favorite || interactions[p.id]?.grade
    );
  }, [properties, interactions, filter]);

  // === KPI Data ===
  const priceData = useMemo(
    () =>
      filteredProps
        .filter((p) => p.price)
        .sort((a, b) => b.price - a.price)
        .map((p) => ({ name: shortAddr(p.address), price: p.price })),
    [filteredProps]
  );

  const psfData = useMemo(
    () =>
      filteredProps
        .filter((p) => p.price && p.sqft)
        .sort((a, b) => b.price / b.sqft - a.price / a.sqft)
        .map((p) => ({
          name: shortAddr(p.address),
          psf: Math.round(p.price / p.sqft),
        })),
    [filteredProps]
  );

  const bedBathData = useMemo(
    () =>
      filteredProps.map((p) => ({
        name: shortAddr(p.address),
        beds: p.beds || 0,
        baths: parseFloat(String(p.baths)) || 0,
      })),
    [filteredProps]
  );

  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    filteredProps.forEach((p) => {
      const g = interactions[p.id]?.grade;
      if (g) {
        const letter = g.charAt(0);
        if (counts[letter] !== undefined) counts[letter]++;
      }
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([grade, count]) => ({ name: grade, value: count }));
  }, [filteredProps, interactions]);

  const expenseData = useMemo(
    () =>
      filteredProps
        .filter((p) => p.expenses && Object.values(p.expenses).some((v) => v))
        .map((p) => {
          const e = p.expenses!;
          return {
            name: shortAddr(p.address),
            piti: e.piti || 0,
            hoa: e.hoa || 0,
            utilities: (e.gas || 0) + (e.electric || 0) + (e.water || 0) + (e.trash || 0),
            other: e.other || 0,
          };
        }),
    [filteredProps]
  );

  const yieldData = useMemo(
    () =>
      filteredProps
        .filter((p) => p.yieldEst)
        .map((p) => ({
          name: shortAddr(p.address),
          yield: parseFloat(p.yieldEst!.replace("%", "")) || 0,
        }))
        .sort((a, b) => b.yield - a.yield),
    [filteredProps]
  );

  const priceConfig: ChartConfig = { price: { label: "Price", color: "hsl(var(--primary))" } };
  const psfConfig: ChartConfig = { psf: { label: "$/sqft", color: "hsl(217, 91%, 60%)" } };
  const bedBathConfig: ChartConfig = {
    beds: { label: "Beds", color: "hsl(var(--primary))" },
    baths: { label: "Baths", color: "hsl(217, 91%, 60%)" },
  };
  const expenseConfig: ChartConfig = {
    piti: { label: "PITI", color: EXPENSE_COLORS[0] },
    hoa: { label: "HOA", color: EXPENSE_COLORS[1] },
    utilities: { label: "Utilities", color: EXPENSE_COLORS[2] },
    other: { label: "Other", color: EXPENSE_COLORS[3] },
  };
  const yieldConfig: ChartConfig = { yield: { label: "Yield %", color: "hsl(152, 69%, 31%)" } };

  // === Comparison Matrix ===
  const matrixRows = useMemo(() => {
    type Row = { label: string; values: (string | number | boolean | null)[] };
    const rows: Row[] = [
      { label: "Price", values: filteredProps.map((p) => (p.price ? fmt(p.price) : "—")) },
      { label: "Sq Ft", values: filteredProps.map((p) => (p.sqft ? p.sqft.toLocaleString() : "—")) },
      { label: "$/Sq Ft", values: filteredProps.map((p) => (p.price && p.sqft ? `$${Math.round(p.price / p.sqft)}` : "—")) },
      { label: "Beds", values: filteredProps.map((p) => p.beds || "—") },
      { label: "Baths", values: filteredProps.map((p) => p.baths || "—") },
      { label: "Stories", values: filteredProps.map((p) => p.stories || "—") },
      { label: "Garages", values: filteredProps.map((p) => (p.garages ? `${p.garages}-car` : "—")) },
      { label: "Status", values: filteredProps.map((p) => p.status || "—") },
      { label: "Grade", values: filteredProps.map((p) => interactions[p.id]?.grade || "—") },
      { label: "Favorite", values: filteredProps.map((p) => interactions[p.id]?.is_favorite || false) },
      { label: "PITI", values: filteredProps.map((p) => (p.expenses?.piti ? fmt(p.expenses.piti) : "—")) },
      { label: "HOA", values: filteredProps.map((p) => (p.expenses?.hoa ? fmt(p.expenses.hoa) : "—")) },
      { label: "Rent Est.", values: filteredProps.map((p) => p.rentEst || "—") },
      { label: "Yield", values: filteredProps.map((p) => p.yieldEst || "—") },
      {
        label: "Net Cash Flow",
        values: filteredProps.map((p) => {
          const rent = parseRentNum(p.rentEst);
          if (!rent || !p.expenses) return "—";
          const e = p.expenses;
          const total = (e.piti || 0) + (e.hoa || 0) + (e.gas || 0) + (e.electric || 0) + (e.water || 0) + (e.trash || 0) + (e.other || 0);
          const net = rent - total;
          return `${net >= 0 ? "+" : ""}${fmt(net)}/mo`;
        }),
      },
    ];
    return rows;
  }, [filteredProps, interactions]);

  if (filteredProps.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground font-body">
        <p className="text-sm">No properties to display. {filter === "selected" && "Try switching to 'All Homes'."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="text-xs"
        >
          All Homes ({properties.length})
        </Button>
        <Button
          variant={filter === "selected" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("selected")}
          className="text-xs"
        >
          Favorited / Graded Only
        </Button>
      </div>

      {/* KPI Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Price Distribution */}
        {priceData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 font-body">
              Price by Property
            </h4>
            <ChartContainer config={priceConfig} className="w-full" style={{ height: `${Math.max(200, priceData.length * 28)}px` }}>
              <BarChart data={priceData} layout="vertical" margin={{ left: 100, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-[10px]" />
                <YAxis type="category" dataKey="name" width={100} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                <Bar dataKey="price" fill="var(--color-price)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {/* $/sqft */}
        {psfData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 font-body">
              Price per Sq Ft
            </h4>
            <ChartContainer config={psfConfig} className="w-full" style={{ height: `${Math.max(200, psfData.length * 28)}px` }}>
              <BarChart data={psfData} layout="vertical" margin={{ left: 100, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${v}`} className="text-[10px]" />
                <YAxis type="category" dataKey="name" width={100} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => `$${v}/sqft`} />} />
                <Bar dataKey="psf" fill="var(--color-psf)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {/* Beds & Baths */}
        {bedBathData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 font-body">
              Beds & Baths
            </h4>
            <ChartContainer config={bedBathConfig} className="h-[200px] w-full">
              <BarChart data={bedBathData} margin={{ left: 0, right: 10, top: 5, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} className="text-[9px]" height={60} />
                <YAxis className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="beds" fill="var(--color-beds)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="baths" fill="var(--color-baths)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {/* Grade Distribution */}
        {gradeDistribution.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 font-body">
              Grade Distribution
            </h4>
            <div className="h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {gradeDistribution.map((entry) => (
                      <Cell key={entry.name} fill={GRADE_COLORS[entry.name] || "hsl(var(--muted-foreground))"} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Expense Breakdown */}
        {expenseData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 font-body">
              Monthly Expenses
            </h4>
            <ChartContainer config={expenseConfig} className="h-[200px] w-full">
              <BarChart data={expenseData} margin={{ left: 0, right: 10, top: 5, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} className="text-[9px]" height={60} />
                <YAxis tickFormatter={(v) => `$${v}`} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                <Bar dataKey="piti" stackId="a" fill="var(--color-piti)" />
                <Bar dataKey="hoa" stackId="a" fill="var(--color-hoa)" />
                <Bar dataKey="utilities" stackId="a" fill="var(--color-utilities)" />
                <Bar dataKey="other" stackId="a" fill="var(--color-other)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {/* Yield Comparison */}
        {yieldData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 font-body">
              Projected Gross Yield
            </h4>
            <ChartContainer config={yieldConfig} className="w-full" style={{ height: `${Math.max(200, yieldData.length * 28)}px` }}>
              <BarChart data={yieldData} layout="vertical" margin={{ left: 100, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} className="text-[10px]" />
                <YAxis type="category" dataKey="name" width={100} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}%`} />} />
                <Bar dataKey="yield" fill="var(--color-yield)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>

      {/* Comparison Matrix */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 py-3 font-body border-b border-border">
          Property Comparison Matrix
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-body">
            <thead>
              <tr className="bg-[#1a2332] text-white">
                <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wider sticky left-0 bg-[#1a2332] z-10 min-w-[120px]">
                  Feature
                </th>
                {filteredProps.map((p) => (
                  <th
                    key={p.id}
                    className="text-center px-3 py-3 font-semibold text-[10px] min-w-[160px]"
                  >
                    <div className="whitespace-normal leading-tight">{p.address}</div>
                    <div className="text-[9px] opacity-60 font-normal mt-0.5">{p.city}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row, ri) => (
                <tr
                  key={row.label}
                  className={ri % 2 === 0 ? "bg-muted/30" : "bg-card"}
                >
                  <td className="px-4 py-2.5 font-semibold text-muted-foreground sticky left-0 z-10 bg-inherit">
                    {row.label}
                  </td>
                  {row.values.map((val, ci) => (
                    <td key={ci} className="text-center px-3 py-2.5">
                      {typeof val === "boolean" ? (
                        val ? (
                          <Check className="h-4 w-4 mx-auto text-emerald-600" />
                        ) : (
                          <X className="h-4 w-4 mx-auto text-muted-foreground/30" />
                        )
                      ) : (
                        <span
                          className={
                            row.label === "Grade" && val !== "—"
                              ? `font-bold ${
                                  String(val).startsWith("A")
                                    ? "text-emerald-600"
                                    : String(val).startsWith("B")
                                    ? "text-blue-600"
                                    : String(val).startsWith("C")
                                    ? "text-yellow-600"
                                    : String(val).startsWith("D")
                                    ? "text-orange-600"
                                    : String(val).startsWith("F")
                                    ? "text-red-600"
                                    : ""
                                }`
                              : row.label === "Net Cash Flow" && val !== "—"
                              ? `font-bold ${
                                  String(val).startsWith("+") ? "text-emerald-600" : "text-red-600"
                                }`
                              : "text-foreground"
                          }
                        >
                          {String(val)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
