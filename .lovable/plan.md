

## Replace parse-properties with v3: Split-Number Reassembly Fix

### Problem
The AI splits `$227,999` at the comma boundary — putting `"Price: $227"` in the address field and `"999–$238,399 | ..."` in the city field. The current code doesn't detect and reassemble these split numbers, resulting in prices like `$227` instead of `$227,999`.

### Solution
Replace `supabase/functions/parse-properties/index.ts` with the uploaded v3 file, which adds split-number reassembly in the post-processing merge pass. Key fix (lines 539-545): when an orphan entry's address ends with digits and its city starts with digits, concatenate them before parsing to recover the full number.

### Changes

| File | Action |
|------|--------|
| `supabase/functions/parse-properties/index.ts` | Replace entirely with uploaded v3 |

### What's New in v3 vs Current
1. **Split-number reassembly** — detects `addr="Price: $227"` + `city="999–..."` pattern and concatenates before parsing
2. **PDF artifact normalization** — `"238, 399"` → `"238,399"` (line 454)
3. **Bare number fallback** — catches orphan fragments like `"999–$238"` without a leading `$`
4. **Improved detail string parsing** — handles price ranges, separated beds/baths patterns, stories, garages
5. **Cleanup pass for city field** — detects when city contains `|`, price patterns, or `Beds/Baths/SqFt/Plan` keywords and parses them into proper fields

### Deployment
Redeploy `parse-properties` edge function after file replacement.

