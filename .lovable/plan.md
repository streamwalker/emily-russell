

## Plan: Add "Reset to defaults" link to Payment Estimator

### What

Add a small, unobtrusive "Reset to defaults" link inside the payment estimator that lets a client (or admin) clear their saved values for the current property and revert all inputs to the system defaults.

### Behavior

When clicked:
1. Show a small confirmation (`AlertDialog`) — "Reset all payment estimator values for this property? This will clear your saved settings."
2. On confirm:
   - Delete the row from `saved_estimates` for the current `(user_id, property_id)` pair
   - Reset all local input state back to the original defaults:
     - `offerPrice` → the property's listing `price` (the prop)
     - `downPct` → 20
     - `rate` → 6.5
     - `taxRate` → 2.2
     - `insurance` → 150
     - `hoa` → the property's `hoaFee` prop (or 0)
     - `loanTerm` → 30
   - Show a brief "Reset" toast/status confirmation
3. The auto-save effect will be temporarily suppressed during reset so it doesn't immediately re-create the row with the defaults (or alternatively, allow it to re-save defaults — same end result, but cleaner to skip).

### Placement

Inline next to the existing "Auto-saved" status indicator at the bottom of the right column, formatted as a tiny muted text link:

```
[EquiForge link]              Reset to defaults · Saved ✓
```

Style: `text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline` — visually secondary, never accidentally clicked. Only shown when `propertyId && userId` are both present (i.e., persistence is active).

### Files Changed

| File | Change |
|---|---|
| `src/components/portal/PaymentCalculator.tsx` | Add reset handler + AlertDialog + inline link in the actions row; add a `resettingRef` to suppress the next auto-save tick |

### RLS / DB notes

No schema changes needed. The existing policies already cover this:
- Clients: `Users can delete their own estimates` (`auth.uid() = user_id`)
- Admins: covered by the existing admin policies (admin can delete on a client's behalf via the same view)

Note: there's currently no explicit "Admins can delete any estimate" policy — only SELECT/INSERT/UPDATE for admins. For the admin "Client View" reset to also work, we'll add one tiny policy:

```sql
CREATE POLICY "Admins can delete any estimate"
  ON public.saved_estimates FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
```

| File | Change |
|---|---|
| `supabase/migrations/<new>.sql` | Add `Admins can delete any estimate` RLS policy |

### Out of scope

- A "Reset all properties" bulk action
- Undo / soft-delete with restore window
- Per-field reset (e.g., reset only the rate)
- Confirmation skip toggle

