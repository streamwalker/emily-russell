# Screen — Auth (Login / Reset / Change Email)

**Web sources**: `src/pages/ClientLogin.tsx`, `src/pages/ResetPassword.tsx`, `src/pages/ChangeEmail.tsx`.

## Login screen

- Hero: small logo + "Sign in to your client portal".
- Email + password fields.
- **Sign in with Apple** button (`SignInWithAppleButton(.signIn)`) — primary CTA, above email/password.
- "Forgot password?" link → `ResetPasswordRequestView`.
- "Need access?" → scroll-to-contact equivalent: open marketing tab `ContactFormSection`.

## Auth flows

```swift
@MainActor
final class AuthService {
    func signIn(email: String, password: String) async throws
    func signInWithApple(idToken: String, nonce: String) async throws
    func requestPasswordReset(email: String) async throws
    func updatePassword(_ new: String) async throws         // from deep-link recovery
    func updateEmail(_ new: String) async throws
    func signOut() async throws
}
```

## Sign in with Apple

1. Generate nonce, store SHA256(nonce) on request.
2. `ASAuthorizationAppleIDProvider().createRequest()` with `.fullName`, `.email`.
3. On success → `auth.signInWithIdToken(.init(provider: .apple, idToken: token, nonce: rawNonce))`.
4. Persist user's `fullName` to `profiles` (first sign-in only).

## Biometric re-entry

If a Keychain session exists at cold-start, prompt `LAContext.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, reason: "Unlock your client portal")` before revealing portal content. On failure, fall back to password.

## Password reset (deep link)

- App registers `emilyrussell://reset-password` and universal link `https://alamocitydesigns.com/portal/reset-password`.
- On open, present `NewPasswordView` (new password + confirm).
- Validates: min 8 chars, optionally calls HIBP through Supabase (already enabled on backend).

## Change email

- Triggered from `AccountView`.
- Sends confirmation to **both** old and new addresses (handled by Supabase).
- Banner: "Check both inboxes to confirm the change."

## Admin detection

After sign-in, query `user_roles` for current user → set `SessionStore.isAdmin`. Only then is the Admin tab visible.
