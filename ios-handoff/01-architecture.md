# 01 — Architecture

## Layers

```
App entry (EmilyRussellApp)
   │
   ├── RootRouter (decides marketing vs portal vs admin)
   │
   ├── Features/
   │     ├── Marketing/     public site, no auth required
   │     ├── Portal/        authenticated client experience
   │     └── Admin/         requires user_roles.role = 'admin'
   │
   ├── DesignSystem/        Colors, Typography, GlassStyles, Theme
   ├── Models/              Codable structs for every Supabase table
   ├── Networking/
   │     ├── SupabaseClient (singleton)
   │     ├── Auth/          AuthService + BiometricGate
   │     └── EdgeFunctions  typed wrappers
   ├── Widgets/             WidgetKit extension
   └── AppIntents/          Siri / Shortcuts entry points
```

## Navigation

Top-level `TabView` with iOS 26 bottom-accessory Liquid Glass tab bar:

| Tab | Visible when | Root view |
|-----|--------------|-----------|
| Home | always | `MarketingHomeView` |
| Portal | signed in | `PortalDashboardView` → `ClientDossierView` |
| Admin | `isAdmin` | `AdminDashboardView` |
| Account | signed in | `AccountView` |

Inside each tab, use `NavigationStack` with typed routes (an enum `Route: Hashable`).

## State

- `@Observable final class SessionStore` — current user, role, token refresh timer. Injected via `.environment(\.session, ...)`.
- `@Observable final class DossierStore` — active dossier, properties, interactions. One instance per signed-in user.
- Screen-local state stays in `@State` inside the view.

## Concurrency

- All network calls use `async throws`.
- Long-running uploads/downloads are `Task`s tied to the view's lifetime with `.task { }`.
- Realtime channels live on the store and are cancelled in `deinit`.

## Error handling

- A top-level `ErrorBanner` overlay subscribes to `SessionStore.lastError`.
- Network errors bubble up as `SupabaseError` and are mapped to user-friendly strings in `ErrorPresenter`.

## File reference (web)

- Web equivalent: `src/App.tsx` (routes), `src/components/ProtectedRoute.tsx`, `src/hooks/useAdminCheck.ts`.
