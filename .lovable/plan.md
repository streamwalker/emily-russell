

## Plan: Complete TREC + Fair Housing Footer Compliance

Goal: Make the footer fully TREC- and NAR-compliant by exposing both required Texas disclosure links separately and adding the standard trust/compliance logos.

### What's there now

The footer currently has a single combined "TREC Disclosures" link to `/trec` (which renders both IABS and Consumer Protection Notice on one page). Per TREC rules, both notices must be conspicuously available — a single combined link satisfies the rule, but splitting them into two clearly labeled links is the standard compliant pattern most Texas brokerages use, and it's what TREC's own example markup shows.

I need to read the current footer + Index page to confirm exact markup before planning surgical edits.

### Investigation step (will do during implementation)

- `code--view src/pages/Index.tsx` — locate the footer block, confirm current TREC link markup, surrounding layout, classes
- `code--list_dir public/images` — confirm what's already there so I name new logo files without collisions

### Changes

**1. Split TREC disclosures into two side-by-side footer links**

Replace the single "TREC Disclosures" link with two links rendered side-by-side (separated by a `·` or `|` divider, matching the existing footer typography):

- "Information About Brokerage Services" → `/trec#iabs`
- "Consumer Protection Notice" → `/trec#cn`

Then add `id="iabs"` and `id="cn"` anchors to the two `<section>` blocks in `src/pages/TRECDisclosures.tsx` so the deep links scroll to the right disclosure. Both still live on the same `/trec` page (one canonical disclosures page is cleaner for SEO and matches what the TREC page already renders), but each link goes straight to its specific notice.

**2. Add compliance logos to footer**

Three standard logos, displayed inline beside the disclosure links in the footer (small, ~32–40px tall, monochrome/light variants to fit the dark charcoal footer):

| Logo | Source | Notes |
|---|---|---|
| Equal Housing Opportunity (EHO) | Generate via AI image edit (white version on transparent bg) | Required by HUD for any real estate marketing |
| REALTOR® "R" mark | Generate via AI image edit (gold/white version) | NAR member trademark |
| Fathom Realty / sponsoring broker | Skip unless user wants it — Fathom branding text is already in the footer disclaimer | Optional |

All three logos placed in `public/images/compliance/` as SVG or PNG (PNG via AI image edit, since we don't have official SVG sources and downloading from third parties has trademark licensing concerns). Each wrapped in a small text label (`alt="Equal Housing Opportunity"`, etc.) for accessibility.

Layout in footer (mobile-stacked, desktop-row):

```text
[ EHO logo ] [ REALTOR® logo ]    Information About Brokerage Services · Consumer Protection Notice
```

**3. Update `mem://legal/compliance-requirements`**

Append a note that both TREC notices are now exposed as separate footer links and that EHO + REALTOR® logos are displayed.

### Files Changed

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Footer: replace single TREC link with two split links + logo row |
| `src/pages/TRECDisclosures.tsx` | Add `id="iabs"` / `id="cn"` to the two sections; add `scroll-mt-20` for sticky-header offset |
| `public/images/compliance/eho.png` (new) | AI-generated Equal Housing Opportunity logo, white-on-transparent |
| `public/images/compliance/realtor-r.png` (new) | AI-generated REALTOR® R mark, gold-on-transparent |
| `mem://legal/compliance-requirements` | Note the split links + logos |

### Out of scope

- MLS / IDX broker reciprocity logos (only required when displaying MLS listings, which the site does not)
- Fathom Realty broker logo (already covered by text in the footer; can add if user wants a visual mark)
- Texas REALTORS® member logo (optional, not required — keeping the footer clean)

