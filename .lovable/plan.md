

## Smart Dossier Creation: AI-Powered Property Import

### Summary

Replace the raw JSON textarea in the "New Dossier" form with a smart input that accepts free-form text (addresses, listing URLs, pasted MLS descriptions, or any block of property info). An edge function powered by Lovable AI extracts structured property data matching the existing dossier schema. The admin reviews the extracted properties, makes corrections, then saves.

### Flow

```text
Admin clicks "+ New Dossier"
  → Selects client, title, date (same as today)
  → Pastes raw text into a large textarea
     (addresses, URLs, listing descriptions, etc.)
  → Clicks "Extract Properties"
  → Edge function sends text to Lovable AI with schema instructions
  → Returns structured JSON with tabs and properties
  → Admin sees extracted properties in an editable preview
     (uses existing PropertyEditor component)
  → Admin can fix/add/remove before saving
  → Clicks "Create Dossier" to save
```

### Changes

**1. New Edge Function: `supabase/functions/parse-properties/index.ts`**

- Accepts `{ rawText: string }` in the body
- Sends to Lovable AI (`google/gemini-3-flash-preview`) with a system prompt that:
  - Explains the exact property schema (address, city, price, beds, baths, sqft, stories, garages, builder, plan, type, status, community, area, rentEst, yieldEst, rentNote, notes)
  - Instructs the model to group properties by builder into tabs with keys, labels, and colors
  - Uses tool calling for structured output (no freeform JSON)
- Returns the structured dossier data `{ tabs: [...], properties: { ... } }`
- Authenticated (admin only via auth header check)

**2. Update `src/pages/AdminDashboard.tsx` — New Dossier Form**

Replace the current raw JSON textarea (lines 295-298) with a two-step flow:

- **Step 1 — Input**: Large textarea for pasting raw text + an "Extract Properties" button. Show a loading spinner while AI processes.
- **Step 2 — Review**: Once extraction completes, show the parsed data using the existing `PropertyEditor` component in read/edit mode so the admin can review and fix before saving. Also keep a "Switch to raw JSON" toggle for power users.
- The existing client selector, title, and date fields remain unchanged.

### Files

| File | Action |
|------|--------|
| `supabase/functions/parse-properties/index.ts` | New edge function — AI property extraction |
| `src/pages/AdminDashboard.tsx` | Replace JSON textarea with smart input + review flow in new dossier form |

### Technical Details

- Uses Lovable AI tool calling for reliable structured output (not freeform JSON)
- The system prompt includes one example property so the model understands the exact field format
- If the AI can't determine a field (e.g., rent estimate), it leaves it null for the admin to fill in
- Error handling: if extraction fails, show error and let admin retry or fall back to raw JSON
- No new database tables needed

