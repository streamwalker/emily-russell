# Screen — Buyer Rep Agreement (TXR-1501)

**Web source**: `src/pages/BuyerRepAgreement.tsx`, `supabase/functions/generate-agreement-pdf/index.ts`. **Memory ref**: `mem://features/digital-agreement-signing`.

## Purpose
Capture a TREC-compliant TXR-1501 Buyer Representation Agreement signature so client can access dossier.

## Steps

1. **Pre-fill form**
   - Pull `profiles` and `agreement_config` (broker_fee_pct, term_end).
   - Fields: client name, email, phone, address (street, city/state/zip), market area, term start, term end, broker fee %.
2. **Sign**
   - Two modes: `draw` (`PencilKit` `PKCanvasView`) and `type` (Playfair italic).
   - Initials are auto-stamped on each numbered page using `signatureDataUrl`.
3. **Generate PDF**
   - Call `generate-agreement-pdf` (60s timeout, show progress sheet).
   - Server fills `TRX_1501_blank.pdf`, returns base64 PDF + `signedAgreementId`.
4. **Confirm**
   - Render PDF inline via `PDFKit.PDFView`.
   - "Looks good — submit" → POST nothing more (PDF already stored server-side).
   - Optional: `ShareLink` to email a copy.

## UX requirements

- Form is **scroll-locked** until prior section is valid (use `disabled` on Next button).
- Signature canvas: full-width, fixed 200pt height, gold underline.
- Compliance text from `EmilyRussell/Resources/LegalCopy/iabs.md` shown above signature pad — must be checked ("I have read and received the IABS form") before signing.

## Validation

- Term end ≥ term start.
- Broker fee 0–10 (decimal).
- Phone normalized to E.164 before submit.

## Failure modes

- Edge function 5xx → retry with exponential backoff (3 tries), then surface error and offer to save draft locally.
- PDF generation timeout: show "This is taking longer than usual — keep this screen open." after 20s.
