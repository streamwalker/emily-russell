# Screen — Comparison Dashboard

**Web source**: `src/components/portal/ComparisonView.tsx`. **Memory ref**: `mem://features/comparison-dashboard`.

## Purpose
KPI dashboard + side-by-side comparison matrix across selected properties.

## KPIs (Swift Charts)

- **Avg price / Median price** bar
- **Price per sqft** scatter
- **Beds vs price** bubble
- **Grade distribution** donut
- **Tour scheduled count** small KPI card

## Comparison matrix

Selectable up to 4 properties. Vertical attribute list × horizontal property columns:

| Attribute | A | B | C |
|-----------|---|---|---|
| Price | | | |
| $/sqft | | | |
| Beds/Baths | | | |
| Year built | | | |
| HOA | | | |
| Grade | | | |
| Days on market | | | |

- Highlight best value per row in `.brand.sage`.
- Highlight worst in `.brand.blush.opacity(0.6)`.

## SwiftUI

```swift
Grid(horizontalSpacing: 16, verticalSpacing: 8) {
    ForEach(attributes) { attr in
        GridRow {
            Text(attr.label)
            ForEach(selected) { prop in cell(attr, prop) }
        }
    }
}
```

## Export

`ShareLink(item: comparisonPDF)` — same `UIPrintPageRenderer` pattern as dossier print.
