

## Plan: "Rent vs. Buy" Subpage at `/rent-vs-buy`

### Approach
The uploaded file is a fully self-contained HTML page (2,661 lines) with inline CSS, inline JavaScript calculator logic, and JSON-LD structured data. The cleanest, lowest-risk way to load it as a subpage is to **serve it as a static asset** from the `public/` folder and route to it — preserving its exact styling, scripts, and SEO/AEO schemas without needing to port hundreds of lines of CSS/JS into React.

### Steps

1. **Copy the HTML file into `public/`**
   - Destination: `public/rent-vs-buy.html`
   - Files placed in `public/` are served as-is at the matching URL path on Lovable hosting.

2. **Add a React route that renders the static page**
   - Create `src/pages/RentVsBuy.tsx` — a thin wrapper that immediately redirects (`window.location.replace("/rent-vs-buy.html")`) so the URL `/rent-vs-buy` loads the static HTML.
   - Register the route in `src/App.tsx`: `<Route path="/rent-vs-buy" element={<RentVsBuy />} />` placed above the catch-all `*`.
   - This gives the user the clean URL they asked for (`/rent-vs-buy`) while serving the rich self-contained page.

3. **Update canonical URLs inside the copied HTML**
   - The uploaded file references `https://www.emilyrussellrealty.com/buy-vs-rent-san-antonio-2026` in its canonical / OG / Twitter / JSON-LD tags.
   - Replace those with `https://www.alamocitydesigns.com/rent-vs-buy` (the project's actual custom domain) so SEO/AEO signals point to the correct live URL.

4. **Add a navigation link on the homepage**
   - Add "Rent vs. Buy" to the `NAV_ITEMS` in `src/pages/Index.tsx` as an external link (since it lives at a different route, not an in-page anchor) — link target `/rent-vs-buy`.

5. **Add the page to `public/sitemap.xml`**
   - Append a `<url>` entry for `/rent-vs-buy` so search engines discover it.

### Files Changed

| File | Action |
|------|--------|
| `public/rent-vs-buy.html` | Create (copy of uploaded file with canonical URLs swapped to alamocitydesigns.com) |
| `src/pages/RentVsBuy.tsx` | Create (redirect wrapper) |
| `src/App.tsx` | Add `/rent-vs-buy` route + import |
| `src/pages/Index.tsx` | Add "Rent vs. Buy" nav link pointing to `/rent-vs-buy` |
| `public/sitemap.xml` | Add sitemap entry |

### Why static HTML rather than porting to React
- The page is 2,661 lines with its own design system, custom CSS, and a stateful vanilla-JS calculator. Porting to React/Tailwind would take many hours and risk breaking the calculator logic or schema markup.
- Lovable hosting serves `public/` files directly with proper MIME types — JSON-LD, meta tags, and inline scripts all work normally for SEO/AEO.
- The page remains independently editable and won't be affected by future React/Tailwind refactors.

