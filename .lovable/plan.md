

## Smart Add Preview, Tab Management, and URL Parsing Fix

### 1. Smart Add Preview Modal

Currently, `smartAdd()` immediately merges extracted properties into the dossier. Change this to a two-step flow:

- After AI extraction succeeds, store the parsed result in a new `smartAddPreview` state instead of merging immediately
- Show a preview modal/panel displaying all extracted properties grouped by tab — each property shows address, city, price, beds, baths, sqft, builder
- Admin can edit fields inline in the preview, remove individual properties, or remove entire tabs before confirming
- "Confirm & Add" button merges the previewed data into the dossier; "Cancel" discards
- Reuse the same field layout from the existing property rows for consistency

**File**: `src/components/admin/PropertyEditor.tsx`

### 2. Rename and Delete Tabs

Add controls to each tab header row (line ~507-511):

- **Rename**: Click the tab label to enter inline edit mode (input replaces the label text). On blur or Enter, update the tab's `label` in state. The `key` stays the same.
- **Delete**: Add a trash icon next to the tab label. Clicking it shows a confirmation ("Delete tab and its N properties?"). On confirm, remove the tab from `data.tabs` and delete `data.properties[tabKey]`.

**File**: `src/components/admin/PropertyEditor.tsx`

### 3. Fix URL-based Smart Add (parse-properties edge function)

The AI prompt currently says "You will receive raw text that contains property listings." URLs like `https://www.highlandhomes.com/...` don't contain property data themselves — they're just links. Update the edge function to:

- Detect if the input contains URLs (regex for http/https links)
- For each URL found, fetch the page content (HTML → extract text) before sending to the AI
- Include the fetched page text alongside any raw text in the AI prompt
- This way the AI has actual listing data to extract from, not just a URL string

**File**: `supabase/functions/parse-properties/index.ts`

### Files

| File | Action |
|------|--------|
| `src/components/admin/PropertyEditor.tsx` | Add preview modal for Smart Add results; add rename/delete controls on tab headers |
| `supabase/functions/parse-properties/index.ts` | Add URL detection and page fetching before AI extraction |

### Technical Details

- Preview state: `smartAddPreview: DossierData | null` — when non-null, renders a modal overlay with the extracted data in editable form
- Tab rename uses a `renamingTab: string | null` state to track which tab is in edit mode
- URL fetching in the edge function uses `fetch()` (available in Deno) to get page HTML, then strips tags to extract text content before passing to the AI. Has a timeout and size limit to avoid hanging on large pages.

