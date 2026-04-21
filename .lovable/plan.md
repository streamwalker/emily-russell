

## Plan: Authentic Builder Photos for Ladera & Redbird Ranch Cards

Replace the generic Unsplash stock photos in the "New Home Communities" section of `src/pages/Index.tsx` with real exterior shots pulled from the official builder pages for these two communities.

### Sources confirmed

| Community | Builder | Page | Image |
|---|---|---|---|
| **Redbird Ranch** | D.R. Horton | `drhorton.com/.../redbird-ranch` | Front exterior of model home (`exterior1_web.jpg`) |
| **Ladera** | Coventry Homes | `coventryhomes.com/.../ladera-communities` | Hero gallery shot of the Bryan model at 15011 Early Dawn |

Both are first-image exterior hero shots, matching the visual style of the third card (Stillwater Ranch) — front-facing single home, daylight, landscaped.

### What changes

In `src/pages/Index.tsx`, the `NEW_HOME_DEALS` array (lines 49–74), update only the `img` field for the first two entries:

```ts
// Redbird Ranch (line 55)
img: "https://www.drhorton.com/-/media/drhorton/productcatalog/425-san-antonio/42815-redbird-mccombs/428150000-redbird-mccombs-45s/exterior1_web.jpg?as=1&w=1280&rev=712591dfc657452e89febecbff8c5f7d&hash=F519211BD427CBC84C6CE03578A5336F"

// Ladera (line 63)
img: "https://media.coventryhomes.com/434/2025/3/11/1_SAN_Ladera50_Bryan_15011_Early_Dawn.jpg?width=1600&height=1067&fit=bounds&ois=c126e08"
```

No other code changes — the existing `<img>` tag, aspect ratio, and card styling stay the same.

### Hotlinking risk + fallback

Builder CDNs sometimes block cross-origin hotlinking via `Referer` checks, and URLs occasionally change when sites redeploy. If either image fails to load in the live preview after the change, the safe fallback is to **download both images, commit them under `public/communities/redbird-ranch.jpg` and `public/communities/ladera.jpg`, and reference the local paths**. I'll do this automatically in the implementation step if the hotlinks don't render — no additional approval needed.

### Out of scope

- Stillwater Ranch (already looks fine, not requested)
- Adding a photo carousel or multiple images per card
- Any layout, copy, or styling changes
- Adding image-credit captions

### Files touched

- `src/pages/Index.tsx` — two single-line `img` URL swaps in `NEW_HOME_DEALS`
- *(if hotlinks fail)* `public/communities/redbird-ranch.jpg`, `public/communities/ladera.jpg`

