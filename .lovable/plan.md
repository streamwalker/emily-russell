

## Plan: Visually-Faithful PDF Export for Compare Payment Scenarios

Replace the current text-only `autoTable` PDF with a rendered-image export that mirrors the on-screen Compare modal exactly — donut charts, principal-vs-interest bar charts, all input fields, monthly payment summary cards, total cost row, and the baseline delta strip.

### Approach

Use `html2canvas` to snapshot the live compare-modal DOM and embed it into a `jsPDF` document. This guarantees pixel-perfect parity with what the user sees (charts, fonts, colors, spacing) without rebuilding any chart logic in PDF primitives.

### Changes

**1. `package.json`** — add `html2canvas` (jspdf and jspdf-autotable already present; autotable will be removed from the export path but kept installed in case other places use it).

**2. `src/components/portal/ScenarioCompareDialog.tsx`**

- Wrap the entire scrollable comparison content (the 3-column editor grid + delta strip) in a `ref`-tagged container, e.g. `exportRef`. The header/Export button stays outside this ref so it isn't captured.
- Rewrite `handleExportPdf`:
  1. Show a "Preparing PDF…" toast.
  2. Temporarily add a class to `exportRef.current` that:
     - Forces light background (`bg-white`) so charts render cleanly.
     - Expands width to a fixed export width (e.g. `1500px`) so layout matches desktop, even if user is on a smaller viewport.
     - Forces the 3-column grid (overrides `lg:grid-cols-3` for mobile users exporting).
  3. Call `html2canvas(exportRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true, windowWidth: 1500 })` to get a high-DPI canvas.
  4. Create a landscape Letter `jsPDF`. Compute scale so the canvas width fits page width minus 40pt margins.
  5. If the resulting image height exceeds page height, slice the canvas vertically into page-sized chunks and add each as a new PDF page (standard html2canvas → multi-page jsPDF pattern). Each slice drawn via `doc.addImage(sliceDataUrl, "PNG", 40, 40, imgWidth, sliceHeight)`.
  6. Add a small header on page 1 only: "Payment Scenario Comparison" + generated timestamp, drawn in jsPDF text above the image (image starts ~70pt down on page 1, ~40pt on subsequent pages).
  7. Save as `scenario-comparison-YYYY-MM-DD.pdf`.
  8. Remove the temporary export class in a `finally` block. Toast success/error.
- Drop the `autoTable` import and the manual rows/headers arrays from `handleExportPdf`. Keep `Download` icon and button UI exactly as-is.

**3. CSS — inline via the temporary export class**

Defined inside the component (toggled by adding/removing classes on `exportRef.current` before/after capture), e.g.:
- `.pdf-export-mode { width: 1500px !important; background: #ffffff !important; }`
- `.pdf-export-mode .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }`

These can live in `src/index.css` under a small `@layer utilities` block, or be applied as inline style overrides in JS. Inline JS overrides are simpler — set `el.style.width = "1500px"` etc., snapshot, then revert.

### What the exported PDF will contain (matching screenshots 1 & 2)

Page 1+ (continuous capture, paginated automatically):
- Three SCENARIO A / B / C columns, each with:
  - Scenario name dropdown label (rendered as the visible selected name)
  - Monthly Payment Breakdown donut chart with center $/month label and legend
  - Principal vs Interest bar chart with term toggle (whatever is currently selected) and "Total Interest Over N Years"
  - All input fields (Offer Price, Interest Rate slider+number, Down Payment % and $, Tax Rate, Insurance, HOA, Loan Term)
  - Est. Monthly Payment summary card (P&I, Taxes, Ins, HOA)
  - Total cost of loan footer (winner highlighted in primary color, exactly as on screen)
- "Lower total cost" trophy badge on the winning column (rendered from the live DOM)
- Comparison · Scenario A is baseline · lower is better — the 4 delta rows (Monthly payment, P&I, Down payment, Total interest), each as 3 cards with `vs A: ±$…` in red/primary just like on screen.

### Technical notes

- `html2canvas` works with Recharts (SVG) — Recharts renders inline SVG which html2canvas rasterizes correctly. Donut + bar chart will appear identical.
- Custom fonts (Playfair Display, DM Sans): html2canvas captures computed styles, so as long as the fonts are loaded in the page (they are, since the modal is open), they'll render in the snapshot. We'll add `await document.fonts.ready` before capture as a safety net.
- Sliders, inputs, and selects render as their visible state — the dropdown shows the currently-selected scenario name (not an open menu).
- Scale 2 keeps charts crisp; landscape Letter @ 40pt margins gives ~752pt usable width, well-sized for a 1500px source canvas.
- Multi-page slicing uses the standard pattern: render once to a tall canvas, then for each page create a temporary canvas of page-height, `drawImage` the slice, `toDataURL`, `doc.addImage`, `doc.addPage`.

### Out of scope

- A separate "summary table" page (the current text table is being fully replaced, per request)
- Embedding property photo / address header (existing export doesn't have it either)
- Email-the-PDF flow

### Files touched

- `package.json` (+ lockfile) — add `html2canvas`
- `src/components/portal/ScenarioCompareDialog.tsx` — add `exportRef`, rewrite `handleExportPdf`, drop `autoTable` import

