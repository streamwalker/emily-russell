

## Plan: Auto-Save Payment Estimator Inputs Per Property

### Problem

The payment estimator already has a `saved_estimates` table and a manual "Save Estimate" button, but persistence isn't working as you'd expect:

1. **Admin "Client View" mode is read-only** — when Emily previews a client's dossier (`readOnly=true`), the calculator passes `userId={undefined}`, which disables both loading AND saving. So nothing she types in the preview is ever persisted to that client's account.
2. **Client mode requires a manual click** — even when a client logs in themselves, inputs are only saved when they click "Save Estimate." Most users won't click it, so values reset on next visit.
3. **The screenshot you sent is the admin preview** — meaning the data Tiara sees is whatever defaults the calculator opens with, not anything Emily set.

### What changes

#### 1. Auto-save on every input change (debounced)

In `src/components/portal/PaymentCalculator.tsx`:
- Add a `useEffect` that watches all 7 input fields (`offerPrice`, `downPct`, `rate`, `taxRate`, `insurance`, `hoa`, `loanTerm`) and upserts to `saved_estimates` automatically after a 600ms debounce.
- Skip saving until the initial load from the database completes (so we don't immediately overwrite saved values with the default `price` prop on mount).
- Show a tiny "Saved ✓" indicator inline (replacing or supplementing the existing manual button) so the user knows it persisted.
- Keep the explicit "Save Estimate" button as a no-op fallback / clear visual confirmation, OR replace it with a passive "Auto-saved" status — recommend **passive status** to reduce clutter.

#### 2. Persist `loan_term` too

Currently `loan_term` is local-only state. Add it to the saved row so the chosen term (5/15/20/30 yr) also persists.
- Migration: `ALTER TABLE saved_estimates ADD COLUMN loan_term INTEGER NOT NULL DEFAULT 30;`
- Update load/save logic in the component to include it.

#### 3. Allow admin "Client View" to edit AND save on the client's behalf

When Emily is in read-only preview mode, she should be able to:
- **See** the values the client has saved (currently broken — `userId` is undefined so nothing loads)
- **Edit and save** values for the client (so she can pre-fill realistic numbers like the $271,999 / 3.75% / $90 ins / $51 HOA combo from your screenshot, and Tiara will see them next time she logs in)

Fix in `src/components/portal/ClientDossierView.tsx` line 187:
- Change `userId={readOnly ? undefined : userId}` → `userId={userId}` (always pass the client's user ID).
- The component already receives `clientUserId` from the parent, so admin edits will write to the client's row via service-role/admin RLS.

**RLS check**: The existing policies allow users to read/write their own estimates, plus admins can SELECT all. We need to **add admin INSERT/UPDATE policies** so Emily can write on behalf of clients:

```sql
CREATE POLICY "Admins can insert any estimate"
  ON saved_estimates FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any estimate"
  ON saved_estimates FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));
```

### Files Changed

| File | Change |
|---|---|
| `supabase/migrations/<new>.sql` | Add `loan_term` column; add admin INSERT/UPDATE RLS policies |
| `src/components/portal/PaymentCalculator.tsx` | Add debounced auto-save effect; persist `loan_term`; replace manual button with passive "Saved ✓" status; remove the readOnly-blocks-userId guard so admin previews load + save |
| `src/components/portal/ClientDossierView.tsx` | Always pass `userId` to `PaymentCalculator` (don't strip it in readOnly mode) |

### Result

- Tiara opens her dossier → calculator loads her last-saved values for that specific property.
- Any tweak she makes auto-saves within ~600ms.
- Emily previewing as Tiara sees the same values, can adjust them, and her changes also save to Tiara's account — so she can pre-configure realistic numbers for each client.
- Each `(user_id, property_id)` pair has exactly one saved row (existing unique constraint already enforces this).

### Out of scope

- Saved-estimate history / version log
- Multiple scenarios per property (e.g., "20% down vs 5% down" side-by-side)
- Exporting estimates to PDF
- Persisting the calculator open/closed toggle state

