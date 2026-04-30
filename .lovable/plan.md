## Plan: Temporarily Disable OSINT Analyst

The OSINT Analyst is one of two features burning Lovable AI credits (per-property Gemini calls + Firecrawl searches). Disable the entry point in the Admin Property Editor while preserving all logic so it can be flipped back on once an embedded / Open Claw replacement is wired in.

### What changes

**File: `src/components/admin/PropertyEditor.tsx`**

1. **Hide the "Deploy OSINT Analyst" button** (lines 1070–1082).
   Replace it with a small, muted, non-clickable status pill:
   ```
   ⓘ OSINT Analyst — Disabled (pending embedded replacement)
   ```
   Keep it visually anchored in the same toolbar slot (`ml-auto`) so the layout doesn't shift.

2. **Hide the progress / log panel** (lines 1086–1118). It will never trigger now, so wrap it in `{false && (...)}` — or simpler, remove the JSX block entirely. Since state vars (`osintRunning`, `osintComplete`, `osintProgress`, `osintLog`, `osintFieldsFound`) won't update, leaving the conditional in place is a no-op. We'll just delete the JSX block to keep the file clean.

3. **Leave the underlying code intact**:
   - `deployOsintAnalyst` function (lines ~532–680) — kept, just unreferenced
   - All `osint*` state hooks (line ~255) — kept
   - Imports (`Radar`, `Loader2` if used elsewhere) — kept if used by other features, otherwise removed only if truly orphaned

**File: `supabase/functions/enrich-properties/index.ts`** — **no changes**.
The edge function stays deployed but becomes unreachable from the UI. This way:
- No need to redeploy when re-enabling
- Direct API calls (e.g. for testing) still work
- We avoid touching the Supabase function registry

### What does NOT change

- The edge function `enrich-properties` stays deployed (dormant)
- Firecrawl connector stays connected
- `Smart Add` (the *other* AI consumer in `parse-properties`) stays fully functional — it's a different feature
- No database changes, no RLS changes, no secrets touched

### Re-enabling later

When the embedded / Open Claw replacement is ready, the toggle is a one-line revert: restore the button JSX and (optionally) the progress panel. Or swap the button's `onClick` to point at a new `deployEmbeddedAnalyst` function that calls the new backend.

### Files touched

- `src/components/admin/PropertyEditor.tsx` — replace button with disabled status pill; remove progress JSX block

### Memory update

Add a one-liner to project memory: *"OSINT Analyst is disabled in the UI pending an embedded replacement. Edge function `enrich-properties` remains deployed but unreachable."*
