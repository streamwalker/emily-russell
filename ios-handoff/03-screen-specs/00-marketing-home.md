# Screen — Marketing Home

**Web source**: `src/pages/Index.tsx` (962 lines).

## Purpose
Public-facing home page. Lead capture is the primary conversion goal.

## Sections (top → bottom)

1. **Hero** — full-bleed photo (San Antonio home), brand title "Emily Russell · Realtor", tagline, two CTAs ("View Properties", "Get In Touch").
2. **About Emily** — headshot + bio + Fathom Realty + TREC #791742.
3. **Services** — Buyer Rep, Listing, Relocation, NuBuild partnership.
4. **Featured Communities** — Alamo Ranch, Stone Oak, Helotes, Boerne.
5. **Rent vs Buy teaser** → deep link to `RentVsBuyView`.
6. **Testimonials**.
7. **Partners (affiliate dropdown)** — Streamwalkers, EquiForge, etc.
8. **Contact form** — `name, email, phone, timeframe, message` → calls `sync-lead` edge function.
9. **Footer** — IABS, Fair Housing, TREC license, broker info (verbatim from `08-compliance.md`).

## SwiftUI structure

```swift
struct MarketingHomeView: View {
    var body: some View {
        ScrollView {
            HeroSection()
            AboutSection()
            ServicesSection()
            CommunitiesSection()
            RentVsBuyTeaser()
            TestimonialsSection()
            PartnersSection()
            ContactFormSection()
            LegalFooter()
        }
        .containerBackground(.image(Image("hero-sa")), for: .navigation)
    }
}
```

## Hero — iOS specifics

- Replace web `<img>` LCP optimization with `Image("hero-sa").resizable().scaledToFill()` in a `GeometryReader`.
- Glass overlay: `.glassEffect(.regular.tint(.brand.charcoal.opacity(0.45)))` behind text block.
- Title in Playfair Display, 44pt, weight `.regular`.

## Contact form

- Use `Form` with `TextField` + `.textContentType(.name|.emailAddress|.telephoneNumber)`.
- Validate: email regex, phone (10 digits), name required.
- Submit: `EdgeFunctions.syncLead(...)`.
- On success: dismiss keyboard, show `.glassEffect` toast "Thanks — Emily will reach out within one business day."
- Log analytics event `lead_submitted` via `Models.AnalyticsEvent.log(...)`.

## Lead capture redirect rule

Any "informational" section without a dedicated page (matching memory `Lead Capture: scroll to contact`) → tap CTA scrolls to `ContactFormSection` via `ScrollViewReader`.

## Accessibility

- Hero image: `.accessibilityLabel("Luxury San Antonio home exterior")`
- Form fields: explicit labels above (not just placeholders).
- Color contrast: glass-overlaid text uses `.brand.cream` over charcoal glass.
