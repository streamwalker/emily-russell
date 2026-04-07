

## Add Initials Validation + Fine-tune PDF Footer Coordinates

### Changes

**1. Require initials before signing (`BuyerRepAgreement.tsx`)**

In `handleSubmit` (line 74-114), add validation after the existing checks:
- If `clientInitials` is empty, show `toast.error("Please enter your initials.")` and return
- If `hasSecondClient` and `client2Initials` is empty, show `toast.error("Please enter the second client's initials.")` and return

**2. Fine-tune PDF footer initials coordinates (`generate-agreement-pdf/index.ts`)**

The current initials positions may not perfectly align with the blank lines on the form. Based on the TRX-1501 template structure, the footer initials line ("Initialed for Identification by Broker/Associate ___ and Client ___, ___") needs calibration:

- Adjust `y(736)` to `y(738)` — shift initials slightly higher to sit on the line rather than below it
- Adjust broker initials x from `382` to `385` — center on the first blank
- Adjust client initials x from `445` to `448` — center on the second blank  
- Adjust client2 initials x from `475` to `505` — shift right to the third blank after the comma
- Use `smallSize` (12) consistently for all initials

These are incremental adjustments from the previous correction. The exact values may need one more round of testing.

### Files

| File | Action |
|------|--------|
| `src/pages/BuyerRepAgreement.tsx` | Edit — add initials validation in `handleSubmit` |
| `supabase/functions/generate-agreement-pdf/index.ts` | Edit — adjust footer initials x/y coordinates |

