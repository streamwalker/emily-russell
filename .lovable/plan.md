

## Rack & Stack + Filter/Sort for Client Portal

### What it does
Adds two new special tabs to the portal — **"🏠 Primary Residence"** and **"💰 Income Generation"** — that pull ALL properties from every builder tab and rank them best-to-worst for each use case. Also adds filter/sort controls to the existing builder tabs.

### Ranking Logic

**Primary Residence score** (higher = better):
- Square footage (weighted)
- Bedroom count
- Bathroom count
- Garage count
- Stories (more = better for families)
- Lower price per sqft = better value
- Status bonus (Move-In Ready scores higher)

**Income Generation score** (higher = better):
- Gross yield % (parsed from `yieldEst`) — heaviest weight
- Monthly rent estimate (parsed from `rentEst`)
- Lower purchase price = lower barrier to entry
- Bed count (more rooms = Airbnb/house-hack potential)
- Bonus for properties with rent notes mentioning "Airbnb" or "house hack"

Each property card in these views will show its **rank number** and a brief rationale badge (e.g., "Best Yield: 7.2%" or "Best Value/SqFt").

### Filter/Sort Controls (all tabs)
A toolbar below the tab bar with:
- **Sort by**: Price (↑↓), Beds, SqFt, Yield, Status
- **Filter by**: Min/Max Price, Min Beds, City, Builder
- Filters apply to builder tabs AND the rack-and-stack views

### UI Changes — `src/pages/ClientPortal.tsx`

1. **Add two synthetic tabs** appended after the builder tabs:
   - `{ key: "rank-primary", label: "🏠 Primary Residence", color: "#5B7FA5" }`
   - `{ key: "rank-income", label: "💰 Income Generation", color: "#2e7d32" }`

2. **Scoring functions** — pure utility functions that take `Property[]` and return sorted arrays with a `rank` and `scoreSummary` field.

3. **Filter/Sort toolbar** — a collapsible row of controls rendered between the accent bar and the content area. State managed with `useState` for sort field, sort direction, and filter values.

4. **Ranked property cards** — in rank views, each `PropertyRow` gets a rank badge (#1, #2, etc.) and a small tag explaining why it ranked there (top metric).

5. **Sub-categories in Income Generation** — two sections within the income tab:
   - "Full Rental" — ranked by gross yield
   - "Airbnb / House-Hack Potential" — ranked by bed count + rent estimate, with bonus for properties whose notes mention flexible rental strategies

### Files

| File | Action |
|------|--------|
| `src/pages/ClientPortal.tsx` | Edit — add ranking tabs, scoring logic, filter/sort toolbar, rank badges |

No database changes needed — all computed client-side from existing dossier data.

