

## Fix Property Data Extraction Quality

### Problem

Two issues are causing garbled extraction results (prices in address fields, broken data):

1. **Lost table structure in PDF text extraction**: `parsePdf` joins all text items on a page with a single space (`items.map(i => i.str).join(" ")`), destroying row/column layout. A table row like `13860 Chital Chase | $227,999 | 3/2 | 1,402` becomes an unstructured blob.

2. **Weak address validation in the AI prompt**: The system prompt doesn't tell the AI how to distinguish a real street address from other data (prices, plan names, metadata).

### Solution

**1. Fix PDF text extraction to preserve spatial layout** (`src/lib/documentParser.ts`)

Replace the naive `.join(" ")` with position-aware reconstruction:
- Use each text item's `transform` matrix (Y coordinate) to detect line breaks
- When the Y position changes significantly, insert a newline instead of a space
- This preserves the table row structure so the AI receives clean, line-separated data

```typescript
// Before (line 44):
const text = content.items.map((item: any) => item.str).join(" ");

// After:
let text = "";
let lastY: number | null = null;
for (const item of content.items) {
  const y = item.transform?.[5];
  if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 5) {
    text += "\n";
  } else if (text.length > 0) {
    text += " ";
  }
  text += item.str;
  if (y !== undefined) lastY = y;
}
```

**2. Add address validation rules to the system prompt** (`supabase/functions/parse-properties/index.ts`)

Add explicit instructions to the SYSTEM_PROMPT:
- A valid address MUST start with a street number (digits) followed by a street name
- Prices, plan names, bed/bath counts, sqft values are NOT addresses
- If a price range appears (e.g. "$227,999–$238,399"), use the lower value for `price`
- Community/subdivision names in parentheses after the street (e.g. "123 Oak Ln (Hidden Oasis)") should be extracted as `community`, with only the street portion as `address`

### Files

| File | Action |
|------|--------|
| `src/lib/documentParser.ts` | Fix `parsePdf` to preserve line breaks using Y-coordinate detection |
| `supabase/functions/parse-properties/index.ts` | Add address validation rules and price range handling to SYSTEM_PROMPT |

