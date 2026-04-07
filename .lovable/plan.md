

## Admin Property Editor + Sticky Header

### Two changes

**1. Admin Property Editor**

Create `src/components/admin/PropertyEditor.tsx` following the same pattern as `ExpenseEditor`:
- Same props interface: `dossierData`, `onSave`, `onCancel`, `saving`
- Deep-clone dossier data into local state
- List properties grouped by tab (accordion-style, one expanded at a time)
- For each property, editable fields:
  - **Text**: address, city, community, area, builder, plan, type, status, rentEst, yieldEst, rentNote, sourceUrl
  - **Number**: price, beds, sqft, stories, garages
  - **Text (string)**: baths (supports "2.5" format)
  - **Textarea**: notes (Agent Notes) — multi-line
- "Save All" and "Cancel" buttons at the bottom
- Uses the same `er-input` CSS classes as ExpenseEditor

Update `src/pages/AdminDashboard.tsx`:
- Import `PropertyEditor`
- Add `propertyEditId` state (like `expenseEditId`)
- Add a "Properties" button next to "Expenses" in each dossier row
- When active, render `PropertyEditor` in place of the dossier card (same conditional pattern as ExpenseEditor)

**2. Sticky Header with Tabs**

Make the header area (branding + tab bar) stick to the top when scrolling, so users always see the tabs.

In `src/pages/ClientPortal.tsx`:
- Add `sticky top-0 z-40` to the header `div` (the one with the dark gradient background, lines 534-629)
- This keeps the "Prepared by..." line, title, account buttons, and tab bar all visible while scrolling

### Files

| File | Action |
|------|--------|
| `src/components/admin/PropertyEditor.tsx` | Create — full property + notes editor |
| `src/pages/AdminDashboard.tsx` | Edit — add PropertyEditor button and rendering |
| `src/pages/ClientPortal.tsx` | Edit — add `sticky top-0 z-40` to header container |

