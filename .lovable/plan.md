

## Three Features: Arrow Navigation, Comparison View, Save Estimates

### 1. Tab Bar Arrow Buttons

Add left/right chevron buttons flanking the `TabScrollContainer` for easier tab navigation, especially on mobile.

- Modify `TabScrollContainer` to expose `scrollRef` and add `<` / `>` arrow buttons on each side
- Left arrow hidden when scrolled to start; right arrow hidden when scrolled to end
- Clicking an arrow scrolls the container by ~200px with smooth behavior
- Arrows styled as semi-transparent overlay buttons so they don't take extra space

**File:** `src/pages/ClientPortal.tsx` (edit `TabScrollContainer`)

---

### 2. Side-by-Side Comparison View

Add a "Compare" mode where users can select 2-3 properties and view them in a comparison table.

- Add a `compareIds: Set<string>` state to the main portal
- Add a small checkbox/toggle on each property card header: "☐ Compare"
- When 2+ properties are selected, show a sticky "Compare (N)" button at the bottom of the screen
- Clicking it opens a full-width dialog/sheet showing a comparison table with columns per property and rows for: Address, Price, Beds, Baths, SqFt, Builder, Monthly PITI, HOA, Total Expenses, Rent Estimate, Net Cash Flow, Estimated Payment (using default 20% down / 6.5% rate)
- Max 3 selections; if user tries to add a 4th, show a toast
- Create a new component `src/components/portal/ComparisonView.tsx` for the dialog content

**Files:**
- `src/components/portal/ComparisonView.tsx` (create)
- `src/pages/ClientPortal.tsx` (edit — add compare state, checkbox on PropertyRow, sticky button, dialog)

---

### 3. Save Estimate to Database

Allow users to save their custom payment estimator settings (offer price, down payment %, rate, tax rate, insurance, HOA) per property so they persist across sessions.

- Add a new database table `saved_estimates` with columns: `id`, `user_id`, `property_id` (text, matches the dossier property id), `offer_price`, `down_pct`, `rate`, `tax_rate`, `insurance`, `hoa`, `created_at`, `updated_at`
- RLS: users can CRUD their own rows (`auth.uid() = user_id`)
- Unique constraint on `(user_id, property_id)` so each user saves one estimate per property (upsert)
- Modify `PaymentCalculator` to accept `propertyId` and `userId` props, load saved estimate on mount, and show a "Save Estimate" button that upserts to the table
- Show a subtle "Saved ✓" indicator after saving

**Files:**
- Database migration: create `saved_estimates` table with RLS
- `src/components/portal/PaymentCalculator.tsx` (edit — add save/load logic)
- `src/pages/ClientPortal.tsx` (edit — pass `propertyId` and `userId` to PaymentCalculator)
- `src/integrations/supabase/types.ts` will auto-update after migration

