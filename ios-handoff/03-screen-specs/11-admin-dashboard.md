# Screen — Admin Dashboard

**Web source**: `src/pages/AdminDashboard.tsx`. **Memory refs**: `mem://features/admin-portal`, `mem://features/smart-add-logic`, `mem://features/osint-analyst-disabled`, `mem://auth/access-control`.

## Purpose
Internal control center for Emily and Phil. Manage clients, dossiers, templates, leads, and CMAs.

## Tabs

1. **Clients** — list of users (`profiles`), invite, edit credentials, view their dossier.
2. **Dossiers** — all `client_dossiers`, drag-to-reorder properties, assign templates.
3. **Templates** (`dossier_templates`) — reusable property packs.
4. **Smart Add** — paste text / URL / drop file → calls `parse-properties` → confirm dialog → append to dossier.
5. **OSINT Analyst** — **disabled**. Render a "Coming soon" card with a `.disabled(true)` button. Do not wire up `enrich-properties`.
6. **Leads** → see `12-admin-leads.md`.
7. **CMA** → see `13-admin-cma.md`.
8. **Analytics** — calls `get-site-analytics`, renders trend chart (Swift Charts).
9. **Settings** — `agreement_config` (broker fee %, default term length).

## Client creation

Inline dialog. Fields: full name, email, send invite toggle. Calls `create-client` edge function. Returns `temporaryPassword` → display in `Secret`-style copy field.

## Smart Add

- 3 input modes: paste, URL, file (`.fileImporter`).
- Show extraction progress via determinate `ProgressView` (function streams progress where supported).
- Result: confirmation list with checkboxes per detected property; user picks which to insert.
- Address validation: ensure city is San Antonio metro before insert.

## Drag-and-drop

Reorder properties within a dossier using `.onMove(perform:)`. Persist new order to `client_dossiers.dossier_data.properties[]` via single PATCH.

## Access control

- Admin tab hidden unless `SessionStore.isAdmin == true`.
- Every admin action re-validated by RLS server-side. Never trust client check alone.
