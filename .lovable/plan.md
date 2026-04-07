

## Fix Comment Dialog: Show Property Addresses + Clickable Navigation

### Problem

The `resolvePropertyFromDossiers` function looks for properties at `tab.properties[key]` (object keyed by property ID), but the actual data structure stores properties at `dossier_data.properties[tabKey]` as arrays where each item has an `id` field. This mismatch causes every comment to show the raw property ID (e.g., "o1") as the address and "UNKNOWN" as the builder.

### Fix

**File: `src/pages/AdminDashboard.tsx`**

1. **Fix `resolvePropertyFromDossiers`** to match the actual data structure:
   - Look in `data.properties[tabKey]` (arrays of property objects)
   - Match on `property.id === propertyId`
   - Return the property's `address` and the matching tab's `label` as the builder
   - Also return the `dossierId` so we can navigate to it

2. **Update `commentDetails` state** to include `dossierId` for each comment

3. **Make each comment card clickable** — clicking it closes the dialog and opens the PropertyEditor for that dossier (sets `propertyEditId` to the dossier ID), giving the admin direct access to edit the property being discussed

### Files

| File | Action |
|------|--------|
| `src/pages/AdminDashboard.tsx` | Fix property resolution logic; add clickable navigation from comments to dossier |

