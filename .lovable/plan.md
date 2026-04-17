

## Plan: Add "Rent vs. Buy Calculator" Promo Section on Homepage

### Placement
Insert a new full-width promo section in `src/pages/Index.tsx` between the "Featured New Home Deals" section (ends line 569) and the dark "Reviews" section (line 572). This placement is ideal because:
- Visitors browsing new construction naturally ask "should I rent or buy?" — perfect contextual hand-off
- Sits between two strong sections so it gets eyeballs without disrupting flow
- The cream background of New Homes → tools card → dark Reviews creates good visual rhythm

### What it looks like
A single centered card (matching existing `card-hover` / `er-heading` brand styling — Playfair Display heading, gold accent, charcoal body, cream background section):

```text
┌─────────────────────────────────────────────────────┐
│  TOOLS & CALCULATORS                                │
│                                                     │
│  Should You Rent or Buy in San Antonio?            │
│                                                     │
│  Use our free 2026 calculator with real San        │
│  Antonio property tax, insurance, and HOA data     │
│  to find your break-even point in seconds.         │
│                                                     │
│  ✦ Live mortgage rates    ✦ Local tax rates        │
│  ✦ Break-even analysis    ✦ 30-year projections    │
│                                                     │
│        [ Launch Calculator → ]                      │
└─────────────────────────────────────────────────────┘
```

### Implementation details

1. **New section** (inserted ~line 570 in `src/pages/Index.tsx`):
   - `<section id="tools" className="py-[92px] px-10 bg-[hsl(var(--blush))]/30">` (subtle blush tint to differentiate from cream above and dark below)
   - Wrapped in `<FadeIn>` for animation consistency
   - Uses existing brand classes (`er-label`, `er-heading`, `er-body`, `btn-er-primary`)
   - CTA: `<a href="/rent-vs-buy">` with `onClick={() => trackLinkClick("rent_vs_buy_cta", "homepage_tools_section")}` to mirror existing analytics tracking

2. **Add to navigation** — Update `NAV_ITEMS` (line 74) to optionally add a "Tools" anchor, OR keep the existing "Rent vs. Buy" nav link (already there) which now scroll-targets are unchanged. Recommendation: leave nav as-is since "Rent vs. Buy" link already exists and goes directly to the page.

3. **No new files** — Pure addition to `src/pages/Index.tsx`.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Insert new `<section id="tools">` block between New Homes (line 569) and Reviews (line 572) |

### Why this placement (not hero)
The hero is already loaded with the home valuation lead capture form (the site's #1 conversion goal per brand memory). Adding a second CTA there would dilute it. A dedicated mid-page tools section drives traffic to /rent-vs-buy without hurting lead capture.

