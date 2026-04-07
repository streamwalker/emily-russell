

## Admin "Preview as Client" View

### Approach

Add an "👁 Client View" button to each dossier card in the Admin Dashboard. Clicking it opens a full-screen dialog/modal that renders the exact same dossier UI the client sees — including tabs, property cards, rankings, grading, favorites, and admin replies — but in read-only preview mode. This reuses the existing `ClientPortal` rendering logic extracted into a shared component.

### Steps

**1. Extract client dossier view into a reusable component**

Create `src/components/portal/ClientDossierView.tsx` that contains the core dossier rendering logic currently in `ClientPortal.tsx` — the tab navigation, property cards, ranking tabs, comparison view, payment calculator, feedback display, and admin replies. It accepts props:
- `dossierData: DossierData`
- `dossierId: string`
- `clientUserId: string`
- `clientName?: string`
- `readOnly?: boolean` (when true, disables all interaction controls like grading, favoriting, commenting, tour requests)

**2. Use the shared component in ClientPortal**

Refactor `ClientPortal.tsx` to use `ClientDossierView` internally, passing `readOnly={false}` and the authenticated user's data.

**3. Add "Client View" button + modal in AdminDashboard**

- Add a `previewDossierId` state variable
- Add an "👁 Client View" button in the dossier card button row (next to Properties, Expenses, etc.)
- When clicked, open a full-screen `Dialog` that renders `<ClientDossierView>` with the selected dossier's data, the client's `user_id`, and `readOnly={true}`
- The preview fetches and displays the client's actual interactions (favorites, grades, comments, tour requests) and any admin replies — giving the admin a true picture of what the client sees
- A close button returns to the normal admin view

### Files

| File | Action |
|------|--------|
| `src/components/portal/ClientDossierView.tsx` | New — extracted client dossier rendering component |
| `src/pages/ClientPortal.tsx` | Refactor to use `ClientDossierView` |
| `src/pages/AdminDashboard.tsx` | Add preview button + full-screen dialog with `ClientDossierView` |

