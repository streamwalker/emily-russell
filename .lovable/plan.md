

## Fix: Smart Add Failing for Simple Address Input

### Root Cause

The `parse-properties` edge function's AI prompt doesn't explicitly instruct the model to always create a property entry even when only an address is provided. The model creates a tab but leaves the `properties` map empty, resulting in "0 properties" in the preview.

### Fix

**File: `supabase/functions/parse-properties/index.ts`**

1. **Update the system prompt** — Add an explicit instruction: "Even if you only have an address and city, you MUST still create a property entry with whatever fields are available. Never return an empty properties map if you can identify at least one address."

2. **Add a server-side fallback** — After parsing the AI response, if `tabs` exist but `properties` is empty or doesn't have entries for any tab key, create a basic property from the raw text (extract address-like patterns) so the user always gets something to review in the preview modal. This makes the feature resilient to AI model inconsistencies.

### Files

| File | Action |
|------|--------|
| `supabase/functions/parse-properties/index.ts` | Update system prompt with explicit instruction; add fallback extraction logic |

