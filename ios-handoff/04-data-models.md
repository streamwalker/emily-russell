# 04 — Data Models

Swift `Codable` structs mirroring every table in the Supabase schema. All use `snake_case` via `CodingKeys`. Place each in `Models/<TableName>.swift`.

## Conventions

```swift
import Foundation

struct Profile: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let userId: UUID
    let email: String
    let fullName: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, email
        case userId = "user_id"
        case fullName = "full_name"
        case createdAt = "created_at"
    }
}
```

Use `JSONDecoder` with `.iso8601` date strategy at the client level (not per-model).

## Tables → structs

| Table | Struct | Notes |
|-------|--------|-------|
| `profiles` | `Profile` | |
| `user_roles` | `UserRole` | `role: AppRole` enum (`admin`, `moderator`, `user`) |
| `client_dossiers` | `ClientDossier` | `dossierData: DossierData` (decode nested JSON) |
| `dossier_views` | `DossierView` | composite key (`dossier_id`, `user_id`) |
| `dossier_documents` | `DossierDocument` | |
| `dossier_templates` | `DossierTemplate` | admin only |
| `property_interactions` | `PropertyInteraction` | `grade: Grade?` enum A+ … F- |
| `comment_replies` | `CommentReply` | |
| `saved_estimates` | `SavedEstimate` | mortgage calculator |
| `signed_agreements` | `SignedAgreement` | TXR-1501 |
| `agreement_config` | `AgreementConfig` | |
| `homes` | `Home` | shared address registry |
| `cma_reports` | `CMAReport` | admin only |
| `leads` | `Lead` | admin read, anon write |
| `analytics_events` | `AnalyticsEvent` | anon write only |
| `email_*` | skip on iOS | service-role only |

## DossierData (nested JSON)

The `client_dossiers.dossier_data` blob is the largest object. Mirror the TS shape from `src/components/portal/ClientDossierView.tsx`:

```swift
struct DossierData: Codable, Hashable, Sendable {
    var clientName: String
    var clientEmail: String?
    var properties: [PortalProperty]
    var preparedDate: Date?
    var notes: String?
    var tabs: [DossierTab]?
    // ... see ClientDossierView.tsx for full surface
}

struct PortalProperty: Codable, Hashable, Identifiable, Sendable {
    var id: String
    var address: String
    var price: Double?
    var beds: Double?
    var baths: Double?
    var sqft: Int?
    var yearBuilt: Int?
    var photoUrl: String?
    var sourceUrl: String?
    var builder: String?
    var tags: [String]?
    var lastUpdatedAt: Date?
    // see dossierChangeTracking.ts for change-detection fields
}
```

Decoders MUST tolerate missing/extra keys (use `decodeIfPresent`) — older dossiers exist with sparse data.

## Enums

```swift
enum AppRole: String, Codable, Sendable { case admin, moderator, user }

enum Grade: String, Codable, CaseIterable, Sendable {
    case aPlus = "A+", a = "A", aMinus = "A-"
    case bPlus = "B+", b = "B", bMinus = "B-"
    case cPlus = "C+", c = "C", cMinus = "C-"
    case dPlus = "D+", d = "D", dMinus = "D-"
    case fPlus = "F+", f = "F", fMinus = "F-"
}
```

## Generation

The TypeScript types in `src/integrations/supabase/types.ts` are the canonical schema source — read them before writing each struct to avoid drift.
