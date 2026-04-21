

## Plan: Full-Width Editable Compare Modal + Blank New Scenarios

### What changes

**1. Compare mode → full-width side-by-side editable modal**

Replace the compact read-only A vs B table with a wide modal containing two fully editable `ScenarioEditor` panels side-by-side, plus a slim delta strip below summarizing key differences.

Layout:
```text
┌──────────────────────────────────────────────────────────────┐
│  Compare Payment Scenarios                              [X]  │
├──────────────────────────────────────────────────────────────┤
│  [ Scenario A ▼ ]              [ Scenario B ▼ ]              │
├───────────────────────────────┬──────────────────────────────┤
│                               │                              │
│   <ScenarioEditor A />        │   <ScenarioEditor B />       │
│   (full inputs + pie chart)   │   (full inputs + pie chart)  │
│                               │                              │
├───────────────────────────────┴──────────────────────────────┤
│  Delta strip: Monthly Δ · P&I Δ · Down Δ · Total Interest Δ  │
└──────────────────────────────────────────────────────────────┘
```

- Modal width: `max-w-[1200px] w-[96vw]`, `max-h-[92vh]` with internal scroll.
- Two scenario pickers at the top (Select dropdowns) — switching either picker re-mounts that side's editor with the chosen scenario.
- Both editors are fully interactive: edits autosave through the same `onScenarioChange` path used in the main calculator (debounced save to `saved_estimates`).
- A compact delta strip at the bottom shows live deltas (B − A) for: Monthly payment, P&I, Down payment, Total interest. Color-coded lower-is-better.
- Footer note removed (editing is now in-modal).

**2. "+ New scenario" → always create a blank scenario from system defaults**

Replace the duplicate-only button with a single button that calls `createScenario("blank")`. Blank uses `defaultInputs(property.price, property.hoa)` from `paymentCalc.ts`. Tooltip: *"New scenario from defaults"*.

### Files changed

| File | Change |
|---|---|
| `src/components/portal/ScenarioCompareDialog.tsx` | Rewrite again: drop the read-only stat table; render two side-by-side `<ScenarioEditor>` panels with their own picker. Re-add `onScenarioChange` prop so edits persist. Add a slim delta strip below the editors. Width → `max-w-[1200px]`. Responsive: stack vertically below `lg`. |
| `src/components/portal/PaymentCalculator.tsx` | Change "+ New scenario" button to call `createScenario("blank")`. Update tooltip text. Pass `onScenarioChange` to `<ScenarioCompareDialog>` (re-wire the existing autosave handler). |

### Technical details

- `ScenarioEditor` already accepts `onChange` and is the same component used in the main view — no edits needed to it.
- Autosave path: changes inside the modal flow through the existing `updateScenario` → debounced Supabase upsert in `PaymentCalculator`. Both panels write back to the same scenarios array, so the parent state stays consistent and the main view reflects edits immediately on close.
- Delta strip uses `computeBreakdown()` + `generateAmortization()` already in `paymentCalc.ts`.
- Responsive: at `< lg` the two editors stack vertically (each full width), pickers stack too. Delta strip becomes a 2×2 grid on mobile.

### Out of scope

- Comparing more than 2 scenarios
- Exporting the comparison
- Locking one side as a "baseline" reference
- Per-field reset inside the modal

