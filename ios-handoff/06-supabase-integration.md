# 06 — Supabase Integration

## SDK

Use [`supabase-swift`](https://github.com/supabase/supabase-swift) v2+ as a Swift Package dependency. Add via `Package.swift` or SPM in Xcode.

```swift
import Supabase

@MainActor
final class SupabaseClient {
    static let shared = SupabaseClient()
    let client: Supabase.SupabaseClient

    private init() {
        let url = URL(string: Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as! String)!
        let key = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as! String
        client = Supabase.SupabaseClient(supabaseURL: url, supabaseKey: key,
                                         options: .init(auth: .init(storage: KeychainAuthStorage())))
    }
}
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` come from `Config.xcconfig` → `Info.plist`. Real values: see web project's `.env`.

## Auth storage

Implement `AuthLocalStorage` backed by Keychain (`Security` framework). Never `UserDefaults`. Tokens auto-refresh in the background via the SDK.

```swift
struct KeychainAuthStorage: AuthLocalStorage {
    func store(key: String, value: Data) throws { /* SecItemAdd / Update */ }
    func retrieve(key: String) throws -> Data? { /* SecItemCopyMatching */ }
    func remove(key: String) throws { /* SecItemDelete */ }
}
```

## Auth flows

| Flow | API | Notes |
|------|-----|-------|
| Email + password sign-in | `auth.signIn(email:password:)` | |
| Sign in with Apple | `AuthenticationServices` → `auth.signInWithIdToken(.init(provider: .apple, idToken:))` | Requires BYOC config (see CLAUDE.md). Native sheet, no web view. |
| Password reset | `auth.resetPasswordForEmail(_, redirectTo:)` | `redirectTo` = `emilyrussell://reset-password` (universal link) |
| Change email | `auth.update(user: .init(email:))` | |
| Sign out | `auth.signOut()` | Also clear Keychain biometric token |
| Biometric re-entry | `LAContext.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)` | Gate at app cold-start when session exists |

## Session

`SessionStore` subscribes to `client.auth.authStateChanges` and republishes `currentUser`, `isAdmin`, `agreementSigned`.

```swift
for await (event, session) in client.auth.authStateChanges {
    await MainActor.run { self.session = session }
}
```

## Realtime

Subscribe to `comment_replies` changes per dossier:

```swift
let channel = client.realtime.channel("dossier:\(dossierId)")
channel.onPostgresChange(.all, schema: "public", table: "comment_replies") { payload in
    Task { @MainActor in store.applyReply(payload) }
}
try await channel.subscribe()
```

Remember to `await channel.unsubscribe()` in `deinit`.

## Storage buckets

| Bucket | Public | Used for |
|--------|--------|----------|
| `agreement-templates` | yes | TRX-1501 blank PDF |
| `dossier-documents` | no | Client-uploaded docs (signed URLs) |
| `cma-reports` | no | Generated CMA PDFs (signed URLs) |

Always use `createSignedURL(path:expiresIn:)` for private buckets — never expose raw paths.

## RLS reminders

- `client_dossiers`: clients read their own only (`user_id = auth.uid()`); admins do everything.
- `property_interactions`: per-user CRUD.
- `comment_replies`: clients read only replies on **their** interaction; admins manage all.
- `homes`, `cma_reports`, `dossier_templates`, `leads`: admin only.
- Always rely on RLS — do not duplicate authorization logic client-side.

## Deep links

Register `emilyrussell://` and a universal link domain (`alamocitydesigns.com`). Handle:

- `emilyrussell://reset-password?...`
- `emilyrussell://dossier/<id>` (Siri shortcut entry)
- `https://alamocitydesigns.com/portal` → open Portal tab
