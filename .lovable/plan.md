## Plan: Print / PDF Share for Client Property Dossier

Add a one-click way for clients (and Emily) to print or save the dossier as a PDF, with each property card matching the layout shown in your screenshot — header bar, Property Details column, Agent Notes column, Tour Requested, monthly payment estimator link, and View Listing link.

### Approach: browser-native print → PDF

Use `window.print()` with a dedicated `@media print` stylesheet. This is the simplest, most reliable, zero-dependency path:
- **Print** → opens the OS print dialog
- **Save as PDF** → same dialog, "Save as PDF" destination (built into every modern browser/OS)
- No edge function, no headless Chromium, no extra dependencies, no data round-trip
- Works offline, works on the client's own device, works for both authenticated portal users and read-only shared views

A dedicated server-rendered PDF (Puppeteer/Playwright in an edge function) is overkill here — the dossier is already perfectly rendered HTML; we just need print styles that flatten the interactive UI into a paper-friendly layout.

### What gets added

**1. New "Print / Save as PDF" button**
Location: `ClientDossierView.tsx` header (line ~774, next to the date/phone block, top-right).
- Visible in both admin preview and client read-only views
- Small icon button (Printer icon from lucide-react) with tooltip "Print or Save as PDF"
- onClick: `window.print()`

**2. Print stylesheet** (`src/styles/dossier-print.css`, imported by `ClientDossierView.tsx`)

The stylesheet will, inside `@media print`:

- **Hide non-essential UI**: filter toolbar, tab strip, dashboard toggle, sort controls, feedback textarea, comment threads, expand/collapse arrows, the floating Print button itself, Realtime toasts, browser scrollbars
- **Force-expand every property card**: override the `isExpanded` collapse so all property details, agent notes, tour requests, expenses, and rental data print on every card (not just the one the user clicked open)
- **Match the screenshot layout per card**:
  - Brown/accent header bar (address, community, BED/BATH/SQ FT, price, status pill)
  - Two-column body: Property Details (left) and Agent Notes (right)
  - "Tour Requested" block when a date is set
  - "Estimate Monthly Payment ▸" caption preserved as a static label (the calculator itself stays collapsed in print — too much UI)
  - "View Listing →" link with the URL printed inline next to it (since hyperlinks aren't clickable on paper): `View Listing → https://…`
- **Page setup**: Letter size, 0.5" margins, `print-color-adjust: exact` so the brown/charcoal/gold brand colors print
- **Page-break hygiene**: `break-inside: avoid` on each property card so cards don't split across pages; `break-after: page` between tabs when "All Homes" is active
- **Header footprint**: print a compact version of the dossier header on page 1 only — Client name, "Prepared by Emily Russell · Fathom Realty · TREC #791742", date, phone — so the printout is self-identifying for any agent or lender who receives it
- **Repeating footer** (via `@page`): TREC compliance line + page numbers (browser-supported `@page` margins; we'll keep this lightweight)

**3. Force-expand-for-print logic**

Two options, picking the cleaner one:
- Add a `data-print-expanded` attribute on every property row and a CSS rule `@media print { [data-print-expanded] .card-collapsed-body { display: block !important; }}` — no React state changes, no re-render, prints whatever is in the DOM
- This means the collapsed cards' inner JSX must always be rendered (with `display: none` when collapsed in screen view) instead of conditionally mounted via `{isExpanded && (…)}`

We'll convert the `{isExpanded && (…)}` block in `ClientDossierView.tsx` (line 325) to always render the body wrapped in a div with `className={isExpanded ? "block" : "hidden print:block"}`. Same visual behavior on screen, full content available for print.

### What we're explicitly NOT doing (this round)

- No headless-Chromium PDF generation in an edge function (saves cost and complexity; can be added later if you want server-side PDFs for email attachments)
- No "Email this dossier as PDF" button (separate feature — would require the headless approach)
- No per-property print (whole-dossier print only; clients can use browser print preview to pick page ranges if they want a single property)
- No image generation / property photos in print (the dossier currently shows no property photos in the card UI)
- No changes to `DossierDashboardView` print formatting in this pass — print will always render the list view of the active tab. (We can add dashboard print later if you want.)

### Files touched

- `src/components/portal/ClientDossierView.tsx` — add Printer button to header; convert `{isExpanded && (…)}` to always-rendered with `hidden print:block`; import the print stylesheet
- `src/styles/dossier-print.css` — **new file**, all print rules

### Memory update

Add a small entry to `mem://features/client-portal` (or a new `mem://features/dossier-print`) noting that print/PDF is browser-native via `window.print()` and a dedicated stylesheet, not server-rendered.
