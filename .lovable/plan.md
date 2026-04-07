

## Move Charts to Fill Empty Space

The Payment Estimator currently sits inside the right column of the property card's 2-column grid. Its own internal 2-column layout creates charts that are squeezed into a narrow space while the left column (below Property Details) sits empty.

### Approach

Move the `PaymentCalculatorToggle` outside of the right column so it spans the full width of the property card (`col-span-2`). This lets the PaymentCalculator's internal 2-column grid (charts left, inputs right) naturally fill the entire width, with charts occupying the left half where the empty space currently is.

### Changes to `src/pages/ClientPortal.tsx`

Move the `PaymentCalculatorToggle` block (currently at ~line 359-361) from inside the right `<div>` (which starts at line 293) to after the closing `</div>` of the 2-column grid (after line 373's `</div>`), but still inside the expanded panel. Wrap it so it sits below the grid and spans full width.

Alternatively — and more precisely — make it a `col-span-2` item inside the existing grid so it stays within the expanded content flow.

### Changes to `src/components/portal/PaymentCalculator.tsx`

Increase chart heights now that they have more horizontal room:
- Pie chart height from 220 to 260
- Pie chart inner/outer radius from 55/85 to 70/100
- Bar chart height from 200 to 220

### Files

| File | Action |
|------|--------|
| `src/pages/ClientPortal.tsx` | Edit — move PaymentCalculatorToggle to span full width (`col-span-2`) inside the property expanded grid |
| `src/components/portal/PaymentCalculator.tsx` | Edit — increase chart sizes to better fill the space |

