

## Tooltips, Source URLs, and Expense Data

### 1. Guided Tooltips in Client Portal

Add contextual tooltips and hover indicators to help first-time users navigate the dossier:

- **Tab row**: Add a subtle pulsing indicator (first visit only, stored in localStorage) with a tooltip: "Each tab represents a different builder or community — swipe or click to explore all your options."
- **Property card header**: Tooltip on the expand arrow: "Click to see full details, rental estimates, and expenses."
- **Rank tabs**: Tooltip on the Primary Residence / Income Generation tabs: "These special tabs rank ALL properties across every community to help you compare."
- **All Homes tab**: Tooltip: "View every property in your dossier in one place, regardless of builder."
- **Filter toolbar**: Small info icon with tooltip: "Use filters and sorting to narrow down by city, price, beds, or builder."

Implementation: Use the existing `Tooltip` component from `@radix-ui/react-tooltip`. Add a `TooltipProvider` wrapper and place `Tooltip`/`TooltipTrigger`/`TooltipContent` around key UI elements. Add a small `ℹ️` icon next to tabs and the filter bar as hover targets.

### 2. Source URLs for Remaining Properties (Database Update)

Populate `sourceUrl` for the 5 properties that are missing them:

| Property | Builder | Source URL |
|----------|---------|-----------|
| 2519 Sueno Point (c1) | Coventry | Coventry Homes Ladera listing |
| 14422 Blue Mesa Hill (c2) | Coventry | Coventry Homes Ladera listing |
| 966 Earp Blvd (m1) | Meritage | Meritage Homes Estancia Ranch listing |
| 16503 Boston Post Rd (o1) | Custom/BHHS | Berkshire Hathaway Cypress listing |
| 17805 Orchard Oriel Way (o2) | Lennar | Lennar Pflugerville listing |

I will need to look up the actual listing URLs for these properties via web search, then update the dossier JSON in the database.

### 3. Expense Data for 3 New Properties (Database Update)

Add estimated monthly expenses for the recently added properties:

| Property | PITI | HOA | Gas | Electric | Water | Trash |
|----------|------|-----|-----|----------|-------|-------|
| 5030 Everly Terrace (mi1) — M/I Homes, $539,990 | ~$3,200 | ~$125 | ~$80 | ~$180 | ~$60 | ~$30 |
| 2611 Precious Coral Drive (o3) — Lennar, $417,390 | ~$2,500 | ~$100 | ~$70 | ~$160 | ~$55 | ~$25 |
| 5502 Sailfish Drive (o4) — Lennar, $484,840 | ~$2,900 | ~$110 | ~$75 | ~$170 | ~$55 | ~$25 |

PITI estimates based on ~20% down, ~6.5% rate, local tax rates, and standard insurance. These can be refined later via the admin expense editor.

### Files

| File | Action |
|------|--------|
| `src/pages/ClientPortal.tsx` | Edit — add Tooltip imports, wrap tab bar and key UI elements with guided tooltips, add info icons |
| Database | Update dossier JSON — add sourceUrl for 5 properties, add expenses for 3 properties |

No new components or database schema changes needed.

