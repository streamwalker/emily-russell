## Alamo City CMA — Internal Admin Platform

A new **CMA** tab inside `/portal/admin` (alongside Dossiers, Templates, Leads). Emily types in a subject address + a handful of comparable sales, Claude generates an analyst-grade narrative and value range, and the result renders as a branded PDF she can save, re-open, and email to a client. No public signup, no Stripe, no credits — it's an internal tool only Emily and Phil can see.

### User flow

1. Emily opens `/portal/admin` → clicks the **CMA** tab.
2. Sees a two-pane workspace:
   - **Left**: list of past CMAs (address, date, value range, status) with a "New CMA" button.
   - **Right**: editor for the active CMA.
3. **New CMA** opens a 3-step form:
   - **Subject**: address, beds, baths, sqft, year built, lot, condition notes.
   - **Comps**: add 3–6 rows (address, sale price, sqft, beds/baths, sale date, distance, condition). "Paste from clipboard" accepts a tab/CSV block for fast entry.
   - **Adjustments & notes**: optional per-comp $ adjustments + free-form market commentary.
4. Click **Generate** → spinner → Claude returns: narrative (~400 words), value range (low / recommended / high), adjusted PPSF table, and a one-paragraph executive summary.
5. Emily reviews, can edit any field inline, then clicks **Save PDF** → branded PDF rendered via `pdf-lib` and stored in a new private bucket; row appears in history.
6. Each saved CMA has: View PDF, Download, Re-generate narrative, Duplicate, Delete.

### Database

New table `cma_reports`:

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| created_by | uuid | admin user_id |
| address | text | subject |
| subject_data | jsonb | beds/baths/sqft/year/lot/condition |
| comps_data | jsonb | array of comp rows + adjustments |
| narrative | text | Claude output |
| value_low / value_recommended / value_high | numeric | |
| ppsf_low / ppsf_recommended / ppsf_high | numeric | |
| status | text | `draft` \| `generated` \| `failed` |
| pdf_path | text | path in `cma-reports` bucket |
| created_at / updated_at | timestamptz | |

RLS: admin-only (`has_role(auth.uid(), 'admin')`) for all CRUD. New private storage bucket `cma-reports` with matching admin-only policies.

### New edge function

`generate-cma-narrative` — accepts `{ subject, comps, notes }`, calls Claude (`claude-sonnet-4-5` via Anthropic SDK), returns structured JSON `{ narrative, valueLow, valueRecommended, valueHigh, ppsf, executiveSummary }`. Requires a new `ANTHROPIC_API_KEY` secret (we'll request it via the secrets tool before deploying). Includes Zod validation, CORS, admin-role check on the JWT.

### Frontend files

**New:**
- `src/pages/admin/CmaWorkspace.tsx` — top-level page (list + editor split).
- `src/components/admin/cma/CmaList.tsx` — history sidebar.
- `src/components/admin/cma/CmaEditor.tsx` — 3-step form + generate button.
- `src/components/admin/cma/CompsTable.tsx` — editable rows + paste-CSV.
- `src/components/admin/cma/CmaResultView.tsx` — narrative + value range + adjusted table.
- `src/lib/cmaPdf.ts` — pdf-lib builder using existing brand colors/fonts.

**Modified:**
- `src/pages/AdminDashboard.tsx` — add "CMA" tab and route to `<CmaWorkspace />`.
- `src/integrations/supabase/types.ts` — auto-regenerates after migration.

### Brand alignment

Reuse the existing site palette (gold/charcoal/cream, Playfair + DM Sans). I'll ignore the spec's bronze/Georgia palette since it conflicts with the established Emily Russell brand already in `index.css`.

### Out of scope (this round, queued for follow-ups)

- RentCast (or any live data API) — Emily enters comps manually for now.
- Word `.docx` / Excel `.xlsx` exports — PDF only.
- Public `/cma` signup, Stripe, credit system, multi-tenant accounts.
- Saving a CMA into a client's dossier (can wire later if useful).
- Email-to-client button.

### Secrets to request before implementing

- `ANTHROPIC_API_KEY` — from console.anthropic.com → API Keys. I'll prompt for it after you approve this plan.

### Memory updates

- New entry `mem://features/cma-platform` documenting the internal CMA tool, table, bucket, and edge function.
- Update `mem://features/admin-portal` to mention the new CMA tab.
