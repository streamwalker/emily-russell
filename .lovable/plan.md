

## Client Portal with Authentication & Personalized Dossiers

### Overview
Create a password-protected client portal where clients log in with email/password and see a personalized property dossier prepared for them. The first client is **gomezurita@gmail.com** with the uploaded dossier data.

### Architecture

Dossier data will be stored in the database so you can add new clients and update dossiers without code changes.

```text
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  /portal     │────▸│  Auth Gate   │────▸│  Client Dossier  │
│  (login)     │     │  (Supabase)  │     │  (per-client)    │
└─────────────┘     └──────────────┘     └──────────────────┘
```

### Database Setup

**1. `profiles` table** — auto-created on signup via trigger
- `id` (uuid, FK to auth.users)
- `email` (text)
- `full_name` (text, nullable)
- `created_at` (timestamptz)
- RLS: users can only read/update their own row

**2. `client_dossiers` table** — stores the dossier JSON per client
- `id` (uuid, PK)
- `user_id` (uuid, FK to profiles.id)
- `title` (text) — e.g. "Client Property Dossier"
- `dossier_data` (jsonb) — the full tabs + properties data from the JSX file
- `prepared_date` (date)
- `created_at` / `updated_at` (timestamptz)
- RLS: users can only SELECT their own dossiers

**3. Seed data** — insert the first dossier for gomezurita@gmail.com after they sign up (or via a migration that references their user ID once created)

### Frontend Changes

**4. Auth pages** — `src/pages/ClientLogin.tsx`
- Email + password login form (branded to match the site)
- No public signup — clients are created by Emily (admin) only
- "Forgot password" link for password reset

**5. Client Dashboard** — `src/pages/ClientPortal.tsx`
- Protected route; redirects to login if unauthenticated
- Fetches dossier(s) for the logged-in user from `client_dossiers`
- Renders the dossier UI (adapted from the uploaded JSX — converted to TypeScript, using Tailwind instead of inline styles)
- Tabs for builders, expandable property cards, rental estimates, agent notes, disclaimer

**6. Routes** — update `App.tsx`
- `/portal` → ClientLogin (if not authenticated) or ClientPortal (if authenticated)
- `/portal/reset-password` → password reset page

**7. Navigation** — add a "Client Portal" link in the site header/nav

### Client Onboarding Flow
Since there's no public signup, you'll manually create client accounts:
1. Go to backend Users section to create a user with their email
2. Insert a row in `client_dossiers` with their dossier JSON data
3. Share login credentials with the client

### Files

| File | Action |
|------|--------|
| Migration | Create `profiles`, `client_dossiers` tables + trigger + RLS |
| `src/pages/ClientLogin.tsx` | Create — login form |
| `src/pages/ClientPortal.tsx` | Create — dossier viewer (adapted from uploaded JSX) |
| `src/pages/ResetPassword.tsx` | Create — password reset page |
| `src/components/ProtectedRoute.tsx` | Create — auth guard component |
| `src/App.tsx` | Edit — add portal routes |
| `src/pages/Index.tsx` | Edit — add "Client Portal" nav link |

