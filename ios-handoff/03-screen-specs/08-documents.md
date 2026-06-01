# Screen — Documents

**Web source**: `src/components/portal/DocumentBuilder.tsx`, `src/components/portal/DocumentScanner.ts`. **Memory ref**: `mem://features/dossier-documents`.

## Purpose
Client uploads supporting docs (inspections, disclosures, mortgage pre-approvals) into their dossier. Server merges them into a single dossier PDF.

## Upload flows

1. **Scan with camera** → `VNDocumentCameraViewController` (UIKit-wrapped). Auto-deskews. Yields `[UIImage]` → encoded to PDF.
2. **Pick PDF** → `.fileImporter(allowedContentTypes: [.pdf, .image])`.
3. **Photo Library** → `PhotosPicker`.

For each result:
- Render thumbnail
- Allow drag-to-reorder (`.draggable`/`.dropDestination`)
- Optional rename
- Upload to Storage bucket `dossier-documents/<userId>/<docId>.pdf`
- Insert `dossier_documents` row

## Merge

Server-side merging via existing flow (web uses `pdf-lib`; iOS app just uploads individual files — backend keeps merging dossier PDFs as before). If merging is client-side on web, mirror with `PDFKit.PDFDocument` on iOS.

## Constraints

- Max 20MB per file (client-side check)
- Max 50 docs per dossier
- Only PDF, JPG, PNG, HEIC accepted

## RLS

Clients upload to their own `user_id` folder only. Admins can read all. Enforced by RLS on `dossier_documents`.
