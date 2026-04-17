

## Plan: OG Image for Rent vs. Buy + Sitemap Verification

### Context check
Let me verify current state of both items before planning.
<lov-tool-use id="toolu_vrtx_01W3qJm5deCfRetYmqjFTRJA" name="code--exec" integration-id="code" data="{\"command\": \"grep -n \\\"rent-vs-buy\\\\|og:image\\\\|twitter:image\\\" public/sitemap.xml public/rent-vs-buy.html | head -40\", \"user_facing_description\": \"Checking current OG tags and sitemap entries\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01GNtpjR8RUyPTgaVmu117jS" name="code--exec" integration-id="code" data="{\"command\": \"grep -n \\\"rent-vs-buy\\\" public/sitemap.xml; echo \\\"---\\\"; grep -n \\\"og:image\\\\|twitter:image\\\\|og:url\\\\|og:title\\\\|og:description\\\" public/rent-vs-buy.html | head -30\", \"user_facing_description\": \"Checking current OG tags and sitemap entries\"}">
</lov-tool-use>
Sitemap already has `/rent-vs-buy`. OG tags exist but no `og:image` / `twitter:image`. Need to add image meta tags + create the actual image asset.
<lov-tool-use id="toolu_vrtx_01379MoaspfArUQ8ZTW9EN4D" name="code--view" integration-id="code" data="{\"file_path\": \"public/rent-vs-buy.html\", \"lines\": \"1-50\"}">
</lov-tool-use>
I have enough info. The sitemap already has the entry — I'll note that. Just need to add OG image meta tags + generate the actual image.

<lov-plan>

## Plan: OpenGraph Image for /rent-vs-buy + Sitemap Check

### Status check
- ✅ **Sitemap already includes `/rent-vs-buy`** (line 24 of `public/sitemap.xml`, added in earlier step). No change needed there — confirmed during inspection.
- ❌ **No `og:image` or `twitter:image` tags** exist in `public/rent-vs-buy.html`. When shared on Facebook, LinkedIn, iMessage, Twitter, Slack, etc., the link currently shows no preview image (just title + description), which dramatically reduces click-through.

### What to build

**1. Generate a branded 1200×630 OG image** (`public/og-rent-vs-buy.png`)

Standard OG dimensions (1.91:1) ensure proper display on all platforms. Design will use brand palette from memory (gold #C9A961-ish, charcoal, cream, Playfair Display headline):

```text
┌──────────────────────────────────────────────────┐
│  ALAMO CITY DESIGNS                              │
│                                                  │
│  Rent vs. Buy in                                 │
│  San Antonio 2026                                │
│                                                  │
│  ✦ Live Calculator  ✦ Real Local Data           │
│  ✦ FHA · VA · USDA · DPA Options                │
│                                                  │
│  Emily Russell · REALTOR® · Fathom Realty       │
└──────────────────────────────────────────────────┘
```

Generation method: Python (Pillow) script writing to `/mnt/documents/og-rent-vs-buy.png` then copy to `public/`. Uses brand fonts if available locally, otherwise system serif fallback for the headline. QA by inspecting the rendered PNG before delivering.

**2. Add OG image meta tags to `public/rent-vs-buy.html`** (around line 23-31)

Add these tags inside the existing OG/Twitter blocks:
```html
<meta property="og:image" content="https://www.alamocitydesigns.com/og-rent-vs-buy.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Rent vs. Buy in San Antonio 2026 — Free Calculator by Realtor Emily Russell">
<meta property="twitter:image" content="https://www.alamocitydesigns.com/og-rent-vs-buy.png">
<meta property="twitter:image:alt" content="Rent vs. Buy in San Antonio 2026 — Free Calculator">
```

### Files Changed

| File | Action |
|------|--------|
| `public/og-rent-vs-buy.png` | Create (1200×630 branded preview image) |
| `public/rent-vs-buy.html` | Add 6 meta tags for og:image and twitter:image |
| `public/sitemap.xml` | No change — already contains `/rent-vs-buy` |

