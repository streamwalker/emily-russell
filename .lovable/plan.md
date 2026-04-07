

## Add Source Links to Properties

### What changes

1. **Property interface** — Add `sourceUrl?: string` field to the `Property` interface in both `src/pages/ClientPortal.tsx` and `src/lib/dossierScoring.ts`.

2. **PropertyRow UI** — In the expanded detail section, add a "View Listing →" link button that opens `prop.sourceUrl` in a new tab. Place it below the Property Details grid, styled as a small accent-colored link. Only render when `sourceUrl` is present.

3. **Dossier data update** — Run a database update to add `sourceUrl` values to each property in gomezurita's dossier. URLs will be sourced from the original links (NHB, Lennar, Meritage, etc.) used when the properties were added.

4. **Admin ExpenseEditor** — Add a `sourceUrl` text input field so admins can set/edit source links per property going forward.

### Files

| File | Action |
|------|--------|
| `src/pages/ClientPortal.tsx` | Add `sourceUrl` to interface + render link in PropertyRow |
| `src/lib/dossierScoring.ts` | Add `sourceUrl` to Property interface |
| `src/components/admin/ExpenseEditor.tsx` | Add sourceUrl input field |
| Database | Update