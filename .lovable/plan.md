

## Plan: Authentic Listing Photos for 5 Recent Sales

Replace the generic Unsplash stock photos in the **Recent Sales** section (`RECENT_SALES` array, `src/pages/Index.tsx` lines 23–29) with real exterior shots from past Zillow listings, sourced via the Wayback Machine when needed.

### Properties to update

| # | Address | ZIP |
|---|---|---|
| 1 | 242 Wild Duck | 78253 |
| 2 | 17010 Eaton Terrace | 78247 |
| 3 | 7703 Chancery Gate | 78253 |
| 4 | 7627 Parish Pl | 78253 |
| 5 | 4210 Amos Pollard | 78253 |

### Sourcing approach

For each address, in this order until a usable front-exterior photo is found:

1. **Search Zillow directly** for the active/off-market listing page (`zillow.com/homedetails/...`) using a web search.
2. **If Zillow is blocked or delisted**, query the **Wayback Machine** CDX API (`web.archive.org/cdx/search/cdx?url=zillow.com/homedetails/<slug>*`) to find archived snapshots, then pull the hero image from the most recent successful capture.
3. **Fallback**: Realtor.com or Redfin archive snapshot for the same address.

I'll prioritize the **first/hero exterior** photo on each listing — same visual style as the rest of the cards.

### What changes

- **Download** all 5 photos locally to `public/sales/` to avoid hotlinking issues (Zillow and Wayback both block cross-origin `<img>` requests). Filenames:
  - `public/sales/242-wild-duck.jpg`
  - `public/sales/17010-eaton-terrace.jpg`
  - `public/sales/7703-chancery-gate.jpg`
  - `public/sales/7627-parish-pl.jpg`
  - `public/sales/4210-amos-pollard.jpg`
- **Update** `src/pages/Index.tsx` — swap the `img` field on each of the 5 entries in `RECENT_SALES` to the local `/sales/...` path. No layout, copy, or styling changes.

### Risk + fallback

If a property has no archived Zillow listing AND no Realtor/Redfin snapshot with a usable image, I'll fall back to a **Google Street View Static API thumbnail** (the project already has `GOOGLE_MAPS_STATIC_API_KEY` configured for the existing map-thumbnail edge function). I'll note in chat which addresses, if any, fell back to Street View so you can replace them later with a better photo.

### Out of scope

- Adding a photo carousel or multiple images per card
- Replacing the New Home Communities photos (already done)
- Any layout or copy changes to the Recent Sales section
- Adding "Photo: Zillow" credit captions

### Files touched

- `public/sales/*.jpg` (5 new image files)
- `src/pages/Index.tsx` — five single-line `img` URL swaps in `RECENT_SALES`

