

## Email Notifications for Admin Comment Replies

### Overview

When an admin replies to a client's comment from the dashboard, the system will send an email notification to the client so they're alerted even when not on the portal.

### Prerequisites

The project has a verified email domain (`notify.juliehamorifoundation.org`) but no transactional email infrastructure set up yet. This needs to be scaffolded first.

### Steps

**1. Set up email infrastructure**

- Run `setup_email_infra` to create the queue tables, cron job, and shared Edge Functions
- Run `scaffold_transactional_email` to create the `send-transactional-email` Edge Function and template scaffolding

**2. Create email template**

- Create `supabase/functions/_shared/transactional-email-templates/comment-reply-notification.tsx`
- Template content: "Emily replied to your comment on [property address]" with the reply text and a button linking to the client portal
- Style to match the project's brand (read `src/index.css` and tailwind config for colors)
- Register in `registry.ts`

**3. Create unsubscribe page**

- Add the unsubscribe route/page as required by the transactional email scaffold output

**4. Trigger email on reply submission**

- In `src/pages/AdminDashboard.tsx`, after the `comment_replies` insert succeeds in `submitReply`:
  - Look up the client's email from the `profiles` table using the interaction's `user_id`
  - Resolve the property address from dossier data (already available via `resolvePropertyFromDossiers`)
  - Call `supabase.functions.invoke('send-transactional-email', { body: { templateName: 'comment-reply-notification', recipientEmail, idempotencyKey: \`reply-\${replyId}\`, templateData: { propertyAddress, replyText } } })`

**5. Deploy edge functions**

- Deploy `send-transactional-email`, `handle-email-unsubscribe`, `handle-email-suppression`, and `process-email-queue`

### Files

| File | Action |
|------|--------|
| Email infrastructure | Setup via tools (queue, tables, cron) |
| `_shared/transactional-email-templates/comment-reply-notification.tsx` | New template |
| `_shared/transactional-email-templates/registry.ts` | Register template |
| Unsubscribe page (path TBD by scaffold) | New page + route |
| `src/pages/AdminDashboard.tsx` | Add email send after reply insert |

