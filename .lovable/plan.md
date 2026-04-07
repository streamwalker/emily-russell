

## 1. Expense Calculator in Admin Dashboard + 2. "All Homes" Tab

### What changes

**Admin Dashboard — Expense Calculator**

When an admin clicks "Edit" on a dossier, instead of only showing a raw JSON textarea, add a new "Manage Expenses" mode. This provides a structured UI where the admin can:
- Expand any property by name/address
- Input PITI, HOA, Gas, Electric, Water, Trash, and Other (with custom label) as numeric fields
- See a live total and net cash flow preview (rent minus expenses)
- Save updates back into the `dossier_data` JSON (writing to each property's `expenses` object)

This will be a new component `src/components/admin/ExpenseEditor.tsx` that receives the parsed dossier data, renders an accordion of properties grouped by builder tab, and emits the updated JSON on save. The admin dashboard will get a "Manage Expenses" button alongside the existing "Edit" button for each dossier.

**Client Portal — "All Homes" Tab**

Add a new synthetic tab `{ key: "all-homes", label: "📋 All Homes", color: "#6B7280" }` inserted before the two ranking tabs. This tab aggregates every property from every builder tab into a single flat list, with the builder name shown as a tag on each card. The existing filter/sort toolbar applies to this view as well. The `TabSummary` component displays combined stats across the entire dossier.

### Files

| File | Action |
|------|--------|
| `src/components/admin/ExpenseEditor.tsx` | Create — structured expense input form per property |
| `src/pages/AdminDashboard.tsx` | Edit — add "Manage Expenses" button that opens the ExpenseEditor instead of raw JSON |
| `src/pages/ClientPortal.tsx` | Edit — add "All Homes" synthetic tab with aggregated property list