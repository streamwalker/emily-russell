

## Add "Create New Client" Option to Dossier Client Selector

### Overview

Replace the plain `<select>` dropdown for client selection with a combo that includes an "+ Add New Client" option at the bottom. Selecting it reveals inline fields to enter the new client's email and name, creates a user account via the backend, inserts a profile row, then auto-selects the new client for the dossier.

### Steps

**1. Add inline "new client" UI in `AdminDashboard.tsx`**

- Add state: `addingNewClient`, `newClientEmail`, `newClientName`
- Add an `<option value="__new__">+ Add New Client</option>` at the bottom of the existing `<select>`
- When `__new__` is selected, show inline email + name inputs below the dropdown with a "Create Client" button
- On create: call the backend to create the user, insert a profile row, refresh profiles, and auto-set `newUserId` to the new user's ID

**2. Create an edge function `create-client` to handle user creation**

- Accepts `{ email, full_name }` in the request body
- Uses the Supabase Admin API (`supabase.auth.admin.createUser`) to create the auth user with a random password and `email_confirm: true`
- Inserts a row into `profiles` with the new `user_id`, `email`, and `full_name`
- Returns the new `user_id`
- Only callable by authenticated admins (check `has_role`)

**3. Wire up the AdminDashboard**

- Call the `create-client` edge function from the "Create Client" button handler
- On success: re-fetch profiles, set `newUserId` to the returned user ID, reset the inline form
- On error: show the error message inline

### Technical Details

- The edge function needs the `SUPABASE_SERVICE_ROLE_KEY` (already available as a default secret in edge functions)
- No new database tables needed — uses existing `profiles` table
- The created user gets a random password; the admin can trigger a password reset email separately if needed

### Files

| File | Action |
|------|--------|
| `supabase/functions/create-client/index.ts` | New — edge function to create auth user + profile |
| `src/pages/AdminDashboard.tsx` | Add "new client" option, inline form, and edge function call |

