

## Rainbow-Colored Tabs with Visible Scroll Indicator

### What changes

**1. Rainbow color assignment**

Replace the static `tab.color` for each tab with a dynamically assigned rainbow color based on the tab's index in the `allTabs` array. Colors sampled from the uploaded rainbow spectrum image (left to right):

| Index position | Color |
|---|---|
| 0 | `#E81416` (Red) |
| 1 | `#F97306` (Orange) |
| 2 | `#FACA09` (Yellow) |
| 3 | `#79C314` (Green) |
| 4 | `#487DE7` (Blue) |
| 5 | `#7B1FA2` (Purple) |
| 6 | `#C2185B` (Magenta) |
| 7+ | Cycle back through the palette |

Each tab button's background (when active) and accent bar will use the rainbow color instead of the stored `tab.color`. Inactive tabs get a subtle tinted version of their rainbow color for the text/border so users can see the color coding even before clicking.

**2. Horizontal scroll indicator**

Replace the plain `overflow-x-auto` container with a scroll-aware wrapper that shows:
- A visible **horizontal scrollbar** (custom-styled thin bar matching the brand)
- **Gradient fade-out** on the right edge when more tabs are offscreen, signaling scrollability
- The fade disappears once the user scrolls to the end

Implementation: a small wrapper div with `overflow-x-auto` plus CSS for a visible thin scrollbar (`::-webkit-scrollbar` styles) and a pseudo-element gradient overlay on the right side, toggled via a scroll event listener that checks `scrollLeft + clientWidth < scrollWidth`.

### Files

| File | Action |
|------|--------|
| `src/pages/ClientPortal.tsx` | Edit — define rainbow palette array, assign colors by index, add scroll container with fade indicator and visible scrollbar |
| `src/index.css` | Edit — add custom scrollbar styles for the tab container |

