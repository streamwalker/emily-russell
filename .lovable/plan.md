

## Plan: Sticky CTA + Lead Capture + Share Results on /rent-vs-buy

Three additive enhancements to `public/rent-vs-buy.html`. No calculator logic touched.

### 1. Sticky "Talk to Emily" CTA

Floating pill button, bottom-right, appears after user scrolls past hero (~600px), hides when contact section is in view (IntersectionObserver). Gold background, navy text, phone icon + "Talk to Emily" label. Tap → scrolls to existing `#contact-emily` anchor. Mobile: shrinks to icon-only at <500px to avoid covering inputs.

```text
                                    ┌──────────────────┐
                                    │ ☎ Talk to Emily │  ← fixed bottom-right
                                    └──────────────────┘
```

Pure CSS + ~15 lines vanilla JS. No libs.

### 2. Lead-Capture Form (below calculator, above FAQ)

New section `<section id="get-analysis">` with a branded card containing 4 fields:
- **Name** (required)
- **Email** (required, validated)
- **Phone** (required, formatted)
- **Timeframe** (select: "0–3 months" / "3–6 months" / "6–12 months" / "Just exploring")
- Optional **Message** textarea
- Honeypot field for spam protection

Headline: *"Get a personalized rent-vs-buy analysis from Emily — free, no pressure."*

**Submission flow** — reuses the existing `sync-lead` Edge Function already wired to LeadGenius + Relocation Compass (per `mem://integrations/lead-management`). Calls it directly via `fetch` to `https://vkkguobxdilogwhqdtur.supabase.co/functions/v1/sync-lead` with the anon key. Source tagged as `rent_vs_buy_calculator` so Emily can segment these leads. Success → inline thank-you state. Error → friendly retry message.

Client-side validation: name 1–100 chars, email regex + max 255, phone digits-only ≥10, all trimmed.

### 3. "Share My Results" Button

Sits inside the existing results panel. On click, generates a **PNG snapshot** of a hidden styled summary card containing:
- Header: "My Rent vs. Buy Analysis — San Antonio 2026"
- User's key inputs (rent, offer price, down payment, rate)
- Computed outputs (monthly obligation, year-1 equity, total interest, break-even)
- Footer: "Calculated at alamocitydesigns.com/rent-vs-buy · Emily Russell, REALTOR®"

**Generation method**: `html2canvas` loaded from CDN (single `<script>` tag, ~45kb). On click → render hidden `.share-card` div → trigger PNG download as `rent-vs-buy-san-antonio.png`. Mobile: uses Web Share API if available (`navigator.share`) so users can share directly to iMessage/WhatsApp; falls back to download otherwise.

Bonus: a small "📧 Email these results to me" toggle that, if checked, auto-fills the lead form's message field with the snapshot summary as text.

### Files Changed

| File | Change |
|------|--------|
| `public/rent-vs-buy.html` | Add sticky CTA (CSS + JS + markup), lead-capture section + submit handler, share-results button + html2canvas CDN + hidden snapshot template |

No React, no new routes, no new Edge Functions — reuses existing `sync-lead`.

