

## Changes to Emily Russell Realty Website

### 1. Update Email Address
Replace all instances of `alamocitydesignsllc@gmail.com` with `emily@streamwalkers.com` (lines 288, 495).

### 2. Update Brokerage from "Option One Real Estate" to "Fathom Realty"
Replace all references:
- Hero badge text (line 158)
- About section bio (line 273)
- Contact section brokerage info (line 497)
- Footer description (line 563)
- Footer copyright (line 581)

### 3. Add NuBuild Logo
Copy the uploaded NuBuild logo (`user-uploads://Image_3-31-26_at_14.16.png`) to `src/assets/nubuild_logo.png` and display it in a new section or alongside the Fathom Realty branding.

### 4. Add Equal Housing / Fathom Realty Logos
Copy the uploaded Equal Housing + Fathom Realty image (`user-uploads://Image_3-31-26_at_14.16_1.png`) to `src/assets/fathom_eho.png` and display in the footer area as brokerage/compliance branding.

### 5. Add "Featured New Home Deals" Section
Add a new section (between Neighborhoods and Reviews, or after Recent Sales) showcasing the 3 NuBuild communities from the scraped data:

- **Redbird Ranch** — Starting from $217,000, northwest SA, brick/stone/siding exteriors
- **Ladera** — Starting from $349,990, gated master-planned, Coventry Homes
- **Stillwater Ranch** — Starting from $380,000, resort-style, community amenities

Each card will show the community image (from NuBuild URLs), name, starting price, key features, and a CTA linking to `https://nubuildhomes.com/markets/san-antonio/#get-deal`. The section header will include the NuBuild logo with "Powered by NuBuild" or "In Partnership with NuBuild" branding. Nav will be updated to include the new section.

### Technical Details
- **Files modified**: `src/pages/Index.tsx`
- **Files created**: `src/assets/nubuild_logo.png`, `src/assets/fathom_eho.png` (copied from uploads)
- All NuBuild community images will use external URLs from `nubuildhomes.com`
- New data array `NEW_HOME_DEALS` added at top of file alongside existing data arrays

