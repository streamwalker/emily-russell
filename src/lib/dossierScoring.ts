/** Scoring utilities for Rack & Stack ranking */

interface Property {
  id: string;
  address: string;
  city: string;
  community: string;
  area: string;
  builder: string;
  price: number;
  beds: number;
  baths: string;
  sqft: number;
  stories: number;
  garages: number;
  status: string;
  plan: string;
  type: string;
  notes: string;
  rentEst?: string;
  rentNote?: string;
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

export interface RankedProperty extends Property {
  rank: number;
  score: number;
  scoreSummary: string;
  sourceTab: string;
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

function parseBaths(baths: string): number {
  if (!baths) return 0;
  const n = parseFloat(baths);
  return isNaN(n) ? 0 : n;
}

function hasAirbnbPotential(prop: Property): boolean {
  const text = `${prop.notes || ""} ${prop.rentNote || ""}`.toLowerCase();
  return /airbnb|house.?hack|short.?term|str\b/i.test(text);
}

/* ── Primary Residence Scoring ── */
export function scorePrimaryResidence(
  allProperties: Record<string, Property[]>,
  tabLabels: Record<string, string>
): RankedProperty[] {
  const all = Object.entries(allProperties).flatMap(([tabKey, props]) =>
    props.map(p => ({ ...p, sourceTab: tabLabels[tabKey] || tabKey }))
  );

  if (all.length === 0) return [];

  const maxSqft = Math.max(...all.map(p => p.sqft || 0));
  const maxPrice = Math.max(...all.map(p => p.price || 0));

  const scored = all.map(p => {
    const sqftScore = maxSqft > 0 ? ((p.sqft || 0) / maxSqft) * 30 : 0;
    const bedScore = (p.beds || 0) * 8;
    const bathScore = parseBaths(p.baths) * 5;
    const garageScore = (p.garages || 0) * 6;
    const storyScore = (p.stories || 1) * 3;
    const pricePerSqft = p.sqft > 0 && p.price > 0 ? p.price / p.sqft : 999;
    const valueScore = maxPrice > 0 ? (1 - pricePerSqft / (maxPrice / (maxSqft || 1))) * 20 : 0;
    const statusBonus = /move.?in.?ready/i.test(p.status) ? 10 : /new.?construction/i.test(p.status) ? 5 : 0;

    const score = sqftScore + bedScore + bathScore + garageScore + storyScore + Math.max(0, valueScore) + statusBonus;

    // Determine top reason
    let summary = "";
    const ppsf = p.sqft > 0 && p.price > 0 ? Math.round(p.price / p.sqft) : 0;
    if (sqftScore >= 25) summary = `${p.sqft.toLocaleString()} sq ft`;
    else if (bedScore >= 32) summary = `${p.beds} bedrooms`;
    else if (ppsf > 0) summary = `$${ppsf}/sq ft`;
    else summary = p.status;

    return { ...p, score, scoreSummary: summary, rank: 0 } as RankedProperty;
  });

  scored.sort((a, b) => b.score - a.score);
  scored.forEach((p, i) => (p.rank = i + 1));
  return scored;
}

/* ── Income Generation Scoring ── */
export interface IncomeRanked {
  fullRental: RankedProperty[];
  airbnbPotential: RankedProperty[];
}

export function scoreIncomeGeneration(
  allProperties: Record<string, Property[]>,
  tabLabels: Record<string, string>
): IncomeRanked {
  const all = Object.entries(allProperties).flatMap(([tabKey, props]) =>
    props.map(p => ({ ...p, sourceTab: tabLabels[tabKey] || tabKey }))
  );

  if (all.length === 0) return { fullRental: [], airbnbPotential: [] };

  const scored = all.map(p => {
    const yld = parseYield(p.yieldEst);
    const rent = parseRent(p.rentEst);
    const yieldScore = yld * 12;
    const rentScore = rent > 0 ? (rent / 3000) * 15 : 0;
    const priceScore = p.price > 0 ? Math.max(0, (1 - p.price / 600000)) * 15 : 0;
    const bedScore = (p.beds || 0) * 3;
    const airbnbBonus = hasAirbnbPotential(p) ? 10 : 0;

    const score = yieldScore + rentScore + priceScore + bedScore + airbnbBonus;
    const summary = yld > 0 ? `${yld}% yield` : rent > 0 ? `$${rent.toLocaleString()}/mo` : "See details";

    return { ...p, score, scoreSummary: summary, rank: 0, _isAirbnb: hasAirbnbPotential(p) } as RankedProperty & { _isAirbnb: boolean };
  });

  scored.sort((a, b) => b.score - a.score);

  const fullRental = scored.map((p, i) => {
    const { _isAirbnb, ...rest } = p;
    return { ...rest, rank: i + 1 };
  });

  const airbnbList = scored
    .filter(p => p._isAirbnb || (p.beds || 0) >= 4)
    .map((p, i) => {
      const { _isAirbnb, ...rest } = p;
      return { ...rest, rank: i + 1, scoreSummary: hasAirbnbPotential(p) ? "Airbnb potential" : `${p.beds} beds – house-hack` };
    });

  return { fullRental, airbnbPotential: airbnbList };
}

/* ── Filtering & Sorting ── */
export interface FilterState {
  minPrice: number;
  maxPrice: number;
  minBeds: number;
  city: string;
  builder: string;
}

export type SortField = "price-asc" | "price-desc" | "beds" | "sqft" | "yield" | "status";

export const defaultFilters: FilterState = {
  minPrice: 0,
  maxPrice: 0,
  minBeds: 0,
  city: "",
  builder: "",
};

export function applyFilters<T extends Property>(properties: T[], filters: FilterState): T[] {
  return properties.filter(p => {
    if (filters.minPrice > 0 && p.price < filters.minPrice) return false;
    if (filters.maxPrice > 0 && p.price > filters.maxPrice) return false;
    if (filters.minBeds > 0 && (p.beds || 0) < filters.minBeds) return false;
    if (filters.city && !p.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.builder && !p.builder.toLowerCase().includes(filters.builder.toLowerCase())) return false;
    return true;
  });
}

export function applySort<T extends Property>(properties: T[], sort: SortField): T[] {
  const sorted = [...properties];
  switch (sort) {
    case "price-asc": return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "price-desc": return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "beds": return sorted.sort((a, b) => (b.beds || 0) - (a.beds || 0));
    case "sqft": return sorted.sort((a, b) => (b.sqft || 0) - (a.sqft || 0));
    case "yield": return sorted.sort((a, b) => parseYield(b.yieldEst) - parseYield(a.yieldEst));
    case "status": return sorted.sort((a, b) => {
      const rank = (s: string) => /move.?in/i.test(s) ? 0 : /new.?con/i.test(s) ? 1 : 2;
      return rank(a.status) - rank(b.status);
    });
    default: return sorted;
  }
}

export function getUniqueCities(allProperties: Record<string, Property[]>): string[] {
  const cities = new Set<string>();
  Object.values(allProperties).flat().forEach(p => {
    if (p.city) cities.add(p.city.split(",")[0].trim());
  });
  return Array.from(cities).sort();
}

export function getUniqueBuilders(allProperties: Record<string, Property[]>): string[] {
  const builders = new Set<string>();
  Object.values(allProperties).flat().forEach(p => {
    if (p.builder) builders.add(p.builder);
  });
  return Array.from(builders).sort();
}
