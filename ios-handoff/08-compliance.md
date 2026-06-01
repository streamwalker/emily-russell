# 08 — Compliance (TREC, IABS, Fair Housing)

This is a Texas real-estate app. The following copy is **legally required** and must appear verbatim.

## Required disclosures

1. **TREC Consumer Protection Notice** — every screen footer.
2. **IABS Form 1-2** (Information About Brokerage Services) — accessible from any portal screen, and the marketing footer.
3. **Equal Housing Opportunity** logo + statement — footer everywhere.
4. **Broker identification** — "Emily Russell · Texas Realtor · TREC License #791742 · Fathom Realty, LLC" — every screen footer.

## Implementation

- Bundle these as Markdown files in `EmilyRussell/Resources/LegalCopy/`:
  - `iabs.md`
  - `consumer-protection-notice.md`
  - `fair-housing.md`
  - `terms-of-service.md`
  - `privacy-policy.md`
  - `trec-disclosures.md`
- Source content from the matching pages in the web project:
  - `src/pages/TRECDisclosures.tsx`
  - `src/pages/FairHousing.tsx`
  - `src/pages/PrivacyPolicy.tsx`
  - `src/pages/TermsOfService.tsx`
- Render with a single `LegalDocumentView(markdown:)` that uses SwiftUI `Markdown` rendering.

## Hard rules

- **Never paraphrase** any of these documents.
- Brand name is **"Emily Russell Realtor"** — never "Realty" (TREC enforces this distinction).
- TREC license number `#791742` must always be visible in the footer.
- The IABS form must be **one tap away** from any portal screen — surface it in `AccountView` and in the persistent footer.

## Cookie / consent equivalent

The web app uses a cookie banner. On iOS:
- Apple App Tracking Transparency prompt (ATT) at first launch **if** analytics SDK tracks across apps.
- Currently the app only logs first-party `analytics_events` to Supabase — ATT is not strictly required, but include a short "Privacy" sheet on first launch summarizing what's collected.

## Unsubscribe

Email unsubscribe lives at `https://alamocitydesigns.com/unsubscribe?token=...`. On iOS, open in `SFSafariViewController` — do not build a native unsubscribe screen.
