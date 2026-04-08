

## Replace parse-properties with Uploaded Version

### What's Different

The uploaded `parse-properties-index.ts` has two key improvements over the current deployed version:

1. **Stronger merging rules in SYSTEM_PROMPT** (lines 76-87): Added "THIS IS THE MOST IMPORTANT RULE" emphasis, a "WRONG vs RIGHT" example, and the explicit rule that `"Price: $234,999" is NEVER a property`.

2. **Post-processing merge step** (lines 443-498): A new server-side safety net that runs AFTER the AI returns results. It uses regex to detect entries whose "address" field doesn't start with digits + street name (or starts with price/beds/sqft patterns), and merges those orphan entries' data into the nearest preceding valid property. It also cleans up empty tabs afterward.

### Plan

**`supabase/functions/parse-properties/index.ts`** — Replace the current file content with the uploaded version. The specific changes are:

1. **SYSTEM_PROMPT update** (line 76-87): Replace the current merging rules section with the stronger version that includes the WRONG/RIGHT example and "Price line is NEVER a property" rule.

2. **Add post-processing merge block** (after the fallback extraction, before ID assignment): Insert ~45 lines of server-side dedup logic that catches any remaining detail-only entries the AI missed, merging them into valid address entries using `ADDRESS_RE` and `NOT_ADDRESS_RE` patterns.

3. **Add empty-tab cleanup**: After merging, remove any tabs that ended up with 0 properties.

Then redeploy the edge function.

### Files

| File | Action |
|------|--------|
| `supabase/functions/parse-properties/index.ts` | Update SYSTEM_PROMPT merging rules + add post-processing merge/dedup logic |

