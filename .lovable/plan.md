

## Inline Payment Calculator + EquiForge Link

### What changes

**1. Inline mortgage calculator per property card**

Add a collapsible "Estimate Payment" section inside each expanded property card (below the existing expenses section, above "View Listing"). When toggled open, it shows:

- **Offer Price** — pre-filled with `prop.price`, editable
- **Down Payment %** / **Down Payment $** — linked sliders/inputs (changing one updates the other)
- **Interest Rate %** — slider + input, default 6.5%
- **Annual Tax Rate %** — default 2.2% (Texas average)
- **Monthly Homeowner's Insurance** — default $150
- **Monthly HOA Fee** — pre-filled from `prop.expenses?.hoa || 0`
- **Estimated Monthly Payment** — computed live as: `P&I + (price × taxRate / 12) + insurance + HOA`

The P&I formula: `loanAmount × [r(1+r)^n] / [(1+r)^n - 1]` where `r = rate/12`, `n = 360` (30-year).

All inputs use existing `Input` and `Slider` components. The calculator state is local to each card (no database writes).

**2. "Full Calculator on EquiForge" link**

Below the inline calculator, add a link: **"Advanced Calculator on EquiForge →"** that opens `https://equiforge.ai/try/payment` in a new tab. This gives users access to closing costs, credit score ranges, PMI, and other advanced features.

### New component

Create `src/components/portal/PaymentCalculator.tsx` — a self-contained component that takes `price` and `hoaFee` as props and renders the calculator UI. This keeps `ClientPortal.tsx` clean.

### Files

| File | Action |
|------|--------|
| `src/components/portal/PaymentCalculator.tsx` | Create — inline mortgage calculator component with all inputs, sliders, and live computation |
| `src/pages/ClientPortal.tsx` | Edit — import `PaymentCalculator`, render it inside the expanded property card section with a toggle button |

