import SwiftUI

// iOS 26 Liquid Glass shorthands.
// See ios-handoff/02-design-system.md for usage rules.

extension View {
    /// Brand card surface — square corners (radius: 0 per brand).
    func glassCard() -> some View {
        self.glassEffect(.regular, in: .rect(cornerRadius: 0))
    }

    /// Compact glass bar (e.g. sticky tab bar).
    func glassBar() -> some View {
        self.glassEffect(.thin, in: .capsule)
    }

    /// Translucent dark chrome used in portal headers.
    func glassChrome() -> some View {
        self.glassEffect(.regular.tint(Color.brand.charcoal.opacity(0.6)))
    }
}
