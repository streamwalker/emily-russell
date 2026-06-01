# Emily Russell — iOS 26 SwiftUI Handoff

This bundle is a complete spec + starter scaffold for rebuilding the Emily Russell Realtor web app (https://alamocitydesigns.com) as a native iOS 26 SwiftUI app. It is designed to be opened by **Claude Code** in a fresh repo and built out incrementally.

## What's here

```
ios-handoff/
├── README.md                  ← you are here
├── CLAUDE.md                  ← auto-loaded instructions for Claude Code
├── 01-architecture.md
├── 02-design-system.md
├── 03-screen-specs/           ← one file per screen
├── 04-data-models.md
├── 05-api-contracts.md
├── 06-supabase-integration.md
├── 07-ios26-features.md
├── 08-compliance.md
├── 09-assets-index.md
├── 10-testing.md
├── assets/                    ← brand assets + screenshots
└── EmilyRussell-iOS/          ← Xcode project scaffold
```

## How to use with Claude Code

1. Copy `ios-handoff/` into a fresh git repo.
2. Open the repo in Claude Code. It will auto-load `CLAUDE.md`.
3. From `EmilyRussell-iOS/`, run `xcodegen generate` (uses `project.yml`) and open `EmilyRussell.xcodeproj` in Xcode 26+.
4. Fill in `Config.xcconfig` with `SUPABASE_URL` and `SUPABASE_ANON_KEY` (values are in the existing web project's `.env`).
5. Ask Claude Code to implement screens in the order listed in `CLAUDE.md`.

## Backend

The iOS app reuses the existing **Lovable Cloud** (Supabase) project. No backend migration is required. All RLS policies, edge functions, storage buckets, and auth users already work as-is.

- Supabase project ref: `vkkguobxdilogwhqdtur`
- Anon key + URL: see web project's `.env`

## Scope reminder

- Full parity with web: public marketing site + client portal + admin portal.
- Auth: email/password + Sign in with Apple (BYOC) + biometric re-entry.
- iOS 26 features: Liquid Glass, Apple Intelligence (Writing Tools, Genmoji, App Intents), WidgetKit, Live Activities.

## Out of scope

- APNs/push server setup
- App Store metadata / TestFlight provisioning
- OSINT analyst (intentionally dormant on web, stubbed on iOS)
- Any backend changes — the iOS app is a pure client of the existing Supabase project
