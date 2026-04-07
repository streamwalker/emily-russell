

## Add Interaction Summary + Back-to-Dossier Button on Main Site

### Changes

**1. Interaction Summary Section (`src/pages/ClientPortal.tsx`)**

Add a summary bar below the header (above the tabs) showing three stats:
- **Favorited**: count of properties with `is_favorite === true`
- **Graded**: count of properties with a non-null `grade`
- **Tours Scheduled**: count of properties with a non-null `preferred_tour_date`

These counts are derived from the existing `interactions` state. Render as a compact row of three stat cards with icons (Heart, Star/GraduationCap, Calendar) styled to match the dark header theme.

**2. Back-to-Dossier Button on Main Site (`src/pages/Index.tsx`)**

The nav already has a "Client Portal" text link. Enhance it by making it more prominent — change it to a styled button (matching the phone CTA style but secondary) so it stands out as a clear navigation path back to the portal/dossier. This applies to both desktop and mobile nav.

### Files

| File | Action |
|------|--------|
| `src/pages/ClientPortal.tsx` | Add summary stats bar below header with graded/favorited/tours counts |
| `src/pages/Index.tsx` | Style the existing "Client Portal" link as a more prominent button in both desktop and mobile nav |

