

## Compliance & Security Hardening Plan

### Important: What Applies to This Site

This is a **static real estate landing page** with no user authentication, no user accounts, no payment processing, and no AI features. Therefore:

- **SOC 2, ISO 27001, ISO 42001, PCI-DSS**: Organizational certifications — cannot be implemented in code. Not applicable until the business pursues formal audits.
- **Auth flow changes, user consents table, data export, account deletion**: No authentication or user accounts exist on this site, so these are not applicable.
- **GDPR data export / right to erasure**: No user data is stored beyond lead form submissions (which go to an edge function). No user accounts to delete.

### What We WILL Implement

#### 1. Terms of Service Page (`src/pages/TermsOfService.tsx`)
- Full EULA covering: data collection via lead forms, intellectual property, limitation of liability, indemnification, dispute resolution, governing law (Texas), and termination.
- Publicly accessible at `/terms`.

#### 2. Privacy Policy Page (`src/pages/PrivacyPolicy.tsx`)
- Covers: what data the lead forms collect, how it's used, third-party sharing, cookies, user rights, contact info for data requests.
- Publicly accessible at `/privacy`.

#### 3. Cookie Consent Banner (`src/components/CookieConsent.tsx`)
- Small banner on first visit with Accept/Decline buttons.
- Stores preference in `localStorage` so it only shows once.
- Styled to match the site's dark theme.

#### 4. Content Security Policy (`index.html`)
- Add CSP meta tag restricting script sources, image sources, and frame ancestors.

#### 5. Routes & Navigation Updates
- **`src/App.tsx`**: Add `/terms` and `/privacy` routes.
- **`src/pages/Index.tsx`**: Add "Terms of Service" and "Privacy Policy" links in the footer. Add the cookie consent component.

### Files

| File | Action |
|------|--------|
| `src/pages/TermsOfService.tsx` | Create |
| `src/pages/PrivacyPolicy.tsx` | Create |
| `src/components/CookieConsent.tsx` | Create |
| `src/App.tsx` | Edit — add routes |
| `src/pages/Index.tsx` | Edit — footer links + cookie banner |
| `index.html` | Edit — CSP meta tag |

No database changes needed (no user accounts exist).

