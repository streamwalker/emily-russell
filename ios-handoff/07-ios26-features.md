# 07 — iOS 26 Features

## Liquid Glass

- Use the default Liquid Glass tab bar — do NOT set `.toolbarBackground(.visible, ...)`.
- Apply `.glassEffect()` to sticky headers, sheet headers, and call-to-action cards.
- Hero images: `.containerBackground(.image(...), for: .navigation)` with a translucent text panel using `.glassEffect(.regular.tint(.black.opacity(0.3)))`.
- Avoid stacking more than two glass layers — readability suffers.
- Cards/buttons keep `radius = 0` (brand requirement). Glass on square shapes is supported.

## Apple Intelligence

### Writing Tools
- Enabled automatically on `TextEditor` and `TextField` in iOS 26.
- Use in:
  - Property comment composer (`ClientDossierView` → comment field)
  - Admin smart-add free-text input
  - Lead form "message" field
- No code required — just `TextEditor($text)`.

### Genmoji
- Allow Genmoji in the property reaction picker (alongside grading).
- Use `.supportedInputModes([.standard, .genmoji])` on the relevant text field.

### App Intents

Create the following intents in `AppIntents/`:

```swift
struct OpenDossierIntent: AppIntent {
    static let title: LocalizedStringResource = "Open my property dossier"
    @MainActor func perform() async throws -> some IntentResult { /* deep link */ }
}

struct MarkPropertyFavoriteIntent: AppIntent {
    @Parameter(title: "Property") var property: PropertyEntity
    func perform() async throws -> some IntentResult { /* toggle */ }
}

struct RequestTourIntent: AppIntent { @Parameter var property: PropertyEntity; @Parameter var date: Date }
```

Expose via `AppShortcutsProvider` so they appear in Spotlight, Siri, and Shortcuts.

## WidgetKit

Two widgets in a `Widgets/` extension target:

1. **Top-Ranked Property** (small + medium)
   - Pulls highest-graded property from `property_interactions` (joined with dossier data)
   - Tap → `emilyrussell://dossier/<id>?property=<pid>`
   - Refresh: every 60 min + on app launch
2. **Next Tour Reminder** (medium)
   - Shows next `preferred_tour_date`/`preferred_tour_time`
   - Tap → opens tour confirmation flow

Use `App Group` `group.com.emilyrussell.app` to share Keychain session and a cached `WidgetSnapshot.json` between app and widget extension.

## Live Activity

`PropertyTourActivity` — Dynamic Island countdown to an upcoming tour:

```swift
struct PropertyTourAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var minutesUntilTour: Int
        var propertyAddress: String
    }
    var dossierId: String
    var propertyId: String
}
```

Start when user confirms a tour <12 hours away. End automatically at tour start time.

## Privacy strings (Info.plist)

- `NSCameraUsageDescription` — "Scan documents to attach to your property dossier."
- `NSPhotoLibraryUsageDescription` — "Attach photos to property comments."
- `NSFaceIDUsageDescription` — "Quickly unlock your client portal."
- `NSLocationWhenInUseUsageDescription` — "Show nearby comparable listings (optional)."

## Capabilities

- Sign in with Apple
- Push Notifications (deferred — see README out-of-scope)
- App Groups
- Associated Domains: `applinks:alamocitydesigns.com`
- WidgetKit Extension
- Background Modes: `fetch`, `processing`
