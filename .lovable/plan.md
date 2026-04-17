

## Plan: iOS Splash Screens + Standalone PWA Mode

Generate iOS splash screen images and switch the manifest to `display: standalone` so iOS actually fires them when the site is launched from the home screen.

### Manifest change

Update `public/site.webmanifest`: `"display": "browser"` → `"display": "standalone"`. This makes iOS launch the site fullscreen (no Safari chrome) from the home-screen icon, which is the prerequisite for splash screens to render.

### Splash screen generation

**Master image**: One AI-generated 2048×2732 portrait (iPad Pro 12.9" — largest target) with:
- Cream background (`#fdfaf3`)
- Emily's headshot centered in upper-middle area, circular crop with subtle gold ring (matches favicon)
- Below the portrait: "Emily Russell" (Playfair Display) / "REALTOR® · San Antonio" (DM Sans) / small gold divider
- Generous safe-zone padding so nothing gets clipped on narrow phone aspect ratios
- Generated via `google/gemini-3-pro-image-preview` using `public/emily-russell.png` as input

**Resize pipeline**: Pillow center-crops/letterboxes the master into each target resolution (cream-fill on letterbox bars to preserve brand), producing crisp PNGs at each device size — no AI re-rendering at smaller sizes.

**16 files in `public/splash/`** (8 sizes × portrait + landscape):

| Device | Portrait | Landscape |
|---|---|---|
| iPhone 15 Pro Max | 1290×2796 | 2796×1290 |
| iPhone 15 Pro / 14 Pro | 1179×2556 | 2556×1179 |
| iPhone 14/13/12 | 1170×2532 | 2532×1170 |
| iPhone SE | 750×1334 | 1334×750 |
| iPad Pro 12.9" | 2048×2732 | 2732×2048 |
| iPad Pro 11" / Air | 1668×2388 | 2388×1668 |
| iPad 10.9" | 1640×2360 | 2360×1640 |
| iPad mini | 1488×2266 | 2266×1488 |

**QA**: View 4 representative outputs (smallest iPhone portrait, largest iPad portrait, one landscape, one mid-size) to confirm no face clipping, correct aspect, legible text. Regenerate master if issues.

### Index.html wiring

Add 16 `<link rel="apple-touch-startup-image">` tags inside `<head>`, each scoped with a precise media query matching device-width × device-height × `-webkit-device-pixel-ratio` × orientation. Example:

```html
<link rel="apple-touch-startup-image" href="/splash/iphone-15-pro-max-portrait.png"
  media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
```

Without exact media queries iOS picks none of them, so each splash needs its own scoped tag.

### PWA caveat (already handled)

This is a **manifest-only** PWA — no service worker, no `vite-plugin-pwa`. Per Lovable PWA guidance that's the safe path: it makes the site installable + splash-capable without the iframe/cache problems service workers cause in the preview. The Lovable preview iframe itself won't show splash screens (those only fire from the iOS home-screen launcher), but published `alamocitydesigns.com` will work correctly when added to home screen.

### Files Changed

| File | Change |
|---|---|
| `public/site.webmanifest` | `display: browser` → `display: standalone` |
| `public/splash/*.png` (×16, new) | iPhone + iPad splash screens, portrait + landscape |
| `index.html` | Add 16 `apple-touch-startup-image` `<link>` tags with media queries |

### Out of Scope
- Service worker / offline support
- Splash screens for older iPhones (8/SE 1st gen) — covered by SE 2nd/3rd gen fallback
- Dark-mode splash variants

