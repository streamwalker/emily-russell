

## Property Comparison Dashboard — Matrix View + KPI Charts

### What We're Building

A new tab-like toggle in the client dossier that switches from the current card-based property list to a full-screen comparison dashboard with two sections:

1. **KPI Summary Charts** (inspired by image 1) — A grid of 4-6 charts showing portfolio-level metrics: price distribution bar chart, price per sq ft comparison, beds/baths breakdown, grade distribution donut, expense breakdown, and yield comparison.

2. **Property Comparison Matrix** (inspired by image 2) — A feature-comparison table with properties as columns and attributes as rows, using checkmarks and values. Rows include: price, sqft, beds, baths, stories, garages, status, grade, favorite, PITI, rent estimate, yield, net cash flow. Toggle between "All Homes" and "Selected Homes" (favorited/graded properties).

### Steps

**1. Create `src/components/portal/DossierDashboardView.tsx`**

New component that receives `properties`, `interactions`, and renders:

- **Toggle bar** at top: "All Homes" | "Favorited/Graded Only"
- **KPI Charts section** (top half, 2x3 grid using Recharts — already available via the chart UI component):
  - Horizontal bar chart: price by property (sorted)
  - Bar chart: $/sq ft comparison
  - Grouped bar: beds & baths by property
  - Donut/pie: grade distribution (A/B/C/D/F counts from interactions)
  - Stacked bar: monthly expense breakdown (PITI, HOA, utilities)
  - Bar chart: projected yield comparison
- **Comparison Matrix** (bottom half): Styled table matching image 2 aesthetic — dark header row with property names as columns, attribute rows with alternating gray bands, checkmarks for boolean features (favorite, has garage, move-in ready), values for numeric fields

**2. Add toggle button in `ClientDossierView.tsx`**

- Add a "📊 Dashboard View" / "📋 List View" toggle button near the filter toolbar
- When dashboard mode is active, hide the property card list and render `DossierDashboardView` instead
- Pass all properties (or filtered subset), interactions, and grades

**3. Recharts integration**

Use the existing `src/components/ui/chart.tsx` (Recharts wrapper) for all charts. No new dependencies needed.

### Files

| File | Action |
|------|--------|
| `src/components/portal/DossierDashboardView.tsx` | New — KPI charts + comparison matrix |
| `src/components/portal/ClientDossierView.tsx` | Add dashboard/list toggle, render new component |

