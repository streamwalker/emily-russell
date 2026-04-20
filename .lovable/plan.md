

## Plan: Numbers-Only Compare Table + Always-Duplicate New Scenario

### What changes

**1. Compare mode → numbers-only A vs B table (no editing, no charts)**

Replace the current full-width editable modal with a compact comparison shown inline (in a smaller `Dialog`). Two scenario pickers at the top, then a side-by-side numbers table with deltas. No chart, no input fields — purely a read-only comparison surface.

Table rows (in this order):
- Monthly payment (total PITI + HOA)
- Principal & Interest
- Monthly taxes
- Monthly insurance
- Monthly HOA
- Down payment
- Loan amount
- Interest rate
- Loan term
- Total interest (life of loan)
- Total cost of loan (P&I × term)

Each row shows: label · Scenario A value · Scenario B value · Δ (signed, color-coded — lower-is-better in green for cost rows, neutral for term/rate).

Footer note: *"To edit values, close this and switch to a scenario tab."*

**2. "+ New scenario" → always duplicates (no menu)**

Replace the `DropdownMenu` with a single button that calls `createScenario("duplicate")` directly. If there's no active scenario yet (edge case), fall back to `"blank"`. Tooltip on the button: *"Duplicate current scenario"*.

### Files changed

| File | Change |
|---|---|
| `src/components/portal/ScenarioCompareDialog.tsx` | Rewrite: drop the two `<ScenarioEditor>` panels and inline edit handlers; render a single numbers-only stat table with two scenario `<Select>` pickers above it. Narrower max width (~720px). Remove the `onScenarioChange` prop. |
| `src/components/portal/PaymentCalculator.tsx` | Replace the `DropdownMenu` "New scenario" trigger with a plain button calling `createScenario("duplicate")`. Drop the unused `DropdownMenu*` imports. Remove `onScenarioChange` from `<ScenarioCompareDialog>` usage. |

### Out of scope

- Editing scenarios from inside the compare view (intentional — keeps it focused)
- Comparing more than 2 scenarios at once
- Exporting the comparison table
- A separate "Blank" creation path (always duplicates now)

