# Screen — Client Dossier (largest)

**Web source**: `src/components/portal/ClientDossierView.tsx` (1156 lines). **Memory refs**: `mem://features/client-portal`, `mem://features/property-interactions`, `mem://features/dossier-analytics`, `mem://ux/guided-portal-navigation`, `mem://features/dossier-change-notifications`.

## Purpose
Browse, filter, rank, grade, favorite, and tour properties curated by Emily.

## Top-level layout

```
NavigationStack
  ClientDossierView
    ├── Sticky header: dossier title + change-summary chips
    ├── Tab bar (horizontal scroll, rainbow-coded)
    │     - Dashboard
    │     - Properties (default)
    │     - Comparison
    │     - Payment Calculator
    │     - Documents
    │     - Primary Residence (synthetic)
    │     - Income Generation (synthetic)
    └── Tab content
```

## Properties tab

- Filter/sort toolbar (`FilterSortToolbar` equivalent): tags, beds, baths, price range, grade, favorites-only.
- Grid of `PropertyCard`:
  - Photo (lazy via AsyncImage, fallback Google Static Maps thumbnail from `get-map-thumbnail`)
  - Address, price, beds/baths/sqft
  - Grade badge (top-right)
  - Favorite heart (top-left)
  - NEW / UPDATED badge if applicable
- Tap → `PropertyDetailSheet` (`.sheet(item:)`).

## Property interactions

Backed by `property_interactions` rows:

| Field | UI |
|-------|-----|
| `is_favorite` | Heart toggle on card + detail |
| `grade` | Segmented control A+ → F- (15 options); persisted on change |
| `preferred_tour_date`, `preferred_tour_time` | DatePicker + TimePicker in "Request Tour" sheet |
| `comments` | Long text editor in detail sheet → also creates `comment_replies` thread |

All writes go through `DossierStore.upsertInteraction(propertyId:...)` with optimistic update.

## Grading rules

Match `dossierScoring.ts`:
- A+ to F- (15 grades).
- Rack-and-stack ranking computed from grade weights: A+ = 100, A = 95, A- = 90, B+ = 85... F- = 0.
- Tied scores: secondary sort by `created_at` of interaction.

## Synthetic tabs

"Primary Residence" and "Income Generation" are virtual filters over the same property list, driven by tag presence (`primary-residence`, `income-generation`). Defined in `dossierScoring.ts`.

## Change detection

Mirror `src/lib/dossierChangeTracking.ts`:
- Compare `property.lastUpdatedAt` vs `dossierViews[user_id].last_viewed_at`.
- Properties added after that timestamp → NEW.
- Existing properties whose `lastUpdatedAt` is newer → UPDATED.
- On view, upsert `dossier_views` row.

## Realtime

Subscribe to `comment_replies` for any interaction owned by current user. Show toast + badge on the property when admin replies.

## Print/PDF

Web uses `window.print()` + `src/styles/dossier-print.css`. iOS:
- "Share dossier" → generates PDF via `UIPrintPageRenderer` from a hidden `DossierPrintView`.
- Use `ShareLink(item: PDFDocument(...))`.
- Memory ref `mem://features/dossier-print`.

## Performance

- Lazy-load images (`AsyncImage` with placeholder).
- Cache decoded dossier in `DossierStore`; refresh on pull-to-refresh.
- For 100+ properties: use `LazyVGrid` not `Grid`.
