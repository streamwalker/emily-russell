

## Apply Codebase Scan Fixes

Addressing the actionable issues from the scan report. Skipping #5 (shared types), #7 (AdminDashboard decomposition), and #13 (tests) as they are large refactors better done separately. Skipping #15-16 (shadcn warnings) as they're not worth changing.

### Critical Fixes

**1. Hardcoded API keys → secrets** (`supabase/functions/sync-lead/index.ts`)
- Replace hardcoded `LEADGENIUS_KEY`, `LEADGENIUS_URL`, `RELOCATE_KEY`, `RELOCATE_URL` with `Deno.env.get(...)` calls
- Add 4 secrets via the secrets tool: `LEADGENIUS_URL`, `LEADGENIUS_KEY`, `RELOCATE_URL`, `RELOCATE_KEY`

**2. API key in URL query string** (`src/lib/analyticsTracker.ts`)
- The `sendBeacon` call appends the anon key as a query param. Replace with a proper `fetch` + `keepalive: true` approach that puts the key in headers instead, or document as accepted risk since the table has insert-only RLS for anon.
- Also add `.catch(() => {})` to both fire-and-forget calls (fixes #14 too).

**3. Blob URL memory leak** (`src/pages/BuyerRepAgreement.tsx`)
- Revoke previous blob URL before creating a new one
- Add `useEffect` cleanup to revoke on unmount

### High Fixes

**4. Realtime subscription churn** (`src/pages/AdminDashboard.tsx`)
- Use `useRef` for `profiles`, `resolvePropertyFromDossiers`, and `fetchData` so the realtime effect only depends on `[isAdmin]`

**8. Missing database indexes** (migration)
- Add indexes on `analytics_events(event_type, created_at)`, `analytics_events(session_id)`, `property_interactions(user_id)`

### Medium Fixes

**9. Ternary as statement** (`src/components/portal/ClientDossierView.tsx` ~line 658)
- Replace `n.has(id) ? n.delete(id) : n.add(id)` with `if/else`

**10. useCallback missing dep** (`src/components/portal/SignaturePad.tsx`)
- `getCtx` and `getCanvas` are stable (defined in component body referencing a ref) — no actual bug, but make `getCanvas`/`getCtx` into refs or wrap in useCallback for correctness

**11. `let` → `const`** (`src/pages/AdminDashboard.tsx` line 194)
- Change `let repliesMap` to `const repliesMap`

**12. Error boundary** (`src/App.tsx`)
- Add a top-level React ErrorBoundary wrapping `<Routes>`

**14. Analytics error handling** (`src/lib/analyticsTracker.ts`)
- Add `.catch(() => {})` to both insert calls (combined with fix #2)

**17. Console statements**
- Skip for now — low impact and requires auditing many files

**18. process-email-queue CORS comment** (`supabase/functions/process-email-queue/index.ts`)
- Add comment noting this is a webhook-only function, no CORS needed

### Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/sync-lead/index.ts` | Replace 4 hardcoded values with `Deno.env.get()` |
| `src/lib/analyticsTracker.ts` | Fix sendBeacon key exposure; add `.catch()` to both calls |
| `src/pages/BuyerRepAgreement.tsx` | Revoke blob URLs on cleanup |
| `src/pages/AdminDashboard.tsx` | Use refs for realtime deps; `let` → `const` |
| `src/components/portal/ClientDossierView.tsx` | Ternary → if/else |
| `src/components/portal/SignaturePad.tsx` | Minor dep fix |
| `src/App.tsx` | Add ErrorBoundary component |
| `supabase/functions/process-email-queue/index.ts` | Add "no CORS" comment |
| New migration | Add 3 database indexes |

### Secrets Needed
Will need the user to input values for 4 new secrets: `LEADGENIUS_URL`, `LEADGENIUS_KEY`, `RELOCATE_URL`, `RELOCATE_KEY` (values are currently hardcoded in the file, so we know them).

