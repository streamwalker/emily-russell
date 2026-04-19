

## Plan: Add Fair Housing Disclaimer Below FAQ

### What

Add a small, italic, muted disclaimer block immediately below the FAQ section on the homepage that reinforces Fair Housing compliance and clarifies the limits of what Emily will opine on.

### Copy

> *Fair Housing Notice: Emily Russell is committed to compliance with all federal, state, and local Fair Housing laws and does not make subjective claims about school quality, neighborhood demographics, or community composition. For school ratings and attendance zones, please consult independent third-party resources such as [niche.com](https://www.niche.com) or [GreatSchools.org](https://www.greatschools.org) and verify directly with the relevant school district. Equal Housing Opportunity.*

### Where

`src/pages/Index.tsx` — directly after the closing tag of the FAQ section's container, before the next section begins. The block will be a centered, max-width paragraph with:
- Small text size (`text-xs`)
- Muted foreground color (`text-muted-foreground`)
- Italic style
- Modest vertical padding (`py-6`)
- Cream/neutral background to visually separate it from the FAQ cards without competing for attention
- Inline `<a>` links to niche.com and GreatSchools.org with `target="_blank"` and `rel="noopener noreferrer"`

### Files Changed

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Insert a new `<div>` block with the Fair Housing disclaimer copy immediately after the FAQ section |

### Out of scope

- Adding the disclaimer to other pages (rent-vs-buy already has school-research links; legal pages have their own compliance copy)
- Modifying the existing footer Equal Housing Opportunity logo/badge (already present from earlier compliance work)
- Adding a separate route for a full Fair Housing policy page

