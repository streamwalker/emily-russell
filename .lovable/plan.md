

## Plan: Property Address + Map Thumbnail in PDF Header

Add the property's address and a small Google Maps Static thumbnail to the top-left of the scenario comparison PDF header so clients always know which home the comparison refers to.

### Why a new edge function

The Google Maps Static API key must stay server-side. We'll proxy the map image through a Supabase Edge Function that:
1. Takes an address (and optional size) as input.
2. Calls `https://maps.googleapis.com/maps/api/staticmap` with the secret key.
3. Returns the PNG bytes (or a base64 data URL).

This keeps the key out of the frontend bundle and lets us embed the result directly into the PDF.

### What you'll need to provide

A **Google Maps Static API key**. Steps to get one:
1. Go to Google Cloud Console → create or select a project.
2. Enable the **Maps Static API**.
3. Credentials → Create API key. Restrict it to the Maps Static API and (optionally) to your Supabase Edge Function's outbound IPs.
4. Paste the key when prompted — it'll be stored as the secret `GOOGLE_MAPS_STATIC_API_KEY`.

(I'll request this via `add_secret` once you approve the plan and pause until you've entered it.)

### Implementation

**1. New edge function `supabase/functions/get-map-thumbnail/index.ts`**
- POST `{ address, city?, size? }` → returns `{ dataUrl: "data:image/png;base64,..." }`.
- Reads `GOOGLE_MAPS_STATIC_API_KEY` from env. Builds URL with `center=<address>`, `zoom=15`, `size=240x160`, `scale=2`, `maptype=roadmap`, `markers=color:red|<address>`.
- Returns 400 if no address; 500 with helpful message if Google rejects the key.
- CORS headers per Lovable conventions. `verify_jwt` stays default.

**2. Pass property context into the dialog**

`src/components/portal/PaymentCalculator.tsx`
- Add optional props: `propertyAddress?: string`, `propertyCity?: string`, `propertyCommunity?: string`.
- Forward them to `<ScenarioCompareDialog>`.

`src/components/portal/ClientDossierView.tsx`
- In `PaymentCalculatorToggle`, accept and forward `address`, `city`, `community`.
- At the call site (line ~524), pass `prop.address`, `prop.city`, `prop.community` through.

`src/components/portal/ScenarioCompareDialog.tsx`
- Add the three new optional props.
- Forward them into `<ScenarioComparePrintView>` along with an optional `mapDataUrl`.

**3. Fetch the map at export time**

In `handleExportPdf` (`ScenarioCompareDialog.tsx`), before mounting the print view:
```ts
let mapDataUrl: string | undefined;
if (propertyAddress) {
  try {
    const { data } = await supabase.functions.invoke("get-map-thumbnail", {
      body: { address: propertyAddress, city: propertyCity },
    });
    mapDataUrl = data?.dataUrl;
  } catch { /* non-fatal — header just shows text */ }
}
```
Pass `mapDataUrl`, `propertyAddress`, `propertyCity`, `propertyCommunity` to the print view.

**4. Render header in `ScenarioComparePrintView.tsx`**

Replace the existing single-row header with a two-column layout:

```text
┌────────────────────────────────────────────────────────────────────┐
│ ┌──────┐  123 Maple St                    Payment Scenario         │
│ │ map  │  San Antonio · Stone Oak           Comparison             │
│ └──────┘                                  Generated 4/21/26 1:02AM │
└────────────────────────────────────────────────────────────────────┘
```

- Left cluster (top-left): 120×80px map image (rounded 4px, 1px border) if `mapDataUrl` provided, else a 120×80 muted placeholder with the street number in large type. To the right of the map: address (Playfair Display, 16px, bold) on line 1; `city · community` (DM Sans, 11px, muted) on line 2.
- Right cluster: existing "Payment Scenario Comparison" title + timestamp, right-aligned.
- Same 1px border-bottom separator beneath, slightly more vertical padding (16→20) to fit the 80px-tall thumbnail cleanly.

If neither address nor map is available (e.g. anon preview), the header falls back to its current single-line form.

### Out of scope

- Editable header / custom captions
- Including the map thumbnail in the on-screen modal (PDF only, per request)
- Caching map images across exports
- Sat/hybrid map styles or marker color theming

### Files touched

- `supabase/functions/get-map-thumbnail/index.ts` (new)
- `src/components/portal/ScenarioCompareDialog.tsx` (new props, fetch map, pass to print view)
- `src/components/portal/ScenarioComparePrintView.tsx` (new header layout, map image)
- `src/components/portal/PaymentCalculator.tsx` (forward props)
- `src/components/portal/ClientDossierView.tsx` (forward props from `prop`)

