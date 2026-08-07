/**
 * BAH (Basic Allowance for Housing) reference figures.
 *
 * These are published rate figures, NOT an entitlement determination.
 *
 * VERIFICATION CONTRACT: this module uses the same `Verified<T>` guardrail as
 * `src/data/communities.ts`. Dollar figures and the year-over-year change note
 * are `pending` until they have been confirmed against the official DoD BAH
 * calculator. While pending, consumers MUST NOT render the numbers as fact —
 * render the honest state (rates went down, entitlement depends on rank,
 * dependent status and duty ZIP) and link to the official calculator instead.
 *
 * UPDATING: BAH is republished annually. Each January, re-check the figures on
 * the official calculator, replace `rows`, bump `asOf`, and only then flip the
 * status to 'verified' with a real source URL and check date.
 */

import { pending, type Verified } from "@/data/communities";

export type BahRow = {
  /** Rank or rank band label, e.g. "E1–E4". */
  rank: string;
  /** Display string — may be a range for banded rows. */
  withDependents: string;
  withoutDependents: string;
};

export type BahTable = {
  /** Duty location the rates apply to. */
  location: string;
  /** Calendar year these rates are published for. */
  asOf: number;
  /** Plain-language note about the year-over-year change. Verified-gated. */
  yoyChangeNote: Verified<string | undefined>;
  /** Attribution line rendered beneath the table. Required. */
  sourceNote: string;
  /** Official verification URL — the actual BAH calculator page. */
  officialCalculatorUrl: string;
  /** Human-readable label for the calculator link. */
  officialCalculatorLabel: string;
  /**
   * Copy shown while figures are pending. MUST NOT assert the direction or size
   * of any year-over-year change — that claim lives in `yoyChangeNote`, which is
   * Verified-gated.
   */
  pendingSummary: string;
  /** Dollar figures. Verified-gated — never render while pending. */
  rows: Verified<BahRow[] | undefined>;

};

const PENDING_NOTE =
  "Figures came from a published JBSA housing source and have not yet been confirmed against the official DoD BAH calculator.";

export const BAH_JBSA: BahTable = {
  location: "Joint Base San Antonio",
  asOf: 2026,
  yoyChangeNote: pending<string>(
    PENDING_NOTE,
    "2026 BAH rates for Joint Base San Antonio decreased about 2.9% from 2025.",
  ),
  sourceNote:
    "BAH figures on this page are not published as fact until they are confirmed against the official DoD BAH calculator. Your entitlement depends on your rank, dependent status, and duty ZIP — check it at the source, or ask me to run your specific number.",
  officialCalculatorUrl: "https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/",
  officialCalculatorLabel: "travel.dod.mil BAH Rate Lookup",
  pendingSummary:
    "2026 BAH rates for Joint Base San Antonio went down compared to 2025, so a figure someone quoted you last year is no longer the figure you'll receive. Exact entitlement depends on your rank, your dependent status, and your duty ZIP — which is why I won't print a table of numbers here that I haven't personally confirmed at the source.",
  rows: pending<BahRow[]>(PENDING_NOTE, [
    { rank: "E1–E4", withDependents: "$1,728", withoutDependents: "$1,359" },
    { rank: "E5", withDependents: "$1,869", withoutDependents: "$1,500" },
    { rank: "E6", withDependents: "$2,094", withoutDependents: "$1,596" },
    { rank: "E7", withDependents: "$2,112", withoutDependents: "$1,731" },
    { rank: "E8", withDependents: "$2,121", withoutDependents: "$1,920" },
    { rank: "E9", withDependents: "$2,157", withoutDependents: "$1,977" },
    { rank: "O1–O7", withDependents: "$1,905 – $2,490", withoutDependents: "$1,584 – $2,112" },
  ]),
};
