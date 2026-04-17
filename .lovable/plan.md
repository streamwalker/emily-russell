

## Plan: Rent vs Buy OG Image + Mobile Home-Screen Icons

Two additive asset-generation tasks. No UI changes, only new image files + metadata wiring.

---

### 1. Dedicated Rent vs Buy OG image

**Asset**: `public/og-rent-vs-buy.jpg` (1200×630)

**Composition**:
- Left third: Emily's headshot (using existing `public/emily-russell.png` as input to AI edit)
- Right two-thirds: "Rent vs Buy" (Playfair Display, large) / "in San Antonio" (Playfair Display, smaller) / "Free Calculator · alamocitydesigns.com" (DM Sans, small)
- Brand palette: cream background, charcoal text, gold accent line/divider
- Subtle calculator-themed accent (e.g. gold dollar mark or chart icon) to differentiate from sitewide OG

**Generation**: AI image edit via `google/gemini-3-pro-image-preview` using the ai-gateway skill script, with `public/emily-russell.png` as the input image and a detailed composition prompt. Visual QA after generation, regenerate if face is clipped, text is illegible, or layout is off.

**Wiring** — update `public/rent-vs-buy.html`:
- Add `<meta property="og:image" content="https://alamocitydesigns.com/og-rent-vs-buy.jpg">`
- Add `<meta property="og:image:width" content="1200">` / `og:image:height` / `og:image:alt`
- Add `<meta name="twitter:image" content="https://alamocitydesigns.com/og-rent-vs-buy.jpg">`
- Update JSON-LD `image` field to the new URL

(The page currently inherits the sitewide OG; this gives it its own.)

---

### 2. Mobile home-screen icons

**Assets** (all generated from Emily's headshot, square format with cream bg + gold ring matching the existing favicon):

| File | Size | Purpose |
|---|---|---|
| `public/apple-touch-icon.png` | 180×180 | iOS Safari "Add to Home Screen" |
| `public/icon-192.png` | 192×192 | Android home screen (standard density) |
| `public/icon-512.png` | 512×512 | Android home screen (high density) + PWA splash |
| `public/site.webmanifest` | — | Tells Android which icons to use |

**Generation**: Same AI edit pipeline as the favicon — tight crop, cream bg, gold ring. Generate one master 512×512 PNG, then downscale via Pillow to 192 and 180 for crisp results (no blurry AI re-renders at smaller sizes).

**Wiring** — update `index.html` `<head>`:
```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#fdfaf3">
```

**`public/site.webmanifest`** (new, minimal PWA-style manifest):
```json
{
  "name": "Emily Russell Realtor",
  "short_name": "Emily Russell",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#c9a961",
  "background_color": "#fdfaf3",
  "display": "browser"
}
```

(`display: browser` keeps it from acting like a full PWA — just provides icons without claiming app-shell behavior.)

---

### Files Changed

| File | Change |
|---|---|
| `public/og-rent-vs-buy.jpg` (new) | AI-generated 1200×630 OG image |
| `public/apple-touch-icon.png` (new) | 180×180 iOS icon |
| `public/icon-192.png` (new) | 192×192 Android icon |
| `public/icon-512.png` (new) | 512×512 Android/PWA icon |
| `public/site.webmanifest` (new) | Web app manifest pointing at the icons |
| `index.html` | Add apple-touch-icon, icon-192/512, manifest, theme-color tags |
| `public/rent-vs-buy.html` | Add og:image / twitter:image / dimensions / alt + update JSON-LD `image` to new OG |

### Out of Scope
- Touching any visible UI or calculator logic
- Maskable icon variants (can add later if Android adaptive icons are needed)
- iOS splash screen images (rare to need; can add later)

