

## Plan: iOS Splash Screens + Legal Page OG Images

Two additive asset-generation tasks. No UI/logic changes — only new image files and `<head>` metadata wiring.

---

### Problem with iOS splash screens in this app

iOS only shows splash screens for sites added to the home screen **as standalone PWAs**. Our `site.webmanifest` uses `display: "browser"` (intentional — we don't want PWA app-shell behavior). With `display: browser`, iOS opens the site in Safari from the home-screen icon and **never shows a splash screen** regardless of how many `apple-touch-startup-image` tags we add.

**Two options** (need user input):

**Option A — Switch to `display: "standalone"`** so splash screens actually fire. Trade-off: site opens in a fullscreen webview instead of Safari (no address bar, no Safari back gesture, share sheet works differently). This is what real PWAs do.

**Option B — Skip splash screens** and just generate the legal page OG images. Keep `display: browser` for normal Safari behavior.

I'll ask before generating ~10 large image files that may not even render.

---

### 2. Legal page OG images (no blockers)

Three dedicated 1200×630 OG images, one per legal page, all featuring brand identity (cream bg, charcoal/gold accents, Playfair + DM Sans) but with page-specific headlines:

| File | Headline | Subtext |
|---|---|---|
| `public/og-trec.jpg` | "TREC Disclosures" | "Texas Real Estate Commission · Emily Russell, REALTOR®" |
| `public/og-privacy.jpg` | "Privacy Policy" | "Emily Russell · alamocitydesigns.com" |
| `public/og-terms.jpg` | "Terms of Service" | "Emily Russell · alamocitydesigns.com" |

Composition: Brand mark / Emily's small headshot in a corner, large headline, subtle gold divider. Generated via the ai-gateway skill (`google/gemini-3-pro-image-preview`) using `public/emily-russell.png` as input. Visual QA each one.

---

### Wiring for legal pages

`TRECDisclosures.tsx`, `PrivacyPolicy.tsx`, `TermsOfService.tsx` are React routes — `index.html` `<head>` is static and shared. To give each route its own OG image, install **`react-helmet-async`** (lightweight, standard) and add a `<Helmet>` block per page setting:
- `<meta property="og:image">`, `og:image:width/height/alt`
- `<meta name="twitter:image">`
- `<meta property="og:title">` / `og:description` per page
- `<link rel="canonical">` per page

Wrap `<App>` in `<HelmetProvider>` in `src/main.tsx`.

(Note: crawlers like LinkedIn/Twitter run JS now, but they prefer static `<head>` tags. For best results we'd need SSR — out of scope. `react-helmet-async` works for Facebook/LinkedIn's modern crawlers and for any AEO/AI scraper using a headless browser, which is the realistic audience.)

---

### iOS splash screens (pending choice above)

If user picks Option A, generate 8 `apple-touch-startup-image` PNGs covering the major iPhone/iPad sizes (portrait + landscape for each), wire them with media-query-scoped `<link>` tags in `index.html`, and flip manifest to `display: standalone`. Generation: one master cream-bg portrait of Emily centered with brand mark, then Pillow-resize/letterbox to each target resolution.

Sizes (portrait, with landscape pairs):
- iPhone 15 Pro Max: 1290×2796
- iPhone 15 Pro / 14 Pro: 1179×2556
- iPhone 14 / 13 / 12: 1170×2532
- iPhone SE: 750×1334
- iPad Pro 12.9": 2048×2732
- iPad Pro 11" / Air: 1668×2388
- iPad 10.9": 1640×2360
- iPad mini: 1488×2266

---

### Files Changed (if both options approved)

| File | Change |
|---|---|
| `public/og-trec.jpg` (new) | AI-generated 1200×630 |
| `public/og-privacy.jpg` (new) | AI-generated 1200×630 |
| `public/og-terms.jpg` (new) | AI-generated 1200×630 |
| `public/splash/*.png` (new, ×16) | Splash images, portrait+landscape, only if Option A |
| `src/pages/TRECDisclosures.tsx` | Add `<Helmet>` block |
| `src/pages/PrivacyPolicy.tsx` | Add `<Helmet>` block |
| `src/pages/TermsOfService.tsx` | Add `<Helmet>` block |
| `src/main.tsx` | Wrap `<App>` in `<HelmetProvider>` |
| `package.json` | Add `react-helmet-async` |
| `index.html` | Only if Option A: add `apple-touch-startup-image` link tags |
| `public/site.webmanifest` | Only if Option A: change `display` to `standalone` |

### Decision needed

Please pick an iOS splash option below before I proceed.

