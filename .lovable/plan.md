

## Plan: Site-Wide Fair Housing Copy Audit & Cleanup

### Audit findings

I scanned all visible site copy for language that violates Fair Housing best practices (steering, school-quality claims, demographic implications). Here's what I found:

#### 🔴 High priority — direct school-quality claims

| Location | Current copy | Issue |
|---|---|---|
| `src/pages/Index.tsx:31` (Neighborhoods card — Alamo Ranch) | "Family-friendly master-planned community with **top-rated schools**" | Subjective school rating + "family-friendly" implies familial-status preference |
| `src/pages/Index.tsx:32` (Neighborhoods card — Stone Oak) | "Upscale dining, shopping, and **highly sought-after school district**" | Subjective school claim + "upscale" implies socioeconomic steering |
| `src/pages/Index.tsx:53` (New Home Deal — Redbird Ranch) | Feature bullet: "**Top-rated Northside ISD**" | Subjective school rating |
| `src/pages/Index.tsx:69` (New Home Deal — Stillwater Ranch) | Feature bullet: "**Highly rated schools**" | Subjective school rating |
| `public/rent-vs-buy.html:2262-2263` ("Community & School Choice" pro-item) | "Northside ISD, Comal ISD, and others **rank among the region's best**" | Subjective school-district ranking claim |

#### 🟡 Medium priority — FAQ schema reference to "school district information"

| Location | Current copy | Issue |
|---|---|---|
| `src/pages/Index.tsx:692` and `index.html:188` (Relocation FAQ) | "Emily provides full relocation support including virtual home tours, neighborhood guides, **school district information**, cost-of-living comparisons…" | Implies Emily provides subjective school info; safer to say she points to third-party resources |

#### 🟢 Low priority / acceptable as-is

- "Families relocating to Texas" (About section, line 407) — describing service offering, not steering
- "Real families with their perfect fit" (Recent Sales, line 437) — testimonial framing, not steering
- "Family neighborhoods" (FAQ schools answer) — already balanced with the Niche/GreatSchools disclaimer we just added
- Hero copy ("Perfect Home in San Antonio") — generic, no protected-class language
- Blog teaser titles — neutral (zip codes, buyer tips, relocation logistics)
- "Upscale dining, shopping" — only flagging when paired with school claims; "upscale" describing amenities alone is fine but we'll soften since it's in the same Stone Oak card

### Proposed rewrites

**Neighborhoods (`src/pages/Index.tsx:31-32`):**
- Alamo Ranch: `"Master-planned community zoned to Northside ISD with parks, pools, and walking trails"` (factual zoning, no quality claim)
- Stone Oak: `"Established neighborhood known for dining, shopping, and proximity to major employers"` (drop "upscale" + "sought-after school district")

**New Home Deals (`src/pages/Index.tsx:53, 69`):**
- Redbird Ranch: replace `"Top-rated Northside ISD"` → `"Zoned to Northside ISD"`
- Stillwater Ranch: replace `"Highly rated schools"` → `"Zoned to Northside ISD"` (Stillwater is in NISD)

**Rent-vs-Buy (`public/rent-vs-buy.html:2262-2263`):**
- Heading: keep `"Community & School Choice"`
- Body: `"Homeownership lets you choose your neighborhood and school attendance zone. Buyers should independently verify current school information at niche.com or GreatSchools.org and confirm zoning with the relevant school district."`

**Relocation FAQ (`src/pages/Index.tsx:692` + `index.html:188`):**
- Replace `"school district information"` → `"third-party school research resources"` (mirror in JSON-LD)

### Files Changed

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Rewrite 2 neighborhood descriptions, 2 new-home-deal feature bullets, 1 FAQ answer |
| `public/rent-vs-buy.html` | Rewrite "Community & School Choice" body copy |
| `index.html` | Mirror the FAQ change in the FAQPage JSON-LD schema |

### Out of scope

- Adding a separate Fair Housing disclaimer block (can be a follow-up)
- Touching testimonial text (REVIEWS) — those are verified client quotes and shouldn't be edited
- Blog post titles — already neutral
- Hero copy — already neutral

