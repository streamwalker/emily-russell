# Build the Xcode project

This scaffold uses [XcodeGen](https://github.com/yonaskolb/XcodeGen) so `project.pbxproj` stays out of git.

```bash
brew install xcodegen
cd ios-handoff/EmilyRussell-iOS
xcodegen generate
open EmilyRussell.xcodeproj
```

Then fill in `EmilyRussell/Config.xcconfig` with the real `SUPABASE_URL` and `SUPABASE_ANON_KEY` (see the web project's `.env`).
