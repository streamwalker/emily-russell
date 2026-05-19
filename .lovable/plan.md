# Persist home data + auto-save CMA edits

Build a canonical `homes` record per address, link each CMA report to it, and auto-save edits (with sources) as the admin types.

## Database

New tables:

- `homes`
  - `id` uuid pk
  - `address` text — display address
  - `address_key` text unique — normalized (lowercase, alnum-only) for dedupe
  - `beds`, `baths`, `sqft`, `year_built` numeric/int
  - `lot_size`, `builder`, `condition` text
  - `sources` jsonb — `{ beds: "https://...", sqft: "...", ... }`
  - `last_autofill_at` timestamptz
  - `created_by`, timestamps
  - RLS: admins full CRUD

- `cma_reports` (alter)
  - add `home_id uuid` nullable → references `homes(id)`
  - add `subject_sources jsonb default '{}'`
  - (comps already carry `sourceUrl` inside `comps_data`)

Indexes: `homes(address_key)` unique, `cma_reports(home_id)`.

## Save flow

In `CmaEditor.tsx`:

1. On mount / address change, look up `homes` by `address_key`. If found and the current subject is blank, hydrate from it (so reopening an address brings back data + sources).
2. Debounced auto-save (1s after last edit) writes:
   - `homes` upsert keyed on `address_key` — subject fields + sources + `last_autofill_at`
   - `cma_reports` update (existing row) or insert (new) — subject_data, comps_data (including each comp's `sourceUrl`), notes, subject_sources, home_id
3. Auto-fill button runs (subject/comps/both) now also write through this same path so sources persist.
4. Small status indicator near the header: "Saved · 3s ago" / "Saving…" / "Unsaved — retrying".
5. Manual Save button stays for the PDF + narrative flow (regenerate + upload PDF only happens on explicit click).

## UX guards

- Don't auto-save until `subject.address` ≥ 5 chars.
- Skip writes that would clear non-null fields with null (the existing `pickField` rules already enforce this for auto-fill; for manual edits the user's value wins).
- Debounce per-field so rapid typing collapses into one DB call.
- Toast only on errors; success stays silent in the status pill.

## Files touched

- migration: new `homes` table + `cma_reports` columns + RLS
- `src/components/admin/cma/CmaEditor.tsx` — hydrate, debounced save, status pill
- `src/components/admin/cma/CmaWorkspace.tsx` — pass through `home_id`
- (types regenerate automatically)

## Out of scope

- Showing a homes browser / cross-CMA history view (can come later — the data will be there).
- Versioning history of edits.
