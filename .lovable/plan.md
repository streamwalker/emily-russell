

## Plan: Update Buyer's Agent Cost FAQ Copy

Replace the current FAQ answer in two locations to emphasize commission negotiability and the new-construction finder's-fee model.

### New copy

> "Real estate commissions are, of course, negotiable. In most cases involving new construction, the builder pays the buyer's agent commission in the form of a finder's fee — meaning your costs are typically nothing out of pocket. For resale transactions, Emily provides a transparent buyer representation agreement that clearly outlines any fees before you begin your home search."

(The closing sentence about the buyer rep agreement is preserved since it's a TREC-compliance touchpoint and reinforces transparency.)

### Files Changed

| File | Change |
|---|---|
| `src/pages/Index.tsx` (line 689) | Replace FAQ answer text in the visible FAQ array |
| `index.html` (line 164) | Replace matching answer text in the FAQPage JSON-LD schema (must mirror visible copy for AEO/Google rich-result validity) |

### Out of scope

- Changing the question itself ("How much does it cost to hire a buyer's agent in San Antonio?")
- Editing other FAQ entries

