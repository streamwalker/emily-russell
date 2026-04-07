

## Generate Signed PDF on the Actual TRX-1501 Form

### Summary

Keep the existing smooth input form as-is for data entry. After the user signs, generate a PDF that overlays their filled-in data (names, addresses, dates, signatures, etc.) onto the actual 6-page TRX-1501 PDF form — just like DocuSign does.

### Approach

Use an edge function with `pdf-lib` to load the uploaded TRX-1501 PDF as a base template and overlay text + signature images at the correct coordinates on each page. The frontend sends the form data to this edge function, which returns the completed PDF for download. The current `window.print()` flow is replaced with a real PDF download.

### Steps

**1. Store the blank TRX-1501 PDF in file storage**

Upload the blank TRX-1501 PDF to the `signed-agreements` storage bucket so the edge function can fetch it as the base template.

**2. Create edge function `generate-agreement-pdf`**

- Accepts JSON body with all form fields: client name, address, city/state/zip, phone, email, market area, term start/end, broker fee %, signature image (base64), second client info
- Loads the blank TRX-1501 PDF from storage using `pdf-lib`
- Overlays text at precise coordinates on each page:
  - **Page 1**: Client name, address, city/state/zip, phone, email on the Client lines; Broker info (Fathom Realty, Emily Russell, etc.) on the Broker lines; Market Area in Section 3C; Term dates in Section 4
  - **Page 2**: Broker fee percentage in Section 7A
  - **Page 6**: Broker printed name, license no., client printed name, signatures (embedded as PNG images), dates on the signature block
- Each page also gets initials in the footer area (pages 1-5)
- Returns the completed PDF as `application/pdf`

**3. Update `BuyerRepAgreement.tsx`**

- After successful save to database, call the edge function with form data
- Store the returned PDF blob for download
- Replace `window.print()` with a real file download (`URL.createObjectURL` + anchor click)
- Also upload the generated PDF to storage alongside the raw form data
- Update the "Print / Save PDF" button to trigger download of the generated PDF

**4. Upload blank PDF to storage**

Copy the uploaded TRX-1501 PDF to the project's public storage bucket as `templates/TXR-1501-blank.pdf`.

### Technical Details

**Field coordinate mapping** (approximate, to be fine-tuned during implementation):

```text
Page 1:
  Client name    → (130, 710)
  Address        → (130, 688)
  City/State/Zip → (130, 666)
  Phone          → (130, 644)
  Email          → (130, 622)
  Broker name    → (130, 580)
  Broker address → (130, 558)
  ...
  Market Area    → (130, 340)  (Section 3C)
  Term start     → (280, 270)  (Section 4)
  Term end       → (450, 270)

Page 2:
  Broker fee %   → (95, 705)   (Section 7A)

Page 6:
  Broker printed name    → left column
  Client printed name    → right column
  Signature images       → overlaid at signature lines
  Dates                  → next to signatures
```

Coordinates will be calibrated by inspecting the actual PDF page dimensions during implementation.

**Edge function dependencies**: `pdf-lib` (available via esm.sh)

### Files

| File | Action |
|------|--------|
| `supabase/functions/generate-agreement-pdf/index.ts` | Create — edge function that overlays form data onto blank TRX-1501 PDF |
| `src/pages/BuyerRepAgreement.tsx` | Edit — call edge function for PDF generation, replace print with download |
| Storage | Upload blank TRX-1501 PDF as template |

