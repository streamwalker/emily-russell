

## Plan: Add % Change to Comparison Delta Strip

Show a percentage-change indicator next to each dollar delta in the "Comparison · Scenario A is baseline" strip, both in the live modal and in the exported PDF, so clients see relative savings at a glance.

### What changes visually

For each delta cell (Scenarios B and C), the existing line:

```
vs A: −$520
```

becomes:

```
vs A: −$520  (−18%)
```

- Same color rules: green/primary when better (lower), red/destructive when worse (higher), muted when zero.
- Baseline column (A) keeps its `baseline` label unchanged.
- If baseline value is 0 (edge case, e.g. $0 down payment), show `—` instead of a percentage to avoid divide-by-zero.
- Rounded to nearest whole percent. Sign uses the same `−` / `+` glyphs already in use.

### Files touched

**1. `src/components/portal/ScenarioCompareDialog.tsx`** — update the `DeltaCell` component:
- Compute `pct = base === 0 ? null : Math.round((diff / base) * 100)`.
- Append `(${sign}${Math.abs(pct)}%)` to the existing text, or `(—)` when `pct` is null.
- No changes to `DeltaRow`, layout, or color logic.

**2. `src/components/portal/ScenarioComparePrintView.tsx`** — apply the same change to its internal delta-cell renderer so the exported PDF matches the on-screen strip exactly.

### Out of scope

- Reordering or restyling the delta cards
- Percentage on the baseline column itself
- Per-row custom thresholds or color scales

