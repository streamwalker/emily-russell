## Problem

The hero background image isn't visible. I changed the hero from a CSS `background-image` to an absolutely-positioned `<img>` with `-z-10`, plus an overlay also at `-z-10`. Because the `<section>` is just `relative` (no `z-index`/`isolation`), the negative z-index pushes both layers behind the page background, so the image and overlay disappear.

## Fix

In `src/pages/Index.tsx`, hero section:

1. Add `isolation-isolate` (or `z-0`) to the `<section>` so it creates its own stacking context.
2. Change the `<img>` from `-z-10` to `z-0`.
3. Change the gradient overlay `<div>` from `-z-10` to `z-10`.
4. Wrap the hero content container in `relative z-20` so text/buttons sit above image + overlay.

No other files change. `index.html` preload/preconnect stay as-is.

## Verify

Reload `/`, confirm the hero photo + dark gradient render behind the headline, and re-check no console/network errors on the Unsplash image.
