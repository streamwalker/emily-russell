

## Plan: Fix Tooltip Clipping with Viewport-Level Portal

### Problem
Tooltips in `public/rent-vs-buy.html` get clipped because `.tip-card` uses `position: absolute` and is trapped inside ancestors with `overflow: hidden` / stacking contexts (calculator cards, columns). Screenshot confirms: tooltip cut off mid-word at the panel's right edge.

Note: filename is `public/rent-vs-buy.html` (not `buy-vs-rent.html`).

### Fix (single file: `public/rent-vs-buy.html`)

**1. CSS changes for `.tip-card`**
- `position: fixed` (escapes every overflow ancestor)
- `z-index: 9999`
- `width: min(320px, calc(100vw - 32px))`
- Remove the old absolute `top/left/transform` rules and the static arrow positioning
- Add two arrow variants: `.tip-card.arrow-down::after` (card above icon, arrow points down) and `.tip-card.arrow-up::after` (card below icon, arrow points up)

**2. JS rewrite — portal + viewport positioning**
- On open (hover desktop / tap mobile):
  1. Move the `.tip-card` to `document.body` (portal) so no parent stacking context traps it
  2. Read icon's `getBoundingClientRect()`
  3. Decide vertical: if `window.innerHeight - rect.bottom >= 260` → place below (arrow-up); else place above (arrow-down)
  4. Compute `left = rect.left + rect.width/2 - cardWidth/2`, then clamp to `[8, window.innerWidth - cardWidth - 8]`
  5. Set `card.style.top` / `card.style.left` (fixed coords)
  6. Position the arrow horizontally to point at icon center (offset within the card)
- On close: move the card back to its original parent `.tip` span
- Reposition on `scroll`/`resize` (throttled via `requestAnimationFrame`) while open
- Auto-close if user scrolls more than ~80px from open position (prevents drift on long scrolls)
- Outside-tap closes (existing behavior preserved)
- Escape key closes

**3. Preserve existing behavior**
- Hover-to-open on desktop, tap-to-toggle on mobile — unchanged
- All 31 field tooltips + 3 result-block tooltips + micro-CTA links — unchanged
- Calculator math, charts, lead form, sticky CTA, share/PDF — untouched

### Result
Tooltips render as floating viewport-level cards, never clipped by calculator panels or the iframe's inner DOM. Auto-flips above/below, clamped horizontally to stay on-screen, arrow always points at the triggering ⓘ icon.

### Files Changed

| File | Change |
|------|--------|
| `public/rent-vs-buy.html` | Rewrite `.tip-card` CSS to `position: fixed` + viewport-clamped width; replace tooltip JS with portal-to-body + `getBoundingClientRect`-based positioning, auto-flip, scroll/resize reposition, scroll-away auto-close |

