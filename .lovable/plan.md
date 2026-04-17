

## Plan: Admin Leads Dashboard + Analytics Event Tracking

Two additive features. No calculator logic touched.

---

### 1. Recent Leads Admin Dashboard

**Route**: `/portal/admin/leads` (matches existing admin route pattern, auth + admin-protected via existing `ProtectedRoute` + `useAdminCheck`).

**Data source**: A new `leads` table — currently lead submissions only sync to external services (LeadGenius, Relocation Compass) via the `sync-lead` edge function and aren't persisted locally. We need a local copy for Emily to view.

**New table `public.leads`**:
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | required |
| email | text | required |
| phone | text | nullable |
| timeframe | text | nullable (e.g. "0-3mo", "3-6mo") |
| message | text | nullable (auto-filled snapshot summary) |
| source | text | default `'rent_vs_buy'` — distinguishes origin page |
| metadata | jsonb | nullable — calculator inputs/outputs snapshot |
| user_agent | text | nullable |
| referrer | text | nullable |
| created_at | timestamptz | default now() |

**RLS**:
- Anyone (anon + authenticated) can INSERT (public lead form)
- Only admins can SELECT / UPDATE / DELETE (via `has_role(auth.uid(), 'admin')`)

**Edge function update**: `sync-lead` will additionally insert into `public.leads` after the external sync (best-effort, non-blocking failures). If `sync-lead` is not currently called from `rent-vs-buy.html`, the HTML page will write directly to the `leads` table via the REST API (anon key, RLS allows insert).

**Frontend page** `src/pages/AdminLeads.tsx`:
- Wrapped in `ProtectedRoute` + admin gate (redirects non-admins to `/portal/dashboard`)
- Fetches leads via `supabase.from('leads').select('*').order('created_at', { ascending: false })`
- Renders with shadcn `Table`:
  - Columns: Date, Name, Email, Phone, Timeframe, Source, Message (truncated, click-to-expand)
- Sortable column headers (date, name, timeframe) — client-side sort
- Filter by source (dropdown: All / rent_vs_buy / contact_form / etc.)
- Search box (filters name/email)
- **Export CSV** button: generates CSV in-browser from current filtered rows, downloads as `leads-YYYY-MM-DD.csv`
- Row click → side drawer with full message + metadata JSON pretty-printed
- Empty state + loading skeleton
- Uses existing brand tokens (gold, charcoal, cream)

**Route registration** in `src/App.tsx`:
```tsx
<Route path="/portal/admin/leads" element={<ProtectedRoute><AdminLeads /></ProtectedRoute>} />
```

**Admin nav link**: Add a "Recent Leads" button on `AdminDashboard.tsx` linking to `/portal/admin/leads`.

---

### 2. Analytics Event Tracking (using existing `analytics_events` table)

**Decision**: Use the **existing in-house analytics_events table** — Emily already has it wired into the admin dashboard via `get-site-analytics`. No third-party (GA/Plausible) needed; adds zero cookies, zero external requests, no new privacy disclosures, and Emily can already see custom events in her existing analytics view. The `rent-vs-buy.html` page already has an `ANALYTICS` module (added in a prior turn) — we'll **extend** it with structured events.

**Events to track** (all written to `analytics_events`):

| event_type | label | target | page | When fired |
|---|---|---|---|---|
| `calculator_interact` | field name (e.g. `home_price`, `rate`, `down_pct`) | new value (string) | `/rent-vs-buy` | On `change` of any calculator input — debounced 800ms per field to avoid flooding |
| `calculator_recompute` | `auto` | summary (e.g. `breakeven_yr=4`) | `/rent-vs-buy` | First recompute per session + every 10th recompute (sampled) |
| `share_click` | `png` \| `pdf` | filename | `/rent-vs-buy` | On share button menu click |
| `share_success` | `png` \| `pdf` | filename | `/rent-vs-buy` | After successful canvas/PDF generation |
| `share_error` | `png` \| `pdf` | error message | `/rent-vs-buy` | On generation failure |
| `lead_submit_attempt` | `rent_vs_buy_lead_form` | timeframe value | `/rent-vs-buy` | Form submit start |
| `lead_submit_success` | `rent_vs_buy_lead_form` | timeframe value | `/rent-vs-buy` | After insert succeeds |
| `lead_submit_error` | `rent_vs_buy_lead_form` | error message | `/rent-vs-buy` | On failure |
| `cta_click` | CTA label (e.g. `sticky_call`, `sticky_text`, `hero_call`) | href/target | `/rent-vs-buy` | All `tel:` / `sms:` / `mailto:` clicks |
| `tooltip_open` | tooltip label | — | `/rent-vs-buy` | Already implemented — kept |

**Implementation in `public/rent-vs-buy.html`**:
- Extend the existing `ANALYTICS.track()` helper (already writes to `analytics_events` via REST + anon key) with two new helpers:
  - `ANALYTICS.trackField(name, value)` — debounced per-field input tracking
  - `ANALYTICS.trackCTA(label, href)` — single helper for all click CTAs
- Wire `change` listeners on every calculator input (loop over `[data-field]` attributes already on inputs, or query by id)
- Wire share-button menu items → `share_click` + result → `share_success` / `share_error`
- Wire lead form submit → `lead_submit_attempt` / `_success` / `_error`
- Wire all `tel:` / `sms:` / `mailto:` anchors via single delegated listener on `document`
- Wrap all tracker calls in try/catch — analytics never breaks UX

**Conversion rate visibility**: Emily's existing admin analytics view already aggregates `analytics_events`. To see conversion:
- `lead_submit_success` count ÷ `page_view` count for `/rent-vs-buy` = **page → lead conversion rate**
- `share_success` count ÷ `calculator_recompute` count = **engagement → share rate**

These are already computable from the data; the existing `get-site-analytics` edge function will pick up the new event_types automatically (no edge function changes needed). Optionally we can add a small "Rent vs Buy Funnel" KPI strip on the admin analytics page later.

---

### Files Changed

| File | Change |
|---|---|
| **Migration** (new) | Create `public.leads` table + RLS (anon insert, admin read/update/delete) |
| `public/rent-vs-buy.html` | (a) Extend `ANALYTICS` module with `trackField` + `trackCTA` + `share_*` + `lead_submit_*` events; (b) Switch lead-form submit to insert into `public.leads` (in addition to existing notification flow) |
| `src/pages/AdminLeads.tsx` (new) | Admin-gated page: table + sort + search + source filter + CSV export + row drawer |
| `src/App.tsx` | Register `/portal/admin/leads` route |
| `src/pages/AdminDashboard.tsx` | Add "Recent Leads" nav button |

---

### Out of Scope (intentional)
- Google Analytics / Plausible — using in-house tracking instead (no cookie banner changes, no PII to third parties, leverages existing infra). Happy to add GA4 in a follow-up if desired.
- Email notification to Emily on each lead — already handled by existing `sync-lead` flow.
- Real-time websocket updates on the leads page — can be added later if useful.

