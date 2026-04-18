

## Plan: Rewrite Schools FAQ Answer for TREC/Fair Housing Compliance

### Why this matters

Steering buyers based on school quality is a Fair Housing risk (schools correlate with protected class demographics) and TREC discourages agents from making subjective claims about school quality. The compliant pattern is: **describe the neighborhood, then point buyers to a neutral third-party source to evaluate schools themselves.**

### New copy

Replace the current answer with neighborhood descriptions that omit any qualitative school claims and direct buyers to Niche.com for independent verification:

> "San Antonio offers a wide range of established family neighborhoods. Alamo Ranch (78253) is a fast-growing master-planned community zoned to Northside ISD; Stone Oak (78258) is known for its dining, shopping, and proximity to major employers; Helotes blends Hill Country charm with larger lot sizes; and Boerne and Fair Oaks Ranch offer a small-town feel with easy access to San Antonio. Because school quality is a personal priority and ratings change yearly, we recommend buyers independently research current school information at [niche.com](https://www.niche.com/k12/search/best-schools/m/san-antonio-metro-area/) or [GreatSchools.org](https://www.greatschools.org/) and confirm attendance zones directly with the relevant school district. Emily can connect you with neighborhoods that match your lifestyle, commute, and amenity preferences."

Key compliance moves:
- Removes "top-rated" claim about NISD
- Removes "excellent schools" claim about Stone Oak
- Adds neutral third-party reference (Niche + GreatSchools as backup)
- Adds attendance-zone disclaimer (zones change, district is source of truth)
- Reframes Emily's role around lifestyle/commute/amenities, not schools

### Where it appears

The answer lives in **two synchronized locations** — both must be updated together so the visible UI matches the FAQPage JSON-LD schema (required for Google rich-result validity).

### Files Changed

| File | Change |
|---|---|
| `src/pages/Index.tsx` (FAQ array, ~line 690+) | Replace answer text for "What are the best neighborhoods in San Antonio for families?" |
| `index.html` (FAQPage JSON-LD, ~line 170+) | Mirror the same answer text, with the markdown link converted to plain text + URL since JSON-LD doesn't render markdown |

### JSON-LD note

The visible UI can render the Niche.com link as a clickable anchor (via markdown-to-JSX or a manual `<a>`). The JSON-LD version will inline the URL as plain text (e.g., "research current school information at niche.com (https://www.niche.com/...)") since structured-data answers should be plain strings.

### Out of scope

- Changing the question itself
- Editing other FAQ entries
- Adding a separate "schools" section to the site

