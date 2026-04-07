import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterState, SortField } from "@/lib/dossierScoring";

interface Props {
  filters: FilterState;
  sort: SortField;
  onFiltersChange: (f: FilterState) => void;
  onSortChange: (s: SortField) => void;
  cities: string[];
  builders: string[];
  favCount?: number;
}

export default function FilterSortToolbar({ filters, sort, onFiltersChange, onSortChange, cities, builders, favCount = 0 }: Props) {
  const [open, setOpen] = useState(false);

  const update = (patch: Partial<FilterState>) => onFiltersChange({ ...filters, ...patch });
  const hasActive = filters.minPrice > 0 || filters.maxPrice > 0 || filters.minBeds > 0 || !!filters.city || !!filters.builder || filters.favoritesOnly;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOpen(!open)}
          className="text-[11px] font-semibold uppercase tracking-wider font-body px-3 py-1.5 rounded border border-border bg-card text-foreground hover:bg-muted transition-colors"
        >
          {open ? "▲ Hide Filters" : "▼ Filters"}{hasActive ? " •" : ""}
        </button>

        <button
          onClick={() => update({ favoritesOnly: !filters.favoritesOnly })}
          className={cn(
            "text-[11px] font-semibold font-body px-3 py-1.5 rounded border transition-colors inline-flex items-center gap-1.5",
            filters.favoritesOnly
              ? "bg-red-500/10 border-red-500/30 text-red-500"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", filters.favoritesOnly && "fill-red-500")} />
          Favorites{favCount > 0 ? ` (${favCount})` : ""}
        </button>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">Sort:</span>
          {([
            ["price-asc", "Price ↑"],
            ["price-desc", "Price ↓"],
            ["beds", "Beds"],
            ["sqft", "Sq Ft"],
            ["yield", "Yield"],
          ] as [SortField, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onSortChange(key)}
              className={`text-[10px] px-2 py-1 rounded font-body font-semibold border transition-colors ${
                sort === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div className="mt-2.5 p-3 bg-card rounded border border-border grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <div>
            <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-body block mb-1">Min Price</label>
            <input
              type="number"
              value={filters.minPrice || ""}
              onChange={e => update({ minPrice: Number(e.target.value) || 0 })}
              placeholder="$0"
              className="w-full text-xs px-2 py-1.5 rounded border border-input bg-background text-foreground font-body"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-body block mb-1">Max Price</label>
            <input
              type="number"
              value={filters.maxPrice || ""}
              onChange={e => update({ maxPrice: Number(e.target.value) || 0 })}
              placeholder="No max"
              className="w-full text-xs px-2 py-1.5 rounded border border-input bg-background text-foreground font-body"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-body block mb-1">Min Beds</label>
            <select
              value={filters.minBeds}
              onChange={e => update({ minBeds: Number(e.target.value) })}
              className="w-full text-xs px-2 py-1.5 rounded border border-input bg-background text-foreground font-body"
            >
              <option value={0}>Any</option>
              {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-body block mb-1">City</label>
            <select
              value={filters.city}
              onChange={e => update({ city: e.target.value })}
              className="w-full text-xs px-2 py-1.5 rounded border border-input bg-background text-foreground font-body"
            >
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-body block mb-1">Builder</label>
            <select
              value={filters.builder}
              onChange={e => update({ builder: e.target.value })}
              className="w-full text-xs px-2 py-1.5 rounded border border-input bg-background text-foreground font-body"
            >
              <option value="">All Builders</option>
              {builders.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {hasActive && (
            <button
              onClick={() => onFiltersChange({ minPrice: 0, maxPrice: 0, minBeds: 0, city: "", builder: "", favoritesOnly: false })}
              className="col-span-2 md:col-span-5 text-[10px] text-destructive font-body underline text-left"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
