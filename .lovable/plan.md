

## Enhance PDF Output + Add Initials Input Field

### Changes

**1. Increase PDF font sizes by 150% (Edge Function)**

In `supabase/functions/generate-agreement-pdf/index.ts`, change:
- `fontSize` from `10` to `15`
- `smallSize` from `8` to `12`
- Page header font size from `8` to `12`

**2. Add client initials input fields (Frontend)**

In `src/pages/BuyerRepAgreement.tsx`:
- Add `clientInitials` state (and `client2Initials` for co-client)
- Add an "Initials" input field in the Signature Block section, styled like a small text input (2-3 characters wide), with label "Your Initials"
- Add a matching initials field for the second client when `hasSecondClient` is true
- Pass `clientInitials` and `secondClient.initials` in the form payload to the edge function and store in `form_data`

**3. Stamp initials on pages 1-5 footer (Edge Function)**

In the edge function:
- Accept `clientInitials` and `secondClient.initials` from the request body
- On pages 1-5 (indices 0-4), draw the initials in the footer area where the form says "Initialed for Identification by Broker/Associate _______ and Client _______, _______"
- Based on the uploaded screenshot, the initials line is near the bottom of each page. Draw client initials after "and Client" and co-client initials after the comma, using the larger font size

### Technical Details

**Footer initials coordinates** (from the screenshot showing "Page 3 of 6"):
- The initials line appears at approximately `top ≈ 745` (near bottom of page)
- "Broker/Associate" initials at approximately `x ≈ 310`
- "Client" initials at approximately `x ≈ 450`
- Second client initials at approximately `x ≈ 510`
- Broker initials will be auto-filled as "ER" (Emily Russell)

**Font sizes after 150% increase:**
- Main text: 15pt (was 10pt)
- Small text: 12pt (was 8pt)

### Files

| File | Action |
|------|--------|
| `supabase/functions/generate-agreement-pdf/index.ts` | Edit — increase all font sizes by 150%, add initials stamps on pages 1-5 footer |
| `src/pages/BuyerRepAgreement.tsx` | Edit — add initials input fields for client and co-client, pass to edge function |

