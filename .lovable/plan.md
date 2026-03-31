

## SEO Enhancements & Affiliate Partner Network Dropdown

### 1. Add "Affiliate Partner Network" Dropdown to Navigation

Add a dropdown menu in the top nav bar (both desktop and mobile) labeled **"Affiliate Partner Network"** containing links to all specified sites:

| Label | URL |
|---|---|
| Streamwalkers | https://streamwalkers.com |
| DripSlayer | https://dripslayer.streamwalkers.com |
| Lead Genius | https://leadgenius.equiforge.ai |
| Relocation Compass | https://relocate.boaster.io |
| Herolic | https://herolic.com |
| OfferScope | https://offerscope.io |
| TCL | https://tcl.streamwalkers.com |
| OmniCredits | https://omnicredits.streamwalkers.com |
| EquiForge | https://equiforge.ai |

Desktop: CSS hover-triggered dropdown styled to match the dark nav. Mobile: expandable accordion item in the hamburger menu.

### 2. SEO-Boosting External Authority Links

Add outbound links to high-authority real estate sites that can drive traffic and potentially reciprocate. These go in the **footer** under a new "Resources" column:

- **Realtor.com** — San Antonio listings page
- **HAR.com** — Texas MLS resource
- **San Antonio Board of REALTORS (SABOR)** — local authority
- **Zillow San Antonio** — already partially linked
- **Neighborhoodscout.com** — neighborhood data

### 3. Additional SEO Meta Tags in `index.html`

- Add `<link rel="canonical" href="https://emily-russell.lovable.app/" />`
- Add structured data (JSON-LD) for `RealEstateAgent` schema
- Add `<meta name="robots" content="index, follow" />`
- Add geo meta tags for San Antonio

### 4. Update Footer Partner Tools Column

Expand the existing "Partner Tools" footer column to include all 9 affiliate links (matching the nav dropdown).

### Technical Details

- **Files modified**: `src/pages/Index.tsx`, `index.html`
- Nav dropdown uses pure CSS/state hover — no new dependencies needed
- All external links use `target="_blank" rel="noopener noreferrer"` for security
- Affiliate links use descriptive anchor text for SEO value
- JSON-LD structured data added as inline `<script>` in `index.html`

