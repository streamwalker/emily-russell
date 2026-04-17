

## Plan: Favicon + Open Graph Image from Emily's Headshot

Generate two new brand assets from Emily's new headshot using AI image editing (Nano Banana Pro), then wire them into the site.

### Assets to Create

1. **Favicon** (`public/favicon.png`, 512×512 square)
   - Tight crop on Emily's face, centered
   - Subtle gold ring/border to match brand palette
   - Cream background fill so it reads cleanly at 16×16 / 32×32 in browser tabs
   - Generated via Lovable AI image edit (`google/gemini-3-pro-image-preview`) using the existing `public/emily-russell.png` as input

2. **Open Graph share image** (`public/og-emily-russell.jpg`, 1200×630)
   - Emily's headshot on the left third
   - Right side: "Emily Russell" / "San Antonio REALTOR®" / "alamocitydesigns.com" in Playfair Display + DM Sans on a cream/charcoal split
   - Subtle gold accent line — matches brand tokens (gold, charcoal, cream)
   - Generated via the same AI image edit flow

### Generation Approach

A one-off Node script (`/tmp/gen-brand-assets.mjs`) calls the Lovable AI Gateway (`LOVABLE_API_KEY` already available) with the existing headshot as input image and explicit composition prompts. Outputs base64 → decoded to PNG/JPG → written to `public/`. After generation: visually QA each asset by viewing it, fix the prompt and regenerate if anything looks off (clipped face, wrong colors, illegible text on OG).

### Wiring Changes

| File | Change |
|---|---|
| `public/favicon.png` (new) | AI-generated favicon |
| `public/og-emily-russell.jpg` (new) | AI-generated 1200×630 OG image |
| `public/favicon.ico` | Delete (browsers auto-request `/favicon.ico` and would override the new PNG) |
| `index.html` | Replace any existing favicon `<link>` with `<link rel="icon" href="/favicon.png" type="image/png">`; update `og:image` and `twitter:image` meta tags from the current Google Storage URL → `https://alamocitydesigns.com/og-emily-russell.jpg`; update the JSON-LD `RealEstateAgent.image` field to the same URL |
| `public/rent-vs-buy.html` | Update its `og:image` / `twitter:image` / JSON-LD `image` references the same way |

### Out of Scope
- Apple touch icons / Android manifest icons (can add in a follow-up if desired)
- Per-page custom OG images (single sitewide OG for now)
- Touching the homepage hero or any visible UI — only metadata + favicon

