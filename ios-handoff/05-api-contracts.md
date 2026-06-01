# 05 — Edge Function API Contracts

All edge functions live at `https://<project-ref>.supabase.co/functions/v1/<name>`. Invoke via `supabase.functions.invoke(name, options:)`. JWT is auto-attached for the signed-in user when `verify_jwt = true`.

## Functions

### `sync-lead`
Public lead capture (anon allowed). Body: `{ name, email, phone?, timeframe?, message?, source, metadata? }`. Returns `{ ok: true, id }`. Server validates with Zod and writes to `leads` + external CRMs.

### `create-client`
Admin only. Body: `{ email, fullName, sendInvite: bool }`. Creates auth user + profile + initial dossier. Returns `{ userId, temporaryPassword? }`.

### `update-client-credentials`
Admin only. Body: `{ userId, newEmail?, newPassword? }`. Returns `{ ok }`.

### `generate-agreement-pdf`
Body: `{ formData, signatureDataUrl, signatureType: "draw"|"type" }`. Server fills `public/TRX_1501_blank.pdf` and stamps signatures. Returns `{ pdfBase64, signedAgreementId }`. **Long-running** — set 60s timeout.

### `generate-cma-narrative`
Admin only. Body: `{ subject, comps[] }`. Calls Anthropic Claude. Returns `{ narrative, executiveSummary, valueLow, valueRecommended, valueHigh, ppsfLow, ppsfRecommended, ppsfHigh }`.

### `cma-autofill`
Admin only. Body: `{ address }`. Calls Firecrawl + Gemini. Returns partial `Home` + `sources` map.

### `parse-properties`
Admin only. Body: `{ input: string, mode: "text"|"url"|"document" }`. Returns `{ properties: PortalProperty[] }`.

### `enrich-properties`
Admin only. Body: `{ properties: PortalProperty[] }`. Returns `{ properties: PortalProperty[] }` with enriched fields. Currently dormant (OSINT disabled).

### `get-map-thumbnail`
Body: `{ address, width?, height? }`. Returns PNG bytes (use `data:` URL) from Google Static Maps.

### `get-site-analytics`
Admin only. Returns `{ events: AnalyticsEvent[], summary: {...} }`.

### `handle-email-unsubscribe`
Public (token-based). GET `?token=...`. Returns HTML page on web — iOS app should open in `SFSafariViewController`.

### `send-transactional-email`, `process-email-queue`, `handle-email-suppression`, `auth-email-hook`, `preview-transactional-email`
Server-side only. **Do not call from iOS.**

## Typed wrapper pattern

```swift
struct EdgeFunctions {
    static let client = SupabaseClient.shared.functions

    static func syncLead(_ body: SyncLeadBody) async throws -> SyncLeadResponse {
        try await client.invoke("sync-lead", options: .init(body: body))
    }

    static func generateAgreementPDF(_ body: AgreementBody) async throws -> AgreementResponse {
        try await client.invoke("generate-agreement-pdf",
                                options: .init(body: body, headers: ["x-timeout-ms": "60000"]))
    }
}
```

Each function gets a request struct + response struct in `Networking/EdgeFunctions.swift`.
