

## Back Buttons + Add Properties to Existing Dossier

### Changes

**1. Back buttons in sub-views (`src/pages/AdminDashboard.tsx`)**

When the admin enters PropertyEditor, ExpenseEditor, or raw JSON edit mode for a dossier, add a prominent "← Back to Dossiers" button at the top of that view. This replaces the current "Cancel" being buried at the bottom:
- Add a back button row above each sub-editor (PropertyEditor, ExpenseEditor, JSON edit) with an `ArrowLeft` icon + "Back to Dossiers"
- Clicking it calls the same cancel/close logic already in place (`setPropertyEditId(null)`, etc.)
- Also update the PropertyEditor component itself to show the back button more prominently in its header

**2. Add properties to existing dossier (`src/pages/AdminDashboard.tsx` + `src/components/admin/PropertyEditor.tsx`)**

Add an "Add Properties" feature inside PropertyEditor that lets admins add new properties without touching JSON:

- **Add to existing tab**: A "＋ Add Property" button at the bottom of each tab section in PropertyEditor. Clicking it appends a blank property with just an empty address to that tab's array and auto-expands it for editing.
- **Add new tab**: A "＋ Add Tab" button at the bottom of the PropertyEditor that lets admins create a new tab (builder group) by entering a label. Auto-generates a key and assigns a color from a preset palette.
- **Smart add via AI**: An "＋ Smart Add" button at the top of PropertyEditor that opens a small textarea. Admin pastes raw text, it calls the same `parse-properties` edge function, and the returned properties get merged into the existing dossier data (appended to matching tabs or creating new ones).
- **Delete property**: Add a small trash icon on each property header to remove it from the dossier.

### Files

| File | Action |
|------|--------|
| `src/pages/AdminDashboard.tsx` | Add back button rows above each sub-editor view |
| `src/components/admin/PropertyEditor.tsx` | Add "Add Property" per tab, "Add Tab", "Smart Add" via AI, and delete property buttons |

