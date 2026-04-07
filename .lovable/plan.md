

## Fix Signature Placement + Agent-Only Fields for End Date and Commission

### Summary

Three changes: (1) fix the client signature position on the PDF so it sits on the correct signature line, (2) remove the broker printed name from the PDF (leave blank for DocuSign later), and (3) make the end date and commission percentage fields editable only by the admin/agent — the buyer sees them as read-only display values.

### Changes

**1. PDF Signature Block Fix (`generate-agreement-pdf/index.ts`)**

- Remove line 133 that draws `broker.name` ("Fathom Realty") on the Broker's Printed Name line — leave it blank for the broker to fill via DocuSign
- Move the client signature image position: currently at `x: 360, y: y(260)` which overlaps the printed name. Shift to `x: 324, y: y(250)` so the signature sits above the "Client's Signature" label line, not on top of the printed name
- Adjust signature scaling: use `width: Math.min(sigDims.width, 180)` for a wider, more natural signature

**2. Agent-Only Fields: End Date + Commission (`BuyerRepAgreement.tsx`)**

- Use the existing `useAdminCheck` hook to detect if the current user is an admin (agent)
- For the **End Date** picker (line 298-311): if not admin, render as a read-only display showing the value (or "Not yet set by agent") instead of a date picker
- For the **Broker's Fee** input (line 333-334): if not admin, render as a read-only display instead of an editable input
- The agent will need to pre-configure these values before the buyer signs. Store them in a new approach: the agent sets these values on the `signed_agreements` table or a config, and the buyer's form loads them.

**Approach for agent-configurable values:** Since we need the agent to set end date and commission *before* the buyer sees the form, the simplest approach is:
- Create a new database table `agreement_settings` with columns: `id`, `user_id` (the client's user ID), `term_end`, `broker_fee_pct`, `created_by` (admin user ID), `created_at`
- The admin dashboard gets a small UI to set these per-client
- When the buyer loads the agreement page, it fetches their settings and pre-fills end date and fee as read-only
- If no settings exist yet, those fields show "Pending — your agent will configure this" and the sign button is disabled

**However**, this adds significant complexity. A simpler alternative:

**Simpler approach:** Keep the fields on the same page but lock them based on role. The agent navigates to the same `/portal/agreement` URL while logged in as admin, fills in the end date and commission for the client (stored in a lightweight `agreement_config` table keyed by client user_id), then the client sees those values as read-only when they open the form.

### Technical Details

**Database migration:**
```sql
CREATE TABLE public.agreement_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL,
  term_end DATE,
  broker_fee_pct NUMERIC(5,2) DEFAULT 3.0,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_user_id)
);

ALTER TABLE public.agreement_config ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all configs
CREATE POLICY "Admins manage configs" ON public.agreement_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Clients can read their own config
CREATE POLICY "Clients read own config" ON public.agreement_config
  FOR SELECT TO authenticated
  USING (client_user_id = auth.uid());
```

**Frontend flow:**
- On page load, fetch `agreement_config` for the current user (client) or selected client (admin)
- Admin sees editable end date + fee fields, with a "Save Settings" button that upserts to `agreement_config`
- Client sees read-only display of those values; if not yet configured, sign button is disabled with message "Your agent needs to configure the agreement terms first"
- Admin also needs a way to select which client they're configuring — add a client selector dropdown when admin is viewing the agreement page

**PDF changes:**
- Remove broker printed name draw call (line 133)
- Reposition client signature to `x: 324, y: y(248)` with wider dimensions

### Files

| File | Action |
|------|--------|
| `supabase/functions/generate-agreement-pdf/index.ts` | Edit — remove broker name, fix signature position |
| `src/pages/BuyerRepAgreement.tsx` | Edit — add admin check, lock end date + fee for non-admins, add client selector for admins, fetch/save agreement_config |
| Database migration | Create `agreement_config` table with RLS |

