interface Property {
  price: number;
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

interface Props {
  properties: Property[];
  color: string;
  label: string;
}

function parseRent(rentEst?: string): number {
  if (!rentEst) return 0;
  const match = rentEst.replace(/,/g, "").match(/\$?([\d,]+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseYield(yieldEst?: string): number {
  if (!yieldEst) return 0;
  const match = yieldEst.match(/([\d.]+)%/);
  return match ? parseFloat(match[1]) : 0;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function TabSummary({ properties, color, label }: Props) {
  if (properties.length === 0) return null;

  const prices = properties.filter(p => p.price > 0).map(p => p.price);
  const yields = properties.map(p => parseYield(p.yieldEst)).filter(y => y > 0);
  const rents = properties.map(p => parseRent(p.rentEst)).filter(r => r > 0);

  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const avgYield = yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : 0;
  const avgRent = rents.length > 0 ? rents.reduce((a, b) => a + b, 0) / rents.length : 0;
  const priceRange = prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null;

  return (
    <div className="mb-4 p-3 rounded border border-border bg-card">
      <div className="text-[9px] uppercase tracking-[2px] font-body font-semibold mb-2" style={{ color }}>
        {label} · {properties.length} {properties.length === 1 ? "Property" : "Properties"}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {avgPrice > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-body">Avg Price</div>
            <div className="text-sm font-bold font-body text-foreground">{fmt(Math.round(avgPrice))}</div>
            {priceRange && priceRange.min !== priceRange.max && (
              <div className="text-[10px] text-muted-foreground font-body">{fmt(priceRange.min)} – {fmt(priceRange.max)}</div>
            )}
          </div>
        )}
        {avgYield > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-body">Avg Yield</div>
            <div className="text-sm font-bold font-body" style={{ color: "#2e7d32" }}>{avgYield.toFixed(1)}%</div>
          </div>
        )}
        {avgRent > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-body">Avg Rent Est.</div>
            <div className="text-sm font-bold font-body" style={{ color: "#2e7d32" }}>{fmt(Math.round(avgRent))}/mo</div>
          </div>
        )}
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-body">Count</div>
          <div className="text-sm font-bold font-body text-foreground">{properties.length}</div>
        </div>
      </div>
    </div>
  );
}
