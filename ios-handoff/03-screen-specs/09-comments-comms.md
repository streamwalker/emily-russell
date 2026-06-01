# Screen — Comments & Communication

**Web sources**: comment fields in `ClientDossierView.tsx`, `comment_replies` table, `supabase/functions/send-transactional-email/`. **Memory ref**: `mem://features/portal-communication`.

## Purpose
Threaded comments between client and Emily, scoped to a specific property.

## Data model

- `property_interactions.comments` — client's primary comment per property.
- `comment_replies` — Emily's replies to that comment (one-to-many).

## UI

- Property detail sheet → **Conversation** section at bottom.
- Composer: `TextEditor` with **Writing Tools enabled** (iOS 26 default).
- Submit posts/updates `property_interactions.comments`.
- Replies render as bubbles with admin avatar + timestamp.

## Realtime

`SupabaseClient.shared.realtime.channel("comments:\(propertyId)")`
- On INSERT of `comment_replies` where `interaction_id = mine` → append + toast "New reply from Emily".
- Use `.sensoryFeedback(.success, trigger: replyCount)`.

## Email notifications

Backend sends transactional emails via `send-transactional-email` when:
- Client posts a comment → Emily gets email.
- Emily replies → client gets email (via `comment-reply-notification.tsx` template).

iOS app does **not** trigger these directly — they fire on DB inserts via existing edge function pipeline.

## Accessibility

- Composer label: "Comment for {address}".
- Replies have semantic order via `.accessibilitySortPriority`.
