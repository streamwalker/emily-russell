

## Admin Portal Rebuild: All-Client Dossiers + Site Analytics Dashboard

### Summary

Rebuild the Admin Dashboard (`/portal/admin`) into a tabbed interface with two main sections: (1) **All Client Dossiers** — the existing dossier management, plus a read-only view of each client's property interactions (favorites, grades, tour requests, feedback), and (2) **Site Analytics** — real-time charts and tables showing visitor traffic, page popularity, traffic sources, device breakdown, and client engagement metrics pulled from both the built-in analytics and a new custom event tracking table.

### Architecture

The built-in project analytics provides: daily visitors, pageviews, session duration, bounce rate, top pages, traffic sources, devices, and countries. However, it doesn't track individual link clicks or per-section dwell time. To capture those, we'll add a lightweight `analytics_events` table and a small tracker utility that logs page views and link clicks from the client side.

### Database

**New table: `analytics_events`** — tracks page views and link clicks from the public site

```sql
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'page_view', 'link_click', 'section_visible'
  page TEXT,
  target TEXT, -- link href or section id
  label TEXT, -- human-readable label
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT, -- random per-session ID (anonymous)
  duration_ms INT, -- time spent on page (for page_view events)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

RLS: public INSERT (no auth required — anonymous tracking), admin-only SELECT.

### Frontend Changes

**1. Event Tracker (`src/lib/analyticsTracker.ts`)**
- On every page load in `Index.tsx`, log a `page_view` event with the current path
- On page unload/navigation, update with `duration_ms`
- On link clicks (CTA buttons, nav links, partner links), log a `link_click` event with the link label and href
- Uses a random `session_id` stored in `sessionStorage`

**2. Instrument the main site (`src/pages/Index.tsx`)**
- Call the tracker on mount to log page views
- Wrap key links/CTAs with click tracking (phone CTA, lead form, neighborhood cards, partner links, portal link)

**3. Rebuild Admin Dashboard (`src/pages/AdminDashboard.tsx`)**

Reorganize into a tabbed layout with three tabs:

**Tab 1: Client Dossiers** (existing functionality, enhanced)
- All existing dossier CRUD
- For each client, show a summary row: number of favorites, grades given, tours scheduled, comments left (from `property_interactions`)
- Expandable to view the client's full interaction details per property

**Tab 2: Site Analytics**
- **KPI cards**: Total visitors, total pageviews, avg session duration, bounce rate (from built-in analytics data fetched via an edge function)
- **Visitors over time**: Line chart (Recharts) showing daily visitors for the last 30 days
- **Top pages table**: Which pages get the most views
- **Traffic sources**: Bar chart — Direct, Facebook, Google, etc.
- **Device split**: Pie/donut chart — desktop vs mobile
- **Country breakdown**: Table of top countries

**Tab 3: Engagement**
- **Most clicked links**: Table from `analytics_events` where `event_type = 'link_click'`, grouped by label, sorted by count
- **Page dwell time**: Average `duration_ms` per page from `analytics_events`
- **Client activity summary**: Which clients have been most active (favorites, grades, tour requests, comments) — aggregated from `property_interactions`
- **Recent signed agreements**: List from `signed_agreements` table

**4. Edge function: `get-site-analytics`**
- Calls the Lovable analytics API internally (or we hardcode the fetch within the admin page using the edge function as a proxy)
- Returns structured JSON with visitors, pageviews, session duration, bounce rate, top pages, sources, devices, countries
- Admin-only (checks auth)

**5. Auto-redirect admins to admin dashboard**
- In `PortalDashboard.tsx`, check if the user is an admin. If so, redirect to `/portal/admin`.

### Files

| File | Action |
|------|--------|
| Database migration | Create `analytics_events` table with RLS |
| `supabase/functions/get-site-analytics/index.ts` | New edge function to fetch project analytics |
| `src/lib/analyticsTracker.ts` | New — lightweight event logger |
| `src/pages/Index.tsx` | Add tracking calls for page views and link clicks |
| `src/pages/AdminDashboard.tsx` | Full rebuild — tabbed layout with dossiers, analytics, engagement |
| `src/pages/PortalDashboard.tsx` | Add admin redirect to `/portal/admin` |

### Technical Details

- Charts use Recharts (already installed) via the existing `ChartContainer` components
- Analytics edge function uses `LOVABLE_API_KEY` secret (already configured) to call the project analytics endpoint
- The `analytics_events` table uses permissive INSERT for anonymous visitors (no auth) but admin-only SELECT
- All client interaction aggregations query `property_interactions` which admins already have SELECT access to

