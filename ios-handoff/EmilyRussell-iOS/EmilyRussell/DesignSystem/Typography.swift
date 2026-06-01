import SwiftUI

enum BrandFont {
    static func display(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("PlayfairDisplay-Regular", size: size).weight(weight)
    }
    static func body(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("DMSans-Regular", size: size).weight(weight)
    }
    /// Uppercase tracked label used throughout brand UI.
    static func label(_ size: CGFloat = 10.5) -> Font {
        .custom("DMSans-Medium", size: size)
    }
}

struct LabelStyle: ViewModifier {
    var size: CGFloat = 10.5
    var tracking: CGFloat = 4
    func body(content: Content) -> some View {
        content
            .font(BrandFont.label(size))
            .tracking(tracking)
            .textCase(.uppercase)
            .foregroundStyle(Color.brand.gold)
    }
}

extension View {
    func brandLabel(size: CGFloat = 10.5, tracking: CGFloat = 4) -> some View {
        modifier(LabelStyle(size: size, tracking: tracking))
    }
}
