

## Add Favorites Filter + Grade Badge on Property Headers

### Changes

**1. Add `favoritesOnly` to FilterState (`src/lib/dossierScoring.ts`)**
- Add `favoritesOnly: boolean` to the `FilterState` interface and `defaultFilters`
- The actual filtering by favorites will happen in `ClientPortal.tsx` since `applyFilters` doesn't have access to the interactions map

**2. Add Favorites toggle to toolbar (`src/components/portal/FilterSortToolbar.tsx`)**
- Add a new prop `favCount: number` to show how many favorites exist
- Add a heart toggle button next to the existing Filters button: "❤ Favorites (N)" that toggles `favoritesOnly` in the filter state
- Include `favoritesOnly` in the `hasActive` check

**3. Apply favorites filter in ClientPortal (`src/pages/ClientPortal.tsx`)**
- After `applyFilters`, if `filters.favoritesOnly` is true, further filter the list to only properties where `interactions[prop.id]?.is_favorite === true`

**4. Show grade badge on property card header (`src/pages/ClientPortal.tsx`)**
- In the `PropertyCard` component, next to the Heart icon (line ~260), render the grade as a small colored badge if `interaction?.grade` exists
- Color coding: A-range = green, B-range = blue, C-range = yellow, D-range = orange, F-range = red
- Small pill badge, e.g. `<span className="text-[10px] font-bold px-1.5 py-0.5 rounded ...">A+</span>`

### Files

| File | Action |
|------|--------|
| `src/lib/dossierScoring.ts` | Add `favoritesOnly` to `FilterState` and `defaultFilters` |
| `src/components/portal/FilterSortToolbar.tsx` | Add favorites toggle button, accept `favCount` prop |
| `src/pages/ClientPortal.tsx` | Apply favorites filter after `applyFilters`, add grade badge to card header |

