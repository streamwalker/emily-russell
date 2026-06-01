# Screen — Admin CMA

**Web sources**: `src/components/admin/cma/CmaWorkspace.tsx`, `src/components/admin/cma/CmaEditor.tsx`, `src/lib/cmaSchema.ts`, `src/lib/cmaPdf.ts`. **Memory ref**: `mem://features/cma-platform`.

## Purpose
Internal Comparative Market Analysis tool: subject + comps → Claude narrative → branded PDF stored in `cma-reports` bucket.

## Workspace (list)

- All `cma_reports` for current admin, newest first.
- Status chips: `draft`, `generated`, `failed`.
- Actions: Open · Download PDF (signed URL) · Delete.

## Editor

Three sections:

1. **Subject property**
   - Address (autofill via `cma-autofill` → fills beds/baths/sqft/year/condition/builder/lot size, populates `subject_sources` map).
   - Manual override any field.
2. **Comps**
   - Add comp rows (3-6 typical).
   - Each row: address, beds, baths, sqft, sale price, sale date, adjustments, source URL.
3. **Generate**
   - Calls `generate-cma-narrative` with subject + comps.
   - Returns narrative, executive summary, value low/recommended/high, $/sqft tiers.
   - Render preview (Markdown).
4. **PDF**
   - Port `cmaPdf.ts` to Swift using `PDFKit` + `TPPDF` (or build PDF context manually).
   - Save to Storage bucket `cma-reports/<reportId>.pdf` and set `cma_reports.pdf_path`.

## Schema versioning

Mirror `cmaSchema.ts`:
- Persist `schemaVersion` field on `cma_reports` JSON blobs.
- On load, migrate older versions in-memory.
- Preserve `subjectSources` and comp `sourceUrl` across migrations.

## RLS
Admin-only on both `cma_reports` and `homes`. No client access.
