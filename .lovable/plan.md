

## Plan: Rent vs Buy Funnel KPI + Realtime Leads

Two additive features. No data model changes — both use existing tables (`analytics_events`, `leads`).

---

### 1. Rent vs Buy Funnel KPI strip (Site Analytics tab)

**Where**: Top of `<TabsContent value="analytics">` in `src/pages/AdminDashboard.tsx` (above existing "built-in analytics" cards, around line 1222).

**Funnel steps** (computed from `analytics_events` table where `page = '/rent-vs-buy'`):

```
Page Views → Calculator Recomputes → Share Successes → Lead Submissions
   1,240         412 (33%)              28 (7%)             14 (50%)
```

Each step shows:
- Step icon + label + raw count
- Conversion % from previous step
- Visual progress bar (bg-gold faded, narrows step-to-step)
- Funnel rendered as 4 horizontal cards with arrows between (`ChevronRight` from lucide)

**Backend — extend `supabase/functions/get-site-analytics/index.ts`**:
- Add 4 count queries scoped to `page = '/rent-vs-buy'`:
  - `event_type = 'page_view'` → page views
  - `event_type = 'calculator_recompute'` → recomputes
  - `event_type = 'share_success'` → share successes
  - `event_type IN ('lead_submit_success')` OR fallback `event_type = 'lead_submitted'` → submissions
- Use `count: 'exact', head: true` for efficient counting (no row pulls)
- Last 30 days window (matches existing analytics window)
- Return as new `rentVsBuyFunnel: { pageViews, recomputes, shares, leads }` field on the response

**Frontend** — add a new component section `<RentVsBuyFunnel data={analytics?.rentVsBuyFunnel} />` rendered as the first child inside the analytics TabsContent. Uses existing brand tokens (gold, charcoal, cream) and shadcn cards.

---

### 2. Realtime Leads on `/portal/admin/leads`

**Where**: `src/pages/AdminLeads.tsx`

**Implementation** (mirrors the existing realtime pattern in `AdminDashboard.tsx` lines 283-329):
- New `useEffect` after `fetchLeads()` that subscribes to a Supabase channel
- Listens on `postgres_changes` with `{ event: 'INSERT', schema: 'public', table: 'leads' }`
- On INSERT:
  - Prepend the new lead to the `leads` state (no full refetch needed — RLS already filters to admin)
  - Fire a `toast.success("New lead from {name}", { description: "{email} · {timeframe} · {source}", duration: 8000 })`
  - Optional: subtle row-highlight animation on the new row for ~3s (CSS class `animate-pulse` briefly applied via id-tracked Set)
- Cleanup with `supabase.removeChannel(channel)` on unmount

**Migration needed**: Add `leads` table to the `supabase_realtime` publication so postgres changes are broadcast:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
```
(Set REPLICA IDENTITY FULL so payload includes all columns: `ALTER TABLE public.leads REPLICA IDENTITY FULL;`)

**Toast click behavior**: Clicking the toast opens the detail Sheet (`setSelectedLead(newLead)`), so Emily can review without scrolling.

---

### Files Changed

| File | Change |
|---|---|
| Migration (new) | `ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;` + `REPLICA IDENTITY FULL` |
| `supabase/functions/get-site-analytics/index.ts` | Add 4 funnel count queries scoped to `/rent-vs-buy`; return `rentVsBuyFunnel` object |
| `src/pages/AdminDashboard.tsx` | Add `RentVsBuyFunnel` KPI strip (4-step horizontal funnel with conversion %) at top of Site Analytics tab; extend `AnalyticsData` type |
| `src/pages/AdminLeads.tsx` | Add Realtime subscription to `leads` table INSERT events; toast notification + auto-prepend new row + click-to-open drawer |

---

### Out of scope
- Rebuilding existing analytics cards (untouched)
- Time-series funnel chart (just the strip for now)
- Realtime UPDATE/DELETE on leads (only INSERT)

