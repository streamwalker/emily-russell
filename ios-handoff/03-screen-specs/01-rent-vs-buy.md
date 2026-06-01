# Screen — Rent vs Buy

**Web source**: `src/pages/RentVsBuy.tsx`, `public/rent-vs-buy.html`.

## Purpose
Educational calculator + lead magnet. Compares monthly cost of renting vs. buying in San Antonio.

## Inputs
- Home price (slider, $150K–$1M)
- Down payment % (slider, 0–25)
- Interest rate (stepper, default 6.5)
- Loan term (segmented: 15 / 30)
- Monthly rent (text field)
- Years to stay (slider, 1–10)

## Outputs
- Crossover year ("Buying breaks even in **year 4**")
- Stacked area chart (Swift Charts): cumulative cost rent vs buy
- Equity built at end of period
- Key assumptions list

## CTA
"Want a personalized analysis?" → scroll to embedded lead form (reuses `ContactFormSection`).

## Math
Port `src/lib/paymentCalc.ts` to `Sources/Logic/PaymentCalc.swift`. PITI = P + I + (price × taxRate/12) + insurance + HOA. Equity = down payment + principal paid - selling costs (assume 6% at exit).

## Notes
- Currency: USD, locale-aware `NumberFormatter`.
- Chart: use `Chart { AreaMark... }` with two series; legend below.
- Disclaimer footnote required: "Estimates only. Not financial advice. Consult a licensed lender."
