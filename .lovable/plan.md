

## Deploy Three-File Bundle: OSINT Analyst + Updated Parse/PropertyEditor

### Summary

Deploy the user's three uploaded files that add an AI-powered "OSINT Analyst" feature for enriching property data with web intelligence, alongside an updated parse-properties function and PropertyEditor UI.

### Changes

| File | Destination | Action |
|------|-------------|--------|
| `enrich-properties-index.ts` | `supabase/functions/enrich-properties/index.ts` | Create new edge function |
| `parse-properties-index-2.ts` | `supabase/functions/parse-properties/index.ts` | Replace existing file |
| `PropertyEditor.tsx` | `src/components/admin/PropertyEditor.tsx` | Replace existing file |

### Steps

1. **Create `supabase/functions/enrich-properties/index.ts`** — Copy the uploaded `enrich-properties-index.ts` as-is. This is a new edge function that:
   - Accepts an array of properties, identifies missing fields
   - Searches the web via Firecrawl for each property address
   - Feeds results to Gemini 2.5 Flash to extract only missing field values
   - Returns validated enrichment data with a detailed log

2. **Replace `supabase/functions/parse-properties/index.ts`** — Copy the uploaded `parse-properties-index-2.ts`. Contains the improved detail-string parsing and field merging logic.

3. **Replace `src/components/admin/PropertyEditor.tsx`** — Copy the uploaded `PropertyEditor.tsx`. Adds the "Deploy OSINT Analyst" button, progress display, batch processing, and enrichment log UI.

4. **Deploy both edge functions** — `enrich-properties` and `parse-properties`.

### No New Secrets Needed

Both functions reuse existing `FIRECRAWL_API_KEY` and `LOVABLE_API_KEY` already configured.

