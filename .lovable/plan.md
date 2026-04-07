

## Client Portal Dashboard + Digital Buyer Rep Agreement

### Feature 1: Client Portal Dashboard

Replace the current bare "No Dossier Available" screen with a rich dashboard that all logged-in clients see. The dashboard will also serve as the landing page when a dossier IS available (accessible via a "Dashboard" link).

**New file: `src/pages/PortalDashboard.tsx`**

Content sections:
- **Welcome header** — "Welcome, [name]" with Emily Russell branding
- **Why Use a REALTOR for New Construction** — Value props explaining that builders' sales agents represent the builder, not the buyer; a REALTOR negotiates on the buyer's behalf, reviews contracts, ensures inspections, and can often get the same price or better with added protections
- **Why Emily Russell** — Her new construction expertise through NuBuild partnership, local San Antonio market knowledge, personalized property dossiers with cost analysis, dedicated client portal, and proven track record
- **How to Navigate Your Dashboard** — Brief guide explaining the tabbed property dossier, payment estimator, comparison tool, and how to read expenses
- **Access Notice** — Card explaining that only registered clients with an active Buyer Representation Agreement with Emily have portal access. Links to the digital agreement signing page
- **Quick Links** — Cards linking to: Property Dossier (if available), Sign Buyer Rep Agreement, Contact Emily

**Routing changes in `src/App.tsx`:**
- Add `/portal/dashboard` route pointing to `PortalDashboard`
- Modify `ClientPortal.tsx` to show a "Dashboard" button in the header that navigates to `/portal/dashboard`
- When user has no dossier, redirect from `/portal` to `/portal/dashboard` instead of showing the bare message

---

### Feature 2: Digital Buyer Rep Agreement (TXR-1501)

A DocuSign-like experience where clients fill out and sign a clean version of the Texas REALTORS Buyer/Tenant Representation Agreement.

**New file: `src/pages/BuyerRepAgreement.tsx`**

A multi-section form that mirrors the 5-page TXR-1501 structure:

- **Section 1 — Parties**: Pre-filled broker info (Emily Russell, Fathom Realty, address, phone, email, license #). Client fills in: full name, address, city/state/zip, phone, email
- **Section 2 — Appointment**: Display-only legal text
- **Section 3 — Definitions**: Client fills in the "Market area" field (e.g., "San Antonio Metro")
- **Section 4 — Term**: Client selects start date and end date via date pickers
- **Section 5 — Broker's Obligations**: Display-only
- **Section 6 — Client's Obligations**: Display-only
- **Section 7 — Broker Compensation**: Pre-filled with Emily's standard commission rate, display-only fields with editable fee percentage
- **Sections 8-17**: Display-only legal text with key provisions
- **Section 18 — Additional Notices**: Display-only
- **Signature Block**: Client's printed name, date (auto-filled), and signature (draw on canvas OR type in script font). Option to add a second client signer

**Pre-filled broker information:**
- Broker: Fathom Realty
- Associate: Emily Russell
- Address: (Emily's office address)
- Phone: (210) 912-0806
- Email: emily@streamwalkers.com
- License No: 791742

**Signature component (`src/components/portal/SignaturePad.tsx`):**
- Tab toggle: "Draw" / "Type"
- Draw mode: HTML5 canvas with touch support, clear button
- Type mode: text input rendered in a script/cursive font
- Returns signature as data URL (base64 PNG)

**On submission:**
1. Save to a new `signed_agreements` database table
2. Generate a PDF copy for download using the browser (client-side PDF generation with a library or print-to-PDF approach)
3. Send Emily a notification email via the transactional email system

**Database migration — `signed_agreements` table:**

```text
id              uuid        PK, default gen_random_uuid()
user_id         uuid        NOT NULL (references auth.users conceptually)
agreement_type  text        NOT NULL default 'buyer_rep_trx1501'
client_name     text        NOT NULL
client_address  text
client_city_state_zip text
client_phone    text
client_email    text
market_area     text
term_start      date
term_end        date
broker_fee_pct  numeric     default 3.0
signature_data  text        (base64 data URL of signature image)
signature_type  text        ('draw' or 'typed')
signed_at       timestamptz NOT NULL default now()
form_data       jsonb       (full form state for PDF reconstruction)
created_at      timestamptz default now()
```

RLS policies:
- Users can INSERT their own (`auth.uid() = user_id`)
- Users can SELECT their own (`auth.uid() = user_id`)
- Admins can SELECT all (`has_role(auth.uid(), 'admin')`)

**PDF generation:** Use browser `window.print()` with a print-optimized CSS view, or generate via a simple client-side approach. The form renders a "print view" version of the agreement with all filled data and the signature image embedded.

---

### Files

| File | Action |
|------|--------|
| `src/pages/PortalDashboard.tsx` | Create — welcome dashboard with value props and navigation guide |
| `src/pages/BuyerRepAgreement.tsx` | Create — multi-section digital form for TXR-1501 |
| `src/components/portal/SignaturePad.tsx` | Create — draw/type signature component |
| `src/App.tsx` | Edit — add routes for `/portal/dashboard` and `/portal/agreement` |
| `src/pages/ClientPortal.tsx` | Edit — redirect no-dossier users to dashboard, add Dashboard nav link |
| Database migration | Create `signed_agreements` table with RLS |

