

## Clickable Comments + Real-Time Comment Notifications

### 1. Clickable Comments Detail View

Make the "N comments" text in the dossier interaction summary bar clickable. Clicking it opens a dialog/modal that shows all comments left by that client, with:
- Property address and builder for each comment
- The comment text
- Timestamp (from `updated_at`)

**How**: In `AdminDashboard.tsx`, when the comments count is clicked, fetch `property_interactions` for that `user_id` where `comments IS NOT NULL`. Cross-reference `property_id` with the dossier's `dossier_data` to resolve property addresses. Display in a `Dialog` component.

### 2. Real-Time Comment Notifications

Subscribe to `property_interactions` changes via Supabase Realtime. When a new comment is inserted or updated (where `comments` field is non-null), show a toast notification to the admin with the client name and property address.

**How**:
- Enable realtime on `property_interactions` table (migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.property_interactions`)
- In `AdminDashboard.tsx`, set up a Realtime channel subscription on mount that listens for `UPDATE` and `INSERT` events where `comments` is present
- On event, resolve the user's name from `profiles` state and the property address from dossiers state, then fire a toast

### Files

| File | Action |
|------|--------|
| Database migration | Enable realtime on `property_interactions` |
| `src/pages/AdminDashboard.tsx` | Add clickable comments with detail dialog; add Realtime subscription for comment notifications with toast alerts |

