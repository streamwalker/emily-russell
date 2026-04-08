

## Fix Overlapping Labels in Dashboard Charts

The labels are getting truncated and overlapping because (1) the `shortAddr()` function aggressively truncates to 2 words, (2) the YAxis width is only 55px for horizontal bar charts, and (3) the chart height is fixed at 200px regardless of how many properties there are.

### Changes in `src/components/portal/DossierDashboardView.tsx`

**1. Increase `shortAddr` to show more of the address**
- Change from 2-word truncation to showing the street number + first 2 words of the street name, with a higher character limit (~25 chars) before truncating.

**2. Make chart height dynamic based on property count**
- Instead of fixed `h-[200px]`, calculate height: `max(200, numProperties * 28)` px for horizontal bar charts (Price, $/sqft, Yield) so each bar gets adequate vertical space.

**3. Widen YAxis for horizontal bar charts**
- Increase `width` from `55` to `100` on YAxis for the three horizontal bar charts (Price, $/sqft, Yield) so addresses don't overlap.
- Increase left margin from `60` to `100` to match.

**4. Increase bottom margin for vertical bar charts**
- For Beds & Baths and Monthly Expenses charts, increase `bottom` margin from `30` to `50` and reduce font angle overlap by ensuring adequate tick spacing.

**5. Widen matrix column headers**
- Change `min-w-[130px]` to `min-w-[160px]` and remove `max-w-[160px]` so the full address can display. Remove `truncate` class and allow wrapping with `whitespace-normal` and `leading-tight`.

### Files

| File | Action |
|------|--------|
| `src/components/portal/DossierDashboardView.tsx` | Update chart dimensions, label widths, and address formatting |

