## Document Upload & PDF Builder for the Client Dossier

A new "Documents" panel inside the client dossier that lets the client drop in photos, Word docs, and PDFs, auto-straightens skewed photos like a phone scanner, and produces a single merged PDF that's saved to the dossier and visible to Emily in the admin portal.

### User flow

1. In `ClientDossierView`, a new **"Documents"** card sits near the top (collapsible, brand-styled). Inside: an "Upload & Build PDF" button + a list of previously saved PDFs for that dossier.
2. Client clicks **Upload & Build PDF** → modal opens.
3. Client drops/picks files (JPG, PNG, HEIC, PDF, DOC/DOCX, multi-select OK).
4. Each file becomes a "page tile" in a reorderable grid:
   - **Photos** → auto-detected document edges + perspective corrected + cropped + B&W/color toggle. Per-page controls: rotate 90°, manual angle slider, re-crop, revert to original.
   - **PDFs** → exploded into page thumbnails (reuse existing `pdfjs-dist`).
   - **Word docs** → converted to PDF pages server-side (LibreOffice in an edge function), then thumbnailed.
5. Client drags tiles to reorder, deletes unwanted pages, types a filename.
6. Click **Save PDF** → all pages assembled into one PDF in the browser → uploaded to storage → row inserted in `dossier_documents`.
7. Saved PDFs appear in the Documents card with download / preview / delete (client) and are also visible to Emily on the admin dossier editor.

### Technical breakdown

**Client-side libraries (added):**
- `pdf-lib` — assemble final PDF from images + existing PDF pages
- `opencv.js` (loaded lazy from CDN, ~8 MB, cached) — edge detection + perspective transform for auto-deskew/auto-crop
- `heic2any` — convert iPhone HEIC photos to JPEG in-browser
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag-to-reorder page tiles
- Reuse existing: `pdfjs-dist` (PDF page rasterization), `mammoth` (already in `documentParser.ts`)

**Why OpenCV.js for deskew:** it's the standard for document-scanner pipelines (Canny edge → contour → 4-point perspective warp). Loaded once, cached by the browser; no edge function round-trip; works offline.

**Word → PDF conversion (server-side):**
- New edge function `convert-docx-to-pdf` running LibreOffice headless (`soffice --headless --convert-to pdf`).
- Lovable's edge runtime supports this via the standard Deno `Deno.Command` API + LibreOffice in the runtime image. If LibreOffice isn't available in the function runtime, fallback is rendering the `.docx` with `mammoth` → HTML → `pdf-lib` page (lower fidelity but reliable). I'll start with the `mammoth → pdf-lib` path for reliability and document the LibreOffice option as a future upgrade.

**Storage:**
- New private bucket `dossier-documents` (one folder per dossier id, files keyed by `{dossier_id}/{document_id}.pdf`).
- RLS: client can read/write only their own dossier's folder; admins (Emily, Phil) full access.

**New table `dossier_documents`:**

| column | type | purpose |
|---|---|---|
| id | uuid PK | |
| dossier_id | uuid | FK to `client_dossiers.id` |
| user_id | uuid | dossier owner — for RLS |
| filename | text | client-chosen name (e.g. "Pre-approval Letter.pdf") |
| storage_path | text | path in `dossier-documents` bucket |
| size_bytes | int | for display |
| page_count | int | for display |
| uploaded_by | uuid | client OR admin user id |
| created_at | timestamptz | |

RLS:
- Client: select/insert/delete rows where `user_id = auth.uid()`
- Admin: full CRUD via `has_role(auth.uid(), 'admin')`

**Admin visibility:**
- In `AdminDashboard.tsx`'s dossier editor, add a read-only "Client Documents" section listing each PDF with download link. Admin can also delete or upload on the client's behalf.

### Files to add / change

**New:**
- `src/components/portal/DocumentBuilder.tsx` — the upload + tile grid + reorder + save modal
- `src/components/portal/DocumentScanner.ts` — OpenCV.js loader + deskew/crop pipeline (pure logic, no JSX)
- `src/components/portal/DossierDocumentsCard.tsx` — the card shown in the dossier with the saved-PDFs list
- `src/lib/pdfBuilder.ts` — `pdf-lib` helpers (image → PDF page, merge PDFs, render docx)

**Modified:**
- `src/components/portal/ClientDossierView.tsx` — render `<DossierDocumentsCard />` near the top
- `src/pages/AdminDashboard.tsx` — show client documents list in the dossier editor
- `package.json` — add `pdf-lib`, `heic2any`, `@dnd-kit/core`, `@dnd-kit/sortable`

**Database migration:**
- Create `dossier-documents` storage bucket (private) + RLS policies on `storage.objects`
- Create `dossier_documents` table + RLS policies

### Out of scope (this round)

- OCR / making the PDF text-searchable (can add `tesseract.js` later as a "Make searchable" toggle)
- E-signatures on uploaded documents (separate feature; signed agreements already have their own flow)
- Email-the-PDF-to-Emily button (she can already access via admin dossier; can add later)
- LibreOffice-based high-fidelity .docx conversion (start with `mammoth` fallback; revisit if fidelity is insufficient)
- Versioning of uploaded documents (replace = delete + reupload for now)

### Memory updates

- New entry `mem://features/dossier-documents` documenting the upload/scan/PDF flow, the storage bucket name, and the table.
- Update `mem://features/client-portal` index entry to mention document upload.
