# Claude Code — Project Instructions

You are building an **iOS 26 SwiftUI** app that mirrors the Emily Russell Realtor web app. The web app is the source of truth for behavior; specs in this folder are the source of truth for the iOS port.

## Hard rules

1. **Target iOS 26.0+**. Xcode 26+. Swift 6 with strict concurrency.
2. **Use SwiftUI exclusively**. UIKit only when wrapping `VNDocumentCameraViewController`, `PDFView`, etc.
3. **State**: `@Observable` macro. No Combine. No ObservableObject. No third-party state libraries.
4. **Backend**: `supabase-swift` v2 against the existing Lovable Cloud project. Never write or migrate SQL — schema is fixed.
5. **Auth tokens**: Keychain only. Never `UserDefaults`.
6. **Compliance copy** (TREC, IABS, Fair Housing, Consumer Protection Notice, footer) is in `EmilyRussell/Resources/LegalCopy/*.md` and rendered **verbatim**. Never paraphrase, summarize, or "improve" it.
7. **Brand name**: "Emily Russell **Realtor**" — never "Realty". TREC license `#791742`. Brokerage: Fathom Realty.
8. **Design tokens** live in `DesignSystem/`. Never hardcode hex values in views.
9. **No backend writes** until the corresponding spec has been read end-to-end.

## Build order (implement in this sequence)

1. `01-architecture.md` + `02-design-system.md` → wire `Theme`, `Colors`, `Typography`, `GlassStyles`
2. `06-supabase-integration.md` → `SupabaseClient`, `AuthService`, Keychain
3. `04-data-models.md` → all `Codable` model structs
4. `03-screen-specs/03-auth.md` → Login, Sign in with Apple, password reset
5. `03-screen-specs/04-portal-dashboard.md`
6. `03-screen-specs/05-buyer-rep-agreement.md` (gate to dossier)
7. `03-screen-specs/06-client-dossier.md` (largest screen, build last among portal)
8. `03-screen-specs/07-payment-calculator.md`, `08-documents.md`, `09-comments-comms.md`, `10-comparison.md`
9. `03-screen-specs/00-marketing-home.md` + `01-rent-vs-buy.md` + `02-legal-pages.md`
10. `03-screen-specs/11-admin-dashboard.md` → `12-admin-leads.md` → `13-admin-cma.md`
11. `07-ios26-features.md` → Widgets, Live Activities, App Intents, Writing Tools

## When unsure

- Read the corresponding web file referenced in each spec (path included).
- Prefer SwiftUI-native UX (sheets, NavigationStack, `.searchable`, `.refreshable`) over literal web translations.
- Ask the user before changing copy, compliance text, or RLS-affecting query shapes.

## Testing

- Snapshot tests for design system components.
- Unit tests for `paymentCalc`, `dossierScoring`, `cmaSchema` logic (Swift ports of `src/lib/`).
- One UI test per major flow (login, sign agreement, grade property).
