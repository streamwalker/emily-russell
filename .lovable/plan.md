## Goal

Make the comps grid self-explanatory with column labels, and capture richer per-comp data: builder, year built, prior owners, listing agent, listing broker, rental history, and major insurance claims.

## UI changes — `src/components/admin/cma/CmaEditor.tsx`

**1. Column headers above the comps grid**

A non-input header row matching the 12-column layout:

```
ADDRESS (4)  ·  SALE PRICE (2)  ·  SQFT (1)  ·  BD (1)  ·  BA (1)  ·  SALE DATE (2)  ·  ⋯ (1)
```

Small uppercase tracked muted-foreground caps, same treatment as the subject section labels.

**2. Per-comp "Details" disclosure (one row per comp, collapsed by default)**

Six fields don't fit on the primary row, so add a "▾ Details" toggle on each comp that reveals a second grid:

```
Year Built · Builder · # Prior Owners · Listing Agent · Listing Broker
Ever Rented? (yes/no/unknown)  ·  Major Insurance Claims (multi-line text)
```

- Year Built: number input
- Builder, Listing Agent, Listing Broker: text inputs
- # Prior Owners: number input
- Ever Rented: 3-state select (Unknown / No / Yes)
- Insurance Claims: textarea (fire/water/hail/etc. — free text since these are narrative)

Auto-expands if any of the new fields already has a value.

## Type changes — `src/lib/cmaPdf.ts`

Extend `CmaComp`:

```ts
export interface CmaComp {
  // existing...
  yearBuilt?: number | null;
  builder?: string | null;
  priorOwners?: number | null;
  listingAgent?: string | null;
  listingBroker?: string | null;
  everRented?: "yes" | "no" | "unknown" | null;
  insuranceClaims?: string | null;
}
```

Update `emptyComp()` in CmaEditor to include the new keys.

## PDF output — `src/lib/cmaPdf.ts`

In the comps section, add a small "Provenance & History" sub-block under each comp listing the new fields (only those with values, to avoid clutter). Format:

```
Built 2018 · Lennar · 2 prior owners
Listed by: Jane Doe (Keller Williams)
Rental history: No
Claims: Water damage 2021 (roof)
```

## Autofill — `supabase/functions/cma-autofill/index.ts`

Extend the Gemini extraction schema for comps to attempt: `yearBuilt`, `builder`, `priorOwners`, `listingAgent`, `listingBroker`, `everRented`, `insuranceClaims`.

These are best-effort — most scrape sources won't have owner counts or claims, so leave them null when unknown. Existing confidence filters stay as-is (still gated on price/sqft/address).

## Persistence

Already handled — `cma_reports.comps_data` is JSONB and auto-save serializes the full comp objects. No migration needed.

## Out of scope

- Public-records lookups for owner history (would require a paid data provider like ATTOM/CoreLogic)
- Insurance claim databases (CLUE reports are not API-accessible; user enters manually when known)
- Subject property doesn't get these new fields in this pass — comps only, per the request
