# 02 — Design System

Direct port of `src/index.css`. All values in HSL → converted to sRGB for SwiftUI `Color`.

## Brand colors

| Token | HSL (web) | Hex | Swift |
|-------|-----------|-----|-------|
| `gold` | `27 35% 59%` | `#C49A6C` | `Color.brand.gold` |
| `goldDeep` | `27 32% 50%` | `#A88056` | `Color.brand.goldDeep` |
| `goldLight` | `27 40% 72%` | `#D7B391` | `Color.brand.goldLight` |
| `charcoal` | `0 0% 11%` | `#1C1C1C` | `Color.brand.charcoal` |
| `cream` | `37 33% 97%` | `#F8F4ED` | `Color.brand.cream` |
| `blush` | `355 42% 55%` | `#C5666F` | `Color.brand.blush` |
| `blushSoft` | `355 42% 81%` | `#E8BFC3` | `Color.brand.blushSoft` |
| `sage` | `100 13% 49%` | `#7A8E72` | `Color.brand.sage` |
| `slate` | `0 0% 33%` | `#545454` | `Color.brand.slate` |
| `warmBg` | `30 24% 92%` | `#EBE4DA` | `Color.brand.warmBg` |

## Semantic tokens

Map to dynamic colors (light/dark) using asset catalog entries that resolve to the brand tokens above:

- `background` → `cream` (light) / `charcoal` (dark)
- `foreground` → `charcoal` / `cream`
- `primary` → `gold` / `goldLight`
- `muted` → `warmBg` / `#2E2E2E`
- `border` → `#D8D2C9` / `#3A3A3A`

## Typography

- **Display / Headings**: Playfair Display (bundle `.ttf`, fallback `New York`).
  - `Font.display(size:weight:)`
- **Body**: DM Sans (bundle `.ttf`, fallback `SF Pro Text`).
  - `Font.body(size:weight:)`
- **Labels (uppercase, tracking 2-4 px)**:
  - `Font.label(size: 10.5, tracking: 4)` → use `.tracking()` modifier
- Mirror the CSS scale: `er-heading` = clamp(30, 4.5vw, 50). On iOS use `.dynamicTypeSize(.medium...accessibility3)` and a base of 32pt.

## Liquid Glass

iOS 26 introduces `.glassEffect()` and the `Glass` material. Centralize variants in `GlassStyles.swift`:

```swift
extension View {
    func glassCard() -> some View { self.glassEffect(.regular, in: .rect(cornerRadius: 0)) }
    func glassBar() -> some View  { self.glassEffect(.thin,    in: .capsule) }
    func glassChrome() -> some View { self.glassEffect(.regular.tint(Color.brand.charcoal.opacity(0.6))) }
}
```

- Hero sections: use `.containerBackground(.image(...), for: .navigation)` with `.glassEffect` overlay.
- Bottom tab bar: rely on default iOS 26 Liquid Glass tab bar (do not customize background).
- Sticky portal nav: `glassChrome()` with `safeAreaInset(edge: .top)`.

## Buttons

| Variant | Web class | SwiftUI |
|---------|-----------|---------|
| Primary | `.btn-er-primary` | `.buttonStyle(.glassProminent).tint(.brand.gold)` |
| Dark | `.btn-er-dark` | `.buttonStyle(.glassProminent).tint(.brand.charcoal)` |
| Outline | `.btn-outline-light` | `.buttonStyle(.glass).foregroundStyle(.brand.cream)` |
| Blush | `.btn-er-blush` | `.buttonStyle(.glassProminent).tint(.brand.blush)` |

All button labels: uppercase, tracking 2.5, 11.5pt, weight `.medium`.

## Radii & shadows

- `--radius: 0rem` on web — keep buttons & cards **square**. No `RoundedRectangle(cornerRadius:)` on primary CTAs.
- Card hover translate(-6px) → use `.hoverEffect(.lift)` on iPad / Mac Catalyst only.

## Motion

- Default transitions: `.smooth(duration: 0.4)`.
- Respect `@Environment(\.accessibilityReduceMotion)` — disable scale/translate animations when true.
