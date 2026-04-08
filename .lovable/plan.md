

## Fix Parse-Properties: Truncated Prices and Misparsed Fields

### Problem

Testing the `parse-properties` function reveals the AI returns truncated prices — `$227,999` becomes `227` instead of `227999`. The AI tool call schema defines price as `type: "number"`, and the LLM mishandles comma-formatted currency values, stopping at the comma. Other fields like beds/baths occasionally get swapped.

Test result showing the bug:
```
"price": 227    ← should be 227999
"price": 245    ← should be 245000  
"price": 310    ← should be 310000
```

### Root Cause

The tool call schema says `price: { type: "number" }`. When the AI sees "$227,999", it strips the `$` but treats the comma as a decimal/thousands separator ambiguously, often returning just `227`.

### Fix (in `supabase/functions/parse-properties/index.ts`)

**1. Add price sanity check in post-processing (after line 582)**

After the existing cleanup pass, add a new pass that:
- Checks every property's `price` field
- If `price < 10000` (no real property costs less than $10k), attempt to re-extract from the raw input text by searching for the property's address and finding the nearest dollar amount
- Use the existing `parseDetailString()` function logic to get the correct price

```typescript
// After the city/community cleanup pass:
for (const tabKey of Object.keys(dossierData.properties)) {
  for (const p of dossierData.properties[tabKey]) {
    // Fix truncated prices (AI often returns 227 instead of 227999)
    if (p.price && p.price > 0 && p.price < 10000) {
      // Search raw text for this address and nearby price
      const addrEscaped = (p.address || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const addrIdx = enrichedText.indexOf(p.address);
      if (addrIdx >= 0) {
        const nearby = enrichedText.slice(addrIdx, addrIdx + 500);
        const priceMatch = nearby.match(/\$([\d,]+)/);
        if (priceMatch) {
          const corrected = parseInt(priceMatch[1].replace(/,/g, ""), 10);
          if (corrected > 10000) p.price = corrected;
        }
      }
    }
  }
}
```

**2. Strengthen the system prompt** (line ~17 area)

Add to the CRITICAL RULES section:
```
- For price: the value MUST be the full integer amount. "$227,999" → 227999 (NOT 227). Remove dollar signs, commas, and spaces before converting to a number. "$1,234,567" → 1234567.
```

**3. Enrich-properties "No search results"**

This is a data issue — these are likely new construction properties not yet indexed by search engines. No code fix needed. The OSINT Analyst works correctly but simply found nothing to scrape for these addresses.

### Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/parse-properties/index.ts` | Add price sanity post-processing + strengthen prompt on number formatting |

### Deployment

Redeploy `parse-properties` edge function after changes.

