import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Property {
  id: string;
  address: string;
  city: string;
  community: string;
  builder: string;
  price: number;
  beds: number;
  baths: string;
  sqft: number;
  stories: number;
  garages: number;
  status: string;
  rentEst?: string;
  yieldEst?: string;
  expenses?: {
    piti?: number;
    hoa?: number;
    gas?: number;
    electric?: number;
    water?: number;
    trash?: number;
    other?: number;
    otherLabel?: string;
  };
}

interface ComparisonViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
}

function calcPI(loanAmount: number, annualRate: number, years = 30): number {
  if (loanAmount <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function ComparisonView({ open, onOpenChange, properties }: ComparisonViewProps) {
  const rows = useMemo(() => {
    return properties.map(p => {
      const downAmt = Math.round(p.price * 0.2);
      const loanAmount = p.price - downAmt;
      const pi = Math.round(calcPI(loanAmount, 6.5));
      const taxes = Math.round((p.price * 2.2 / 100) / 12);
      const insurance = 150;
      const hoa = p.expenses?.hoa || 0;
      const piti = pi + taxes + insurance + hoa;

      const totalExpenses = p.expenses
        ? (p.expenses.piti || 0) + (p.expenses.hoa || 0) + (p.expenses.gas || 0) +
          (p.expenses.electric || 0) + (p.expenses.water || 0) + (p.expenses.trash || 0) + (p.expenses.other || 0)
        : 0;

      const rentNum = (() => {
        const m = (p.rentEst || "").replace(/,/g, "").match(/\$?([\d]+)/);
        return m ? parseInt(m[1], 10) : 0;
      })();
      const netCashFlow = rentNum > 0 ? rentNum - totalExpenses : 0;

      return { ...p, pi, taxes, insurance, hoa, piti, totalExpenses, rentNum, netCashFlow };
    });
  }, [properties]);

  type RowDef = { label: string; render: (r: typeof rows[0]) => string; highlight?: boolean };

  const fields: RowDef[] = [
    { label: "Address", render: r => r.address },
    { label: "City", render: r => r.city },
    { label: "Builder", render: r => r.builder },
    { label: "Price", render: r => fmt(r.price) },
    { label: "Beds", render: r => String(r.beds || "—") },
    { label: "Baths", render: r => r.baths || "—" },
    { label: "Sq Ft", render: r => r.sqft ? r.sqft.toLocaleString() : "—" },
    { label: "$/Sq Ft", render: r => r.sqft ? fmt(Math.round(r.price / r.sqft)) : "—" },
    { label: "Status", render: r => r.status },
    { label: "Est. P&I", render: r => fmt(r.pi) },
    { label: "Taxes/mo", render: r => fmt(r.taxes) },
    { label: "Insurance/mo", render: r => fmt(r.insurance) },
    { label: "HOA/mo", render: r => fmt(r.hoa) },
    { label: "Est. PITI Total", render: r => fmt(r.piti), highlight: true },
    { label: "Total Expenses", render: r => r.totalExpenses > 0 ? fmt(r.totalExpenses) + "/mo" : "—" },
    { label: "Rent Estimate", render: r => r.rentEst || "—" },
    { label: "Gross Yield", render: r => r.yieldEst || "—" },
    { label: "Net Cash Flow", render: r => r.netCashFlow !== 0 ? `${r.netCashFlow > 0 ? "+" : ""}${fmt(r.netCashFlow)}/mo` : "—", highlight: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-auto max-h-[90vh] p-0">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="font-display text-lg">Property Comparison</DialogTitle>
          <p className="text-xs text-muted-foreground font-body">
            Side-by-side comparison using 20% down, 6.5% rate, 2.2% tax defaults.
          </p>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <div className="px-5 pb-5">
            <table className="w-full text-xs font-body border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider border-b border-border sticky left-0 bg-background min-w-[120px]">
                    Metric
                  </th>
                  {rows.map(r => (
                    <th key={r.id} className="text-right p-2 font-semibold text-[11px] border-b border-border min-w-[140px]">
                      {r.address.split(",")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, i) => (
                  <tr key={i} className={field.highlight ? "bg-muted/50" : ""}>
                    <td className="p-2 text-muted-foreground font-medium border-b border-border/30 sticky left-0 bg-background text-[11px]">
                      {field.label}
                    </td>
                    {rows.map(r => (
                      <td key={r.id} className={`p-2 text-right border-b border-border/30 text-[11px] ${field.highlight ? "font-bold text-foreground" : ""}`}>
                        {field.render(r)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
