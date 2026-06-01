# Screen — Payment Calculator

**Web source**: `src/components/portal/PaymentCalculator.tsx`, `src/lib/paymentCalc.ts`. **Memory ref**: `mem://features/mortgage-calculator`.

## Purpose
PITI mortgage calculator with pie chart, amortization, and saved estimates (`saved_estimates` table).

## Inputs

| Field | Default | Bounds |
|-------|---------|--------|
| Offer price | property.price ?? 400000 | $50K–$5M |
| Down payment % | 20 | 0–50 |
| Interest rate | 6.5 | 0.1–15 |
| Loan term (years) | 30 | 5/10/15/20/25/30 |
| Tax rate % | 2.2 | 0.5–4 |
| Insurance ($/mo) | 150 | 0–2000 |
| HOA ($/mo) | 0 | 0–2000 |

## Outputs

- Monthly PITI breakdown
- **Pie chart** (Swift Charts `SectorMark`): principal / interest / tax / insurance / HOA
- **Amortization bar** (Swift Charts `BarMark` stacked): principal vs interest by year
- Total interest, total paid, payoff date

## Math
Port `paymentCalc.ts` to Swift exactly. Use `Decimal` (not `Double`) for currency.

## Saved estimates

Backed by `saved_estimates` table:
- Pinned estimate per property visible by default.
- "Save as scenario" → name + persist row.
- Admins can save scenarios on behalf of any client (`last_saved_by_admin = true`).

## Scenario compare

Equivalent to `ScenarioCompareDialog.tsx`. Show 2-3 saved scenarios side-by-side in a sheet. Use `ScenarioComparePrintView` SwiftUI equivalent for shareable PDF.
