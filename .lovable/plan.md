

## Fix AI Merging Address + Detail Lines Into Single Properties

### Problem

The source PDF has property data on alternating lines:
- Line 1: `13860 Chital Chase (Hidden Oasis)`
- Line 2: `$227,999–$238,399 | 3/2 | 1,402 | Kitson`

The AI treats each line as a separate property — one with just the address, another with just `Price: $234,999` as the "address". Despite address validation rules saying addresses must start with digits, the AI still creates entries for detail-only lines.

### Root Cause

The SYSTEM_PROMPT tells the AI what a valid address looks like, but doesn't explicitly tell it to **merge detail lines with the preceding address line**. The AI sees two chunks of data and creates two entries.

### Solution

Add a **line-merging rule** to the `SYSTEM_PROMPT` in `supabase/functions/parse-properties/index.ts`:

1. **Add explicit merging instructions**: Tell the AI that if a line contains only price, beds/baths, sqft, plan name, or other property attributes but NO street address, it is continuation data for the nearest preceding property — merge it, don't create a new entry.

2. **Add a post-extraction dedup rule**: Tell the AI that the final output should never contain a property whose "address" is a price, a bed/bath string, a sqft value, or a plan name. If it does, that data belongs to an adjacent property.

3. **Strengthen examples**: Add a concrete example of this alternating-line pattern so the AI knows exactly how to handle it.

### Changes

**`supabase/functions/parse-properties/index.ts`** — Update `SYSTEM_PROMPT` (lines 69-74 area), adding after the existing ADDRESS VALIDATION block:

```
MERGING RULES (critical for PDFs and tabular data):
- Property data often spans MULTIPLE lines. A street address line may be followed by a separate line containing price, beds/baths, sqft, plan name, etc.
- If a line or data chunk has NO valid street address (no leading digits + street name), it is NOT a separate property. Merge its data (price, beds, baths, sqft, plan, status, etc.) into the most recent preceding property that HAS a valid address.
- NEVER create a property entry whose address field contains a price (e.g. "$227,999"), a bed/bath spec (e.g. "3/2"), a sqft value, or a plan/model name. These are attributes, not addresses.
- Example of multi-line property data:
  Line 1: "13860 Chital Chase (Hidden Oasis)"
  Line 2: "$227,999–$238,399 | Beds/Baths: 3/2 | Sq Ft: 1,402 | Plan: Kitson"
  → This is ONE property: address="13860 Chital Chase", community="Hidden Oasis", price=227999, beds=3, baths="2", sqft=1402, plan="Kitson"
```

### Files

| File | Action |
|------|--------|
| `supabase/functions/parse-properties/index.ts` | Add merging rules to SYSTEM_PROMPT to prevent splitting multi-line property data into separate entries |

