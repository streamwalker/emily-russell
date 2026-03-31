

## Add TREC-Required IABS & Consumer Protection Notice Links

### Background

TREC (Texas Real Estate Commission) requires that the **Information About Brokerage Services (IABS)** form and the **Consumer Protection Notice (CN 1-5)** be conspicuously available to consumers. Texas law allows these to be provided via a link on a website, but the link must be prominent — not buried in a footer.

### Plan

#### 1. Copy uploaded images to project
- Copy `IABS.jpg` → `public/images/IABS.jpg`
- Copy `Image_3-31-26_at_17.21.png` → `public/images/TREC_Consumer_Protection_Notice.png`

#### 2. Create dedicated TREC disclosures page (`src/pages/TRECDisclosures.tsx`)
- A clean page displaying both documents (IABS and Consumer Protection Notice) as full-width images
- Include heading: "Texas Real Estate Commission Disclosures"
- Show both documents with labels
- Link to `www.trec.texas.gov` for additional info
- Styled consistently with TermsOfService/PrivacyPolicy pages

#### 3. Add route in `src/App.tsx`
- Add `/trec` route pointing to the new page

#### 4. Add above-the-fold link in hero section (`src/pages/Index.tsx`)
- In the hero section (around line 293-300, near the star rating area), add a small but visible line:
  - Text: `"TREC: Information About Brokerage Services | Consumer Protection Notice"`
  - Links to `/trec` page
  - Styled as subtle but readable text (similar to the "5.0 Rating on Zillow" line) to comply with TREC's "conspicuous" requirement without disrupting the design

#### 5. Also add TREC links in the footer
- Add a "TREC Disclosures" link in the footer legal section alongside Terms and Privacy links

### Files

| File | Action |
|------|--------|
| `public/images/IABS.jpg` | Copy from upload |
| `public/images/TREC_Consumer_Protection_Notice.png` | Copy from upload |
| `src/pages/TRECDisclosures.tsx` | Create |
| `src/App.tsx` | Edit — add `/trec` route |
| `src/pages/Index.tsx` | Edit — add hero link + footer link |

