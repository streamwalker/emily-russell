## Goal

Package this entire web app (public site + client portal + admin portal) as a Claude Code-ready handoff for rebuilding as a native **iOS 26 SwiftUI** app that reuses the existing Lovable Cloud (Supabase) backend, with Liquid Glass design, Apple Intelligence, and Widgets/Live Activities.

Nothing in the live web app changes. All output lives in a new `ios-handoff/` folder at the repo root, plus a downloadable zip in `/mnt/documents/`.

## Deliverables

### 1. `ios-handoff/` — Spec bundle (Markdown)

```text
ios-handoff/
├── README.md                     Entry point + how to use with Claude Code
├── CLAUDE.md                     Project instructions auto-loaded by Claude Code
├── 01-architecture.md            App layers, navigation graph, state mgmt (Observation)
├── 02-design-system.md           Liquid Glass tokens mapped from index.css
│                                 (gold/charcoal/cream/blush/sage, Playfair/DM Sans
│                                 → New York/SF Pro fallbacks + bundled .ttf)
├── 03-screen-specs/              One .md per screen, mirrors web routes
│   ├── 00-marketing-home.md      (Index.tsx → hero, services, about, contact)
│   ├── 01-rent-vs-buy.md
│   ├── 02-legal-pages.md         Terms, Privacy, TREC, Fair Housing, Unsubscribe
│   ├── 03-auth.md                Login, reset, change email + Sign in with Apple
│   ├── 04-portal-dashboard.md
│   ├── 05-buyer-rep-agreement.md TXR-1501 signing flow
│   ├── 06-client-dossier.md      Tabs, ranking, grading, favorites, tour requests
│   ├── 07-payment-calculator.md  PITI + amortization (Swift Charts)
│   ├── 08-documents.md           Upload via VisionKit doc scanner
│   ├── 09-comments-comms.md      Threaded comments + Realtime
│   ├── 10-comparison.md          Comparison dashboard charts
│   ├── 11-admin-dashboard.md     Templates, clients, smart add, OSINT (stub)
│   ├── 12-admin-leads.md
│   └── 13-admin-cma.md
├── 04-data-models.md             Swift structs for every Supabase table
│                                 (Codable, snake_case via CodingKeys)
├── 05-api-contracts.md           Every edge function: URL, payload, response,
│                                 secrets it depends on
├── 06-supabase-integration.md    supabase-swift setup, RLS notes, Realtime,
│                                 Storage buckets, auth callbacks
├── 07-ios26-features.md          Liquid Glass usage, Writing Tools in comment
│                                 composer, Genmoji in property reactions,
│                                 App Intents (Open Dossier, Add Favorite),
│                                 WidgetKit (top-ranked property, tour reminder),
│                                 Live Activity (active tour countdown)
├── 08-compliance.md              TREC/IABS/Fair Housing rules that MUST appear
│                                 verbatim, cookie/consent equivalents
├── 09-assets-index.md            Inventory of images, logos, PDFs to migrate
├── 10-testing.md                 XCTest + snapshot testing approach
└── assets/                       Exported brand assets + screenshots
    ├── logo/, fonts/, screenshots/, pdf-templates/
```

### 2. `ios-handoff/EmilyRussell-iOS/` — Xcode project scaffold

A minimal but compilable SwiftUI app skeleton Claude Code can flesh out:

```text
EmilyRussell-iOS/
├── EmilyRussell.xcodeproj/       Pre-generated project.pbxproj
├── EmilyRussell/
│   ├── EmilyRussellApp.swift     @main + Supabase client init
│   ├── Info.plist                iOS 26 deployment target, ITSAppUsesNonExemptEncryption,
│   │                             Sign in with Apple capability, camera/photo usage strings
│   ├── Config.xcconfig           SUPABASE_URL + SUPABASE_ANON_KEY placeholders
│   ├── DesignSystem/
│   │   ├── Colors.swift          Brand color tokens (gold/charcoal/cream/blush/sage)
│   │   ├── Typography.swift      Playfair/DM Sans font wrappers
│   │   ├── GlassStyles.swift     Liquid Glass view modifiers
│   │   └── Theme.swift
│   ├── Networking/
│   │   ├── SupabaseClient.swift  supabase-swift singleton
│   │   ├── Auth/
│   │   │   ├── AuthService.swift Email+pwd, Sign in with Apple, Keychain storage
│   │   │   └── BiometricGate.swift  FaceID/TouchID unlock
│   │   └── EdgeFunctions.swift   Typed wrappers for every function
│   ├── Models/                   Empty stubs matching 04-data-models.md
│   ├── Features/
│   │   ├── Marketing/            Empty View files matching 03-screen-specs/
│   │   ├── Portal/
│   │   ├── Admin/
│   │   └── Shared/
│   ├── Widgets/                  WidgetKit extension target stub
│   ├── AppIntents/               App Intents stubs
│   └── Resources/
│       ├── Assets.xcassets       Brand colors + AppIcon placeholder
│       ├── Fonts/                Playfair Display + DM Sans .ttf files
│       └── LegalCopy/            Markdown of TREC/IABS/Privacy/Terms verbatim
├── EmilyRussellTests/
└── EmilyRussellUITests/
```

Every View file is a stub like:
```swift
// TODO(claude-code): implement per ios-handoff/03-screen-specs/06-client-dossier.md
struct ClientDossierView: View {
    var body: some View { Text("ClientDossierView") }
}
```

### 3. `/mnt/documents/emily-russell-ios-handoff.zip`

A downloadable artifact containing the full `ios-handoff/` tree, ready to drop into a new repo.

## Approach

1. Audit current routes, components, edge functions, tables → build a single inventory.
2. Translate `src/index.css` tokens to a Swift `Color` extension + Liquid Glass modifiers.
3. For each web page/component, write a screen spec that captures: purpose, inputs/state, Supabase queries, RLS implications, copy that must be verbatim (compliance), UI structure, edge cases, and an iOS-native equivalent (NavigationStack/TabView/sheet/etc.).
4. Generate Swift `Codable` model stubs from the Supabase table schema already in context.
5. Document every edge function under `supabase/functions/` with its request/response shape (read each `index.ts`).
6. Pre-generate a buildable Xcode project (script using `xcodegen`-style `project.yml` committed alongside, plus a hand-written `project.pbxproj`).
7. Write `CLAUDE.md` so Claude Code knows: build with Xcode 26, target iOS 26, use supabase-swift, follow the screen specs in order, never alter compliance copy, etc.
8. Zip and place in `/mnt/documents/`.

## Out of scope (call out in README)

- Push notification server (separate APNs setup needed before launch).
- App Store metadata / screenshots / TestFlight provisioning.
- Migrating any backend logic — the iOS app talks to the same Lovable Cloud project.
- Live OSINT feature (intentionally dormant on web; stays stubbed on iOS).

## Technical notes

- **Min target**: iOS 26.0. Uses `.glassEffect()`, `Glass` material, new `TabView` with bottom accessory.
- **Auth**: `supabase-swift` v2 + `AuthenticationServices` for Sign in with Apple. Tokens in Keychain via `SimpleKeychain`. `LocalAuthentication` for biometric re-entry.
- **State**: Swift 6 `@Observable` macro, structured concurrency, no Combine.
- **Charts**: Swift Charts (replaces Recharts for PITI pie + amortization + comparison KPIs).
- **PDFs**: `PDFKit` + `TPPDF` for TXR-1501 generation; reuse existing PDF templates from `agreement-templates` bucket.
- **Doc scanning**: `VisionKit` `VNDocumentCameraViewController` replaces the current OpenCV web pipeline.
- **Realtime**: `supabase-swift` Realtime channels for comment replies and dossier updates.
- **Apple Intelligence**: Writing Tools auto-enabled on `TextEditor`; Genmoji in property reaction picker; `AppIntent`s for "Open dossier", "Mark favorite", "Request tour".
- **WidgetKit**: Small/medium widget showing top-ranked property + next scheduled tour; refreshes via `BackgroundTasks`.
- **Live Activities**: Active property tour countdown w/ Dynamic Island.
- **Compliance**: IABS, Consumer Protection Notice, Fair Housing, TREC #791742 footer rendered verbatim from bundled markdown — never paraphrased.
