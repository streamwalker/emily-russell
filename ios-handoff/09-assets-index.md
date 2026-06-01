# 09 — Assets Index

All migratable assets from the web `public/` folder. Copy into `EmilyRussell/Resources/`.

## Brand

| Web path | iOS destination | Use |
|----------|-----------------|-----|
| `public/emily-russell.png` | `Assets.xcassets/Logo` | Headshot / logo |
| `public/favicon.png` | `Assets.xcassets/AppIcon` (source) | App icon (re-render at all sizes via App Icon generator) |
| `public/apple-touch-icon.png` | `Assets.xcassets/AppIcon` | Source |
| `public/icon-192.png`, `icon-512.png` | discard | iOS uses AppIcon catalog |

## OG / share images (used for share sheet previews)

- `public/og-emily-russell.jpg`
- `public/og-fair-housing.jpg`
- `public/og-privacy.jpg`
- `public/og-rent-vs-buy.jpg`
- `public/og-terms.jpg`
- `public/og-trec.jpg`

Bundle into `Resources/Share/` and attach via `ShareLink(item:preview:)`.

## Splash

- `public/splash/` → recreate using SwiftUI launch screen (`LaunchScreen.storyboard` or `UILaunchScreen` Info.plist key with brand background `#1C1C1C` and centered logo).

## Communities / sales imagery

- `public/communities/` and `public/sales/` → these are marketing hero/section images. Inventory size and bundle the smaller (<200KB) versions; keep larger ones in Supabase Storage and load on demand.

## Fonts

- Playfair Display + DM Sans `.ttf` files — download from Google Fonts, place in `Resources/Fonts/`, register in `Info.plist` under `UIAppFonts`.

## PDF templates

- `public/TRX_1501_blank.pdf` → also available in Supabase Storage bucket `agreement-templates`. Prefer downloading from Storage at runtime so updates propagate without an app release.
