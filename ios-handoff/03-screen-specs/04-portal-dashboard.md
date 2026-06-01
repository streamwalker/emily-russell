# Screen — Portal Dashboard

**Web source**: `src/pages/PortalDashboard.tsx`. **Memory ref**: `mem://features/portal-dashboard`.

## Purpose
Landing screen after sign-in. Onboards new clients and routes returning ones.

## Logic

```text
On appear:
  if not signed in           → push to Login (handled by router)
  else if no signed agreement → push BuyerRepAgreementView (blocking)
  else if has dossier        → show dashboard cards + "Open dossier" CTA
  else                       → show "Your dossier is being prepared" placeholder
```

## Sections

1. Greeting: "Welcome back, {firstName}"
2. **Dossier card** — last updated date, # properties, # new/updated badges (driven by `dossier_views` table, see `mem://features/dossier-change-notifications`).
3. **Quick actions** — Open Dossier · Comparison · Payment Calculator · Documents
4. **Navigation guide** — collapsible rainbow-coded tab legend (matches `mem://ux/guided-portal-navigation`).
5. **Footer** — IABS link, broker info.

## New/Updated badges

On dossier card, query latest `dossier_views.last_viewed_at` vs `client_dossiers.updated_at` and per-property `lastUpdatedAt`. Show count badges with semantic colors:
- NEW → `.brand.gold`
- UPDATED → `.brand.blush`

Toast on first foreground when changes detected: "{n} properties updated since your last visit."

## Buyer Rep gate

If `signed_agreements` has no row for `user_id`, present `BuyerRepAgreementView` as a non-dismissable sheet.

## Realtime

Subscribe to `client_dossiers` UPDATE events for the current user → refresh badge counts.
