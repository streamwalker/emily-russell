

## Plan: Rebuild PDF Export with a Dedicated Print Snapshot

The current export captures the live interactive modal with `html2canvas`, which produces broken output: form inputs render empty, Recharts `ResponsiveContainer` SVGs collapse / overlap, and content gets sliced mid-section across two pages.

Replace the live-DOM capture with a **dedicated offscreen "print view" component** that mirrors the on-screen layout but uses static, fixed-dimension elements designed to render perfectly in `html2canvas` and fit on a single landscape page.

### Approach

1. **Build a new component** `ScenarioComparePrintView` (in the same file) that renders the 3-column comparison using:
   - **Plain `<div>` text** instead of `<Input>`, `<Slider>`, `<Select>` — so values always show.
   - **Recharts with explicit fixed `width` + `height`** (no `ResponsiveContainer`) — so SVGs render at known pixel sizes and never collapse.
   - **Fixed pixel widths per column** (~470px each, ~1500px total) so layout is deterministic.
   - Same visual styling as the modal: monthly breakdown donut, principal-vs-interest bar chart, total interest, all input field labels with their current values, est. monthly payment card, total cost footer, winner ring/badge, and the 4-row delta strip below.
   - A header row inside the snapshot itself: "Payment Scenario Comparison" + generated timestamp.

2. **Render the print view offscreen during export**:
   - Mount it via a portal-like approach: append a hidden `<div>` (positioned `fixed; left: -10000px; top: 0; width: 1500px; background: white;`) to `document.body`, render the print view into it with `ReactDOM.createRoot`, await fonts + a frame, snapshot with `html2canvas`, then unmount and remove the container.

3. **Single-page PDF generation**:
   - Letter landscape = 792 × 612 pt usable ≈ 712 × 532 pt with 40pt margins.
   - The print view is designed at ~1500 × ~1100 px which scales to fit `712pt` width → resulting height ≈ 522pt, fitting on one page.
   - Compute `imgHeightPt = (canvas.height / canvas.width) * usableWidth`. If it exceeds page height (it shouldn't, but as safety), scale down to fit height instead. **No slicing.**
   - `doc.addImage(dataUrl, "PNG", margin, margin, drawW, drawH)` once → save.

4. **Remove the slicing logic and the in-modal `exportRef`** entirely — the modal DOM is no longer captured.

5. **Drop the `.pdf-export-mode` style overrides** added previously (no longer needed) — clean up `src/index.css` block.

### Print-view layout (fixed, ~1500px wide)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Payment Scenario Comparison        Generated 4/21/2026, 12:42 AM   │
├──────────────────┬──────────────────┬──────────────────────────────┤
│ SCENARIO A       │ SCENARIO B  🏆   │ SCENARIO C                   │
│ 6.88% DPA        │ 4.5% FHA         │ VA 100% · pinned             │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐             │
│ │  donut $2409 │ │ │  donut $1889 │ │ │  donut $1533 │             │
│ │  legend      │ │ │  legend      │ │ │  legend      │             │
│ └──────────────┘ │ └──────────────┘ │ └──────────────┘             │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐             │
│ │  bar chart   │ │ │  bar chart   │ │ │  bar chart   │             │
│ │  Total int.. │ │ │  Total int.. │ │ │  Total int.. │             │
│ └──────────────┘ │ └──────────────┘ │ └──────────────┘             │
│ Inputs (label/value text grid, 2 cols)                             │
│ Offer Price  264,950   Interest Rate  6.88%                        │
│ Down Pmt %   0         Down Pmt $     0                            │
│ Tax Rate     2.34%     Insurance      $100                         │
│ HOA          $51       Loan Term      30 yr                        │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐             │
│ │ Est. Monthly │ │ │ Est. Monthly │ │ │ Est. Monthly │             │
│ │ $2,409  P&I  │ │ │ $1,889  P&I  │ │ │ $1,533  P&I  │             │
│ └──────────────┘ │ └──────────────┘ │ └──────────────┘             │
│ Total cost: $626,910 │ $448,705 (gold) │ $497,553                   │
├─────────────────────────────────────────────────────────────────────┤
│ Comparison · Scenario A is baseline · lower is better              │
│ Monthly │ P&I │ Down Pmt │ Total Interest  (4 rows × 3 cells)      │
└─────────────────────────────────────────────────────────────────────┘
```

Designed to fit on **one** landscape Letter page. If a future scenario set produces taller content, the second page falls back gracefully (single image scaled down or split at the delta-strip boundary — but with current layout this won't trigger).

### Files touched

- `src/components/portal/ScenarioCompareDialog.tsx` — add `ScenarioComparePrintView` component, rewrite `handleExportPdf` to mount/snapshot/unmount it, remove `exportRef` and slicing logic.
- `src/index.css` — remove the now-unused `.pdf-export-mode` overrides if present.

### Out of scope

- Property address/photo header
- Email-the-PDF
- Multi-page support beyond the safety fallback (single page is the target)

