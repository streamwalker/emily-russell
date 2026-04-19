

## Plan: Site-Wide Fair Housing Notice in Footer

### What

Create a small, reusable `FairHousingNotice` component and place it in the footer/bottom area of every page so the disclaimer appears site-wide, not just under the homepage FAQ.

### Component

`src/components/FairHousingNotice.tsx` — a centered, italic, muted block:
- Compact one-line-ish copy (shorter than the FAQ version since it appears everywhere)
- Links to `/fair-housing` (full policy), `niche.com`, and `GreatSchools.org`
- `text-xs italic text-muted-foreground`
- Accepts an optional `variant` prop: `"light"` (for cream/white backgrounds — used on legal pages) and `"dark"` (for the charcoal homepage footer)

### Copy

> *Fair Housing Notice: Equal Housing Opportunity. Emily Russell does not make subjective claims about school quality or community demographics. Verify school information at [niche.com](…) or [GreatSchools.org](…). [Read full policy →](/fair-housing)*

### Where to insert

| File | Placement | Variant |
|---|---|---|
| `src/pages/Index.tsx` | Inside the existing dark `<footer>`, just above the bottom legal links row (line ~870) | `dark` |
| `src/pages/TermsOfService.tsx` | Bottom of main content, before closing wrapper | `light` |
| `src/pages/PrivacyPolicy.tsx` | Bottom of main content, before closing wrapper | `light` |
| `src/pages/TRECDisclosures.tsx` | Bottom of main content, inside the dark wrapper | `dark` |
| `src/pages/FairHousing.tsx` | **Skip** — the page IS the policy; redundant |
| `src/pages/RentVsBuy.tsx` | Inside its existing footer, before final disclaimer | `light` |
| `src/pages/Unsubscribe.tsx` | Bottom of main content | `light` |
| `src/pages/NotFound.tsx` | Bottom of page | `light` |
| `src/pages/PortalDashboard.tsx`, `ClientPortal.tsx`, `ClientLogin.tsx`, `ResetPassword.tsx`, `ChangeEmail.tsx`, `BuyerRepAgreement.tsx`, `AdminDashboard.tsx`, `AdminLeads.tsx` | **Skip** — authenticated/portal pages aren't public marketing surfaces; clients have already signed compliance docs |

For the homepage, the existing FAQ-section disclaimer (with the longer copy + full link) **stays** — the new footer notice is a compact reinforcement, not a replacement.

### Files Changed

| File | Change |
|---|---|
| `src/components/FairHousingNotice.tsx` | **New** — reusable component with `light`/`dark` variants |
| `src/pages/Index.tsx` | Add `<FairHousingNotice variant="dark" />` inside the footer |
| `src/pages/TermsOfService.tsx` | Add `<FairHousingNotice />` at bottom of main |
| `src/pages/PrivacyPolicy.tsx` | Add `<FairHousingNotice />` at bottom of main |
| `src/pages/TRECDisclosures.tsx` | Add `<FairHousingNotice variant="dark" />` near bottom |
| `src/pages/RentVsBuy.tsx` | Add `<FairHousingNotice />` near footer |
| `src/pages/Unsubscribe.tsx` | Add `<FairHousingNotice />` at bottom |
| `src/pages/NotFound.tsx` | Add `<FairHousingNotice />` at bottom |

### Out of scope

- Adding the notice to authenticated portal/admin pages
- Removing the existing larger FAQ-section disclaimer on the homepage
- Modifying the existing EHO logo badges already in the homepage footer
- Touching the `public/rent-vs-buy.html` static page (that's a standalone HTML file with its own embedded compliance section already updated)

