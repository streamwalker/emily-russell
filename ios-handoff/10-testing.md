# 10 — Testing

## Unit tests (`EmilyRussellTests/`)

Port the deterministic logic from `src/lib/`:

| Source | Swift test target |
|--------|-------------------|
| `src/lib/paymentCalc.ts` | `PaymentCalcTests` — PITI, amortization schedule |
| `src/lib/dossierScoring.ts` | `DossierScoringTests` — grade weighting, rack-and-stack |
| `src/lib/cmaSchema.ts` | `CMASchemaMigrationTests` — version upgrades |
| `src/lib/dossierChangeTracking.ts` | `ChangeTrackingTests` — NEW vs UPDATED logic |

Use Swift Testing (`@Test`) not XCTest where possible.

## Snapshot tests

Use [swift-snapshot-testing](https://github.com/pointfreeco/swift-snapshot-testing) for:
- All `DesignSystem/` components (Button variants, Card variants, GlassStyles)
- `PropertyCardView` (4 grade variants × 2 color schemes)
- `LegalDocumentView` (each compliance doc)

## UI tests (`EmilyRussellUITests/`)

Smoke flows:

1. **Sign in** → reach `PortalDashboardView`
2. **Sign agreement** → TXR-1501 flow → PDF generated
3. **Grade a property** → A+ → confirm badge appears in dossier
4. **Add comment** → confirm Realtime echo
5. **Admin** → create client → view in clients list

## CI

GitHub Actions on `macos-26`:
```yaml
- run: cd EmilyRussell-iOS && xcodegen generate
- run: xcodebuild test -scheme EmilyRussell -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
```
