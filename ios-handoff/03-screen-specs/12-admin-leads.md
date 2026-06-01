# Screen — Admin Leads

**Web source**: `src/pages/AdminLeads.tsx`. **Memory refs**: `mem://integrations/lead-management`, `mem://constraints/lead-sync-rls`.

## Purpose
Triage incoming leads from the marketing site contact form.

## List

- `List` of `Lead` rows, newest first.
- Search by name/email/phone.
- Filter by `source` (rent_vs_buy, contact_form, etc.).
- Swipe actions: `Mark contacted`, `Delete` (admin RLS allows).

## Detail

- Full lead info, message body, referrer, user agent.
- `Link(destination: URL(string: "tel:\(phone)")`
- `Link(destination: URL(string: "mailto:\(email)")`
- "Send IABS form" button → opens `MFMailComposeViewController` with IABS PDF attached.

## Sync status

Each lead row shows whether it synced to LeadGenius / Relocation Compass (read `metadata.syncStatus`).
Manual "Retry sync" calls `sync-lead` with `{ retryId: lead.id }`.

## Lead capture parity

Marketing tab `ContactFormSection` posts to the same `sync-lead` function — admin leads inbox is the canonical destination.
