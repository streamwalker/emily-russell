

## Show Admin Replies + Real-Time Notifications in Client Portal

### 1. Display Admin Replies Below Each Comment

**File: `src/pages/ClientPortal.tsx`**

- On initial load, fetch all `comment_replies` for the current user's `property_interactions` (RLS already allows this via the existing policy)
- Store replies in state as `Record<string, Reply[]>` keyed by `interaction_id`
- In the `PropertyCard` feedback section, below the comment textarea, render any admin replies for that property's interaction — each showing "Emily replied:" with the reply text and timestamp
- Style replies as indented, slightly different background to distinguish from the client's own notes

### 2. Real-Time Notifications for New Replies

**Database migration**: Enable realtime on `comment_replies` table

**File: `src/pages/ClientPortal.tsx`**

- Subscribe to Supabase Realtime `postgres_changes` on `comment_replies` filtered to `INSERT` events
- When a new reply arrives, check if the `interaction_id` matches one of the client's interactions
- Fire a toast notification: "Emily replied to your comment on [property address]"
- Update the replies state so it appears immediately without page refresh

### Files

| File | Action |
|------|--------|
| Database migration | `ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_replies;` |
| `src/pages/ClientPortal.tsx` | Fetch replies on load; render below comments; subscribe to realtime for toast notifications |

