

## Fix Remaining Domain References & CSP

### Changes to `index.html`

**1. Update CSP frame-ancestors (line 15)**
Add `https://alamocitydesigns.com` to the `frame-ancestors` directive alongside the existing `https://*.lovable.app`.

**2. Fix JSON-LD image (line 39)**
Change `"image": "https://lovable.dev/opengraph-image-p98pqg.png"` to use the actual social image already referenced in OG tags:
`"image": "https://storage.googleapis.com/gpt-engineer-file-uploads/QZAeNqy6yxOqJTh5qCxXoi9l0uO2/social-images/social-1774995225071-Image_3-31-26_at_17.08.webp"`

**3. Add missing `og:url` meta tag**
Add `<meta property="og:url" content="https://alamocitydesigns.com/" />` alongside the existing OG tags.

### Already Correct (no changes needed)
- `robots.txt` — Sitemap points to `alamocitydesigns.com`
- `sitemap.xml` — All URLs use `alamocitydesigns.com`
- Canonical link — `alamocitydesigns.com`
- JSON-LD `url` — `alamocitydesigns.com`
- OG title, description, image — all correct

### Files
| File | Action |
|------|--------|
| `index.html` | Edit — 3 small fixes (CSP, JSON-LD image, og:url) |

