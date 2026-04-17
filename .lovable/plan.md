

## Plan: Fix Photo + Contact Info + Internal Links on /rent-vs-buy

### 1. Replace agent photo
- Copy uploaded `user-uploads://emily-russell.png` to `public/emily-russell.png` so the four existing `<img src="emily-russell.png">` references render the real photo (currently broken — file doesn't exist in `public/`).

### 2. Fix contact info to match the rest of the site
Current placeholders in `public/rent-vs-buy.html` don't match brand memory. Replace:

| Field | Current | Replace with |
|------|---------|--------------|
| Phone (line 40, JSON-LD) | `+1-210-555-0142` | `+1-210-912-0806` |
| Phone link (line 2112) | `tel:+12105550142` | `tel:+12109120806` |
| Email (line 41, JSON-LD) | `emily@emilyrussellrealty.com` | `emily@streamwalkers.com` |
| Email link (line 2113) | `mailto:emily@emilyrussellrealty.com` | `mailto:emily@streamwalkers.com` |
| JSON-LD `image` (line 43) | `emilyrussellrealty.com/emily-russell.jpg` | `https://www.alamocitydesigns.com/emily-russell.png` |
| JSON-LD `url` (line 42) | `https://www.emilyrussellrealty.com` | `https://www.alamocitydesigns.com` |

Also add TREC license `#791742` and Fathom Realty mention to the JSON-LD `RealEstateAgent` schema (`brand` + `identifier`) for AEO consistency with the rest of the site.

### 3. Add internal links back to homepage (SEO juice)
Add contextual links to two high-value spots:

- **In the closing FAQ block** (around line 2086, "Who is Emily Russell" answer): add link `<a href="/#faq">See more San Antonio buyer FAQs →</a>` and `<a href="/#newhomes">Browse new construction homes in San Antonio →</a>`.
- **In the dedicated Emily section** (around line 2102, after the "$180K starter homes to $5M Dominion estates" paragraph): add a small `internal-links` line:
  > "Explore more: <a href='/#newhomes'>New Construction Homes</a> · <a href='/#faq'>Buyer FAQ</a> · <a href='/#areas'>San Antonio Neighborhoods</a>"
- **In the fine-print/footer** (line 2121 area): add a discreet "Back to alamocitydesigns.com home" link.

These links use root-relative `/#anchor` URLs so they work from `/rent-vs-buy.html` and land on the React homepage at the right scroll position.

### Files Changed

| File | Action |
|------|--------|
| `public/emily-russell.png` | Create (copy from upload) |
| `public/rent-vs-buy.html` | Update phone, email, JSON-LD URLs + image, add 3 internal-link blocks |

No React/route changes needed — image and links are all inside the static HTML.

