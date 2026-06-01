# Screen — Legal Pages

**Web sources**: `src/pages/TermsOfService.tsx`, `src/pages/PrivacyPolicy.tsx`, `src/pages/TRECDisclosures.tsx`, `src/pages/FairHousing.tsx`, `src/pages/Unsubscribe.tsx`.

## Single view

```swift
struct LegalDocumentView: View {
    let title: String
    let markdownResource: String   // e.g. "iabs"
    var body: some View {
        ScrollView {
            Markdown(loadResource(markdownResource))
                .padding(20)
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
```

## Routes
- Terms of Service
- Privacy Policy
- TREC Disclosures (links the IABS + Consumer Protection Notice)
- Fair Housing Notice
- Unsubscribe — open `https://alamocitydesigns.com/unsubscribe?token=...` in `SFSafariViewController`.

## Source of truth
Markdown files in `EmilyRussell/Resources/LegalCopy/`. Content **must match** the live web copy verbatim. See `08-compliance.md`.

## Entry points
- Marketing footer
- Account screen → "Legal & Disclosures" row
- Portal Dashboard → IABS one-tap link
