## CMA Auto-Fill: Subject + Comps via Firecrawl + Claude

Add address-driven auto-fill to the existing CMA editor. Emily types an address, clicks **Auto-Fill**, and the platform scrapes the web to populate subject details and pull recent comparable sales within configurable radius/timeframe.

### User flow

1. In the CMA editor, the **Subject** card gets a single address input + **Auto-Fill from Address** button.
2. Spinner shows progress: "Looking up property → Finding comps → Extracting details".
3. Subject fields fill in: beds, baths, sqft, year built, lot size, builder, condition notes (from listing descriptions).
4. Comps section auto-populates with up to 6 recent sales. Each is editable; Emily can delete/swap.
5. Two sliders above the comps: **Radius** (0.25 – 2 mi, default 0.5) and **Window** (3 – 24 months, default 6). Changing them re-runs comp search only.
6. Emily reviews/edits everything, then clicks **Generate** (existing Claude narrative flow, unchanged).

### Data sourcing strategy

**Split approach** (per your selection):

- **Subject details** → Firecrawl `search` for the address across Zillow / Redfin / Realtor.com / county appraisal sites → scrape top 1–2 results → Claude extracts structured fields (beds, baths, sqft, year built, lot, builder, condition notes).
- **Comps** → Firecrawl `search` for "recently sold homes near {address}" + scrape Redfin/Zillow sold-listings pages → Claude extracts an array of comps, then filters server-side by lat/long distance and sale date against the configured radius/window.
- Honest about reliability: scraped data is best-effort. Every field stays editable, and the UI flags low-confidence values.

### New edge function

`cma-autofill` (deployed alongside existing `generate-cma-narrative`):

- Input: `{ address, mode: "subject" | "comps" | "both", radiusMiles, monthsBack }`
- Admin JWT check (same pattern as `enrich-properties`).
- Subject pass: 2–3 Firecrawl search queries (quoted address, address+city, address+county records) → Claude structured extraction.
- Comps pass: Firecrawl search for "homes sold near {address} last {N} months" + scrape Redfin sold map → Claude returns array → server filters by distance (haversine on extracted lat/long when present, else string-match neighborhood) and `saleDate >= now - monthsBack`.
- Returns `{ subject: {...}, comps: [...], log: [...] }`. Log surfaces which queries hit so Emily understands gaps.
- Uses existing `FIRECRAWL_API_KEY` and `ANTHROPIC_API_KEY`.

### Frontend changes

**Modified:** `src/components/admin/cma/CmaEditor.tsx`
- Add address-only "Quick Start" row above the existing subject form with **Auto-Fill** button.
- Add **Radius** + **Window** sliders above the comps table with a **Re-find Comps** button.
- Wire `supabase.functions.invoke("cma-autofill", ...)`.
- Show per-field "AI-filled" badges that disappear when Emily edits the field.
- Toast on partial results ("Found 4 of 6 requested comps — try widening radius").

**New (small):** `src/components/admin/cma/AutoFillStatus.tsx` — progress strip + result summary.

No DB changes. The existing `cma_reports.subject_data` and `comps_data` jsonb columns already accept whatever shape we save.

### Honest limitations (will surface in UI)

- Zillow/Redfin actively block scraping; some lookups will fail or return stale data.
- Sale dates and exact distances aren't always present in scraped HTML — Emily may need to verify before generating.
- County appraisal sites (BCAD for Bexar County) often have the cleanest subject data but limited search.
- If results are thin too often, RentCast remains the next-round upgrade — same edge function shape, just swap the provider.

### Out of scope (this round)

- RentCast / ATTOM integration (queued for next round if scraping proves too noisy).
- Auto-running adjustments (per-comp $ delta) — Emily still enters those manually.
- Bulk auto-fill across multiple saved CMAs.
- Persistent caching of scraped data.

### Memory updates

- Append auto-fill capability + limitations to `mem://features/cma-platform`.

