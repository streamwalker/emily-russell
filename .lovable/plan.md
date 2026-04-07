

## Payment Estimator: Loan Term Selector + Total Interest Stat

### Changes to `src/components/portal/PaymentCalculator.tsx`

**1. Add Loan Term selector to the inputs section (right column)**

Add a new input row in the inputs grid (after the HOA field) with a "Loan Term" label and the same term buttons (5, 15, 20, 30 yr) that currently exist on the bar chart. The `loanTerm` state already drives the P&I calculation on line 115, so no computation changes needed — just exposing the control in the inputs area.

**2. Add total interest stat below the bar chart**

Compute total interest from the existing `amortData` array: `amortData.reduce((sum, d) => sum + d.interest, 0)`. Display it as a small summary line below the bar chart legend, e.g.:

```
Total Interest Over 30 Years: $287,432
```

Styled consistently with the existing `text-[10px] text-muted-foreground font-body`.

### Files

| File | Action |
|------|--------|
| `src/components/portal/PaymentCalculator.tsx` | Edit — add loan term buttons to inputs grid, add total interest stat below bar chart |

