/**
 * ─────────────────────────────────────────────────────────────────────────────
 * COMMUNITIES DATA — VERIFIED / PENDING CONTRACT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This module is the single source of truth for community facts on this site.
 *
 * EVERY fact is wrapped in `Verified<T>` and carries a `status`:
 *
 *   status: 'verified'  → the fact has been confirmed against a named source on
 *                         a specific date. It MAY be rendered as a stated fact.
 *   status: 'pending'   → the fact is unconfirmed, disputed, or stale. It MUST
 *                         NEVER be rendered as a stated fact anywhere on this
 *                         site — not in copy, not in schema markup, not in a
 *                         table, not in a meta description.
 *
 * Rendering rule (non-negotiable): read pending values ONLY through
 * `verifiedValue()` / the <VerifiedFact /> component, which substitute a
 * neutral placeholder or omit the row entirely. Publishing a wrong school zone,
 * tax rate, or MUD assessment is worse than publishing nothing — accuracy is
 * this site's entire competitive position.
 *
 * EDITING THIS FILE:
 *   Flip a `status` to 'verified' ONLY when you have BOTH:
 *     1. `source`     — a real URL or a named authority (e.g. 'Bexar CAD',
 *                       'Northside ISD', 'D.R. Horton'), and
 *     2. `verifiedOn` — the ISO date (YYYY-MM-DD) you actually checked it.
 *   Never verify from memory, from a competitor's site, or from a listing
 *   aggregator. Re-verify anything older than ~90 days before relying on it.
 */

export type VerificationStatus = "verified" | "pending";

export type Verified<T> = {
  value: T;
  status: VerificationStatus;
  /** URL or authority name backing a verified value. Required to verify. */
  source?: string;
  /** ISO date (YYYY-MM-DD) the value was checked. Required to verify. */
  verifiedOn?: string;
  /** Optional note explaining why something is still pending. */
  note?: string;
};

/** Default neutral copy shown in place of any pending fact. */
export const PENDING_PLACEHOLDER = "Confirming current figures — ask me directly";

/** Type guard: true only when the fact may be published as stated fact. */
export function isVerified<T>(fact: Verified<T> | undefined | null): fact is Verified<T> {
  return !!fact && fact.status === "verified" && fact.value !== undefined && fact.value !== null;
}

/**
 * Safe read. Returns the value only when verified; otherwise `undefined`.
 * Use this any time you need the raw value (schema markup, calculations).
 */
export function verifiedValue<T>(fact: Verified<T> | undefined | null): T | undefined {
  return isVerified(fact) ? fact.value : undefined;
}

/** Convenience constructors so records stay readable. */
export function verified<T>(value: T, source: string, verifiedOn: string): Verified<T> {
  return { value, status: "verified", source, verifiedOn };
}

export function pending<T>(note: string, value?: T): Verified<T | undefined> {
  return { value, status: "pending", note };
}

/* ── Domain types ─────────────────────────────────────────────────────────── */

export type School = {
  name: string;
  level: "Elementary" | "Middle" | "High";
  /** Distance from the community in miles. */
  distanceMiles: number;
};

export type SchoolDistrictPath = {
  district: string;
  /** Authoritative boundary-lookup URL for the district. */
  boundaryLookupUrl: string;
  schools: School[];
};

export type DriveTime = {
  destination: string;
  offPeakMinutes?: number;
  peakMinutes?: number;
};

export type Community = {
  slug: Verified<string>;
  name: Verified<string>;
  builder: Verified<string>;
  salesOfficeAddress: Verified<string>;
  area: Verified<string>;
  zip: Verified<string>;
  startingPrice: Verified<number>;
  sqftMin: Verified<number>;
  sqftMax: Verified<number>;
  bedsMin: Verified<number>;
  bedsMax: Verified<number>;
  bathsMin: Verified<number>;
  bathsMax: Verified<number>;
  floorPlanCount: Verified<number>;
  homesAvailable: Verified<number>;
  amenities: Verified<string[]>;
  heroImage: Verified<string>;
  schoolDistricts: Verified<string[]>;
  schoolPaths: Verified<SchoolDistrictPath[]>;
  /* Pending-by-default facts */
  taxRate: Verified<number | undefined>;
  mudOrPidAssessment: Verified<string | undefined>;
  hoaMonthlyDues: Verified<number | undefined>;
  lotLevelSchoolBoundary: Verified<string | undefined>;
  driveTimes: Verified<DriveTime[] | undefined>;
};

/* ── Records ──────────────────────────────────────────────────────────────── */

const DRH = "D.R. Horton";
const DRH_DATE = "2026-08-07";

export const REDBIRD_RANCH: Community = {
  slug: verified("redbird-ranch", DRH, DRH_DATE),
  name: verified("Redbird Ranch", DRH, DRH_DATE),
  builder: verified(DRH, DRH, DRH_DATE),
  salesOfficeAddress: verified("15134 Pinyon Jay, San Antonio, TX 78253", DRH, DRH_DATE),
  area: verified("Far west side, Potranco Road corridor, west of Loop 1604", DRH, DRH_DATE),
  zip: verified("78253", DRH, DRH_DATE),
  startingPrice: verified(227000, DRH, DRH_DATE),
  sqftMin: verified(1156, DRH, DRH_DATE),
  sqftMax: verified(2677, DRH, DRH_DATE),
  bedsMin: verified(3, DRH, DRH_DATE),
  bedsMax: verified(5, DRH, DRH_DATE),
  bathsMin: verified(2, DRH, DRH_DATE),
  bathsMax: verified(3.5, DRH, DRH_DATE),
  floorPlanCount: verified(40, DRH, DRH_DATE),
  homesAvailable: verified(81, DRH, DRH_DATE),
  amenities: verified(
    [
      "Multiple pools and splash pads",
      "Basketball courts",
      "Tennis courts",
      "Parks and playgrounds",
      "Walking trails",
      "On-site lifestyle director",
      "Third amenity center under construction (pickleball, water slides, fitness center)",
    ],
    DRH,
    DRH_DATE,
  ),
  heroImage: verified("/communities/redbird-ranch.jpg", DRH, DRH_DATE),

  // Redbird Ranch is SPLIT between two school districts. Which district a given
  // lot falls in is address-by-address — see `lotLevelSchoolBoundary` (pending).
  schoolDistricts: verified(["Northside ISD", "Medina Valley ISD"], DRH, DRH_DATE),
  schoolPaths: verified(
    [
      {
        district: "Northside ISD",
        boundaryLookupUrl: "https://www.nisdtx.org/departments/facilities/attendance-boundaries",
        schools: [
          { name: "Boldt Elementary", level: "Elementary", distanceMiles: 0.1 },
          { name: "Bernal Middle School", level: "Middle", distanceMiles: 1.6 },
          { name: "Harlan High School", level: "High", distanceMiles: 5.6 },
        ],
      },
      {
        district: "Medina Valley ISD",
        boundaryLookupUrl: "https://www.mvisd.com/Page/2838",
        schools: [
          { name: "Potranco Elementary", level: "Elementary", distanceMiles: 4.0 },
          { name: "Loma Alta Middle School", level: "Middle", distanceMiles: 3.9 },
          { name: "Medina Valley High School", level: "High", distanceMiles: 11.2 },
        ],
      },
    ],
    DRH,
    DRH_DATE,
  ),

  /* ── PENDING — do not publish as fact until verified ── */
  taxRate: pending<number>(
    "Needs Bexar CAD confirmation, plus Medina CAD if any section falls in Medina County.",
  ),
  mudOrPidAssessment: pending<string>("Public sources conflict on MUD/PID status and amount."),
  hoaMonthlyDues: pending<number>("Needs confirmation directly from the HOA."),
  lotLevelSchoolBoundary: pending<string>(
    "Community is split between Northside ISD and Medina Valley ISD; requires address-by-address confirmation from both districts.",
  ),
  driveTimes: pending<DriveTime[]>(
    "Drive times to JBSA-Lackland, JBSA-Fort Sam Houston, JBSA-Randolph and SAT airport need real peak and off-peak measurement.",
  ),
};

export const COMMUNITIES: Community[] = [REDBIRD_RANCH];

export function getCommunityBySlug(slug: string): Community | undefined {
  return COMMUNITIES.find((c) => c.slug.value === slug);
}
