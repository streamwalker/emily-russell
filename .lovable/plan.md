# Dossier "What's New" Notifications

Show clients what changed in their dossier since they last viewed it: a one-time toast on login, plus inline NEW / UPDATED badges on tabs and property rows. Admins automatically stamp items when they edit them; admin replies to client comments also count as updates.

## What the client sees

1. **Login toast** — On entering the dossier, a single toast appears if anything is new since their last visit:
   > "3 new properties added · 2 updated · 1 new reply from Emily" with a "View changes" action that scrolls to the first change.
2. **Tab badges** — A small dot + count on each builder tab that contains new or updated properties.
3. **Row badges** — Each property row shows a `NEW` (gold) or `UPDATED` (blush) chip next to the address, plus a tooltip showing what changed and when. Reply notifications show a small dot on the comments icon.
4. **Auto-clear** — Badges fade after the client has scrolled to / expanded the row, and the "last viewed" timestamp advances when they leave the page.

## How change tracking works

- **Property-level stamps**: each `Property` in `dossier_data.properties` gets two optional fields the admin editor writes automatically:
  - `createdAt` — set the first time a property is added
  - `updatedAt` — bumped whenever any field on that property changes (admin save)
- **Dossier-level stamp**: `dossier_data.lastUpdatedAt` — bumped on any admin save, used as a quick "anything new?" gate.
- **Comment replies**: `comment_replies.created_at` already exists; treat any reply newer than `last_viewed_at` as new.
- **Last-viewed**: stored per-user in a new tiny table `dossier_views(user_id, dossier_id, last_viewed_at)` (upserted when the client opens the dossier). RLS: user can read/upsert own row; admins read all.

Anything older than the client's `last_viewed_at` is considered "seen" and shows no badge.

## Scope notes

- Client's own edits (favorites, grades, their own comments) do **not** trigger notifications — only admin-originated changes and admin replies.
- Removed properties are not surfaced (out of scope; can be added later as a "removed" section).
- No email — in-app only.

## Technical details

**Schema (one migration):**
```sql
create table public.dossier_views (
  user_id uuid not null,
  dossier_id uuid not null,
  last_viewed_at timestamptz not null default now(),
  primary key (user_id, dossier_id)
);
alter table public.dossier_views enable row level security;
-- policies: user manages own row; admins select all (via has_role)
```

**Types (`ClientDossierView.tsx`):**
- Extend `Property` with `createdAt?: string; updatedAt?: string;`
- Extend `DossierData` with `lastUpdatedAt?: string;`

**Admin write path (`PropertyEditor.tsx` / `AdminDashboard.tsx` save handler):**
- On add → set `createdAt = updatedAt = now()`.
- On edit → diff against previous snapshot; if any tracked field changed, bump `updatedAt`.
- Always bump `dossier_data.lastUpdatedAt` on save.

**Client read path (`ClientDossierView.tsx` / `ClientPortal.tsx`):**
1. On mount, fetch `dossier_views` row → `lastViewedAt` (null = first visit, treat everything as "seen" to avoid spam).
2. Compute `changes = { new: Property[], updated: Property[], replies: CommentReply[] }` against `lastViewedAt`.
3. Render toast once via `useToast` with summary + scroll-to-first-change action.
4. Pass `changes` down to tab list and `renderPropertyRow` to render badges + tooltips.
5. On unmount (or after 5s on page), upsert `dossier_views.last_viewed_at = now()`.

**Badge components:** small additions inside `ClientDossierView.tsx` (no new files needed) using existing Tailwind tokens (`bg-gold/15 text-gold`, `bg-blush/15 text-blush`).

## Files touched

- `supabase/migrations/*` — new `dossier_views` table + RLS
- `src/components/portal/ClientDossierView.tsx` — types, change detection, toast, badges
- `src/components/admin/PropertyEditor.tsx` — stamp `createdAt` / `updatedAt`
- `src/pages/AdminDashboard.tsx` — bump `lastUpdatedAt` on save, diff old vs new properties
- `src/pages/ClientPortal.tsx` — upsert `last_viewed_at` on leave
