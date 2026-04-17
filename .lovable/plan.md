

## Plan: Replace Emily's Headshot Sitewide

The new headshot needs to replace **two image files** that together cover every reference on the site:

| File | Used by |
|---|---|
| `src/assets/Emily_Russell.png` | `src/pages/Index.tsx` (homepage hero/about section) |
| `public/emily-russell.png` | `public/rent-vs-buy.html` (3 inline banners + 1 portrait + JSON-LD `image` schema URL `https://www.alamocitydesigns.com/emily-russell.png`) |

### Steps
1. Copy the uploaded image to `src/assets/Emily_Russell.png` (overwrites existing — Vite will rebundle, all `Index.tsx` references update automatically).
2. Copy the uploaded image to `public/emily-russell.png` (overwrites existing — all `<img src="emily-russell.png">` tags in `rent-vs-buy.html` and the JSON-LD `image` URL pick it up automatically).

### What this updates automatically (no code changes needed)
- Homepage "Meet Emily" section
- Rent vs Buy: 3 inline Emily banners + 1 contact-section portrait
- Schema.org `RealEstateAgent` JSON-LD `image` field (used by Google/Bing/AI search engines)
- Open Graph and any other consumers of these two paths

### Files Changed
| File | Change |
|---|---|
| `src/assets/Emily_Russell.png` | Replace with uploaded image |
| `public/emily-russell.png` | Replace with uploaded image |

No code edits, no migrations, no component changes — just two binary file replacements.

