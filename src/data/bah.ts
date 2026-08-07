/**
 * BAH (Basic Allowance for Housing) reference figures.
 *
 * These are published rate figures, NOT an entitlement determination. Every
 * consumer of this module must render `BAH_JBSA.sourceNote` (or equivalent)
 * directly beneath any table built from `rows`.
 *
 * UPDATING: BAH is republished annually. Bump `asOf`, replace `rows`, and
 * update `yoyChangeNote` each January against the official DoD BAH calculator.
 */

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
  /** Plain-language note about the year-over-year change. */
  yoyChangeNote: string;
  /** Attribution line rendered beneath the table. Required. */
  sourceNote: string;
  /** Official verification URL. */
  officialCalculatorUrl: string;
  rows: BahRow[];
};

export const BAH_JBSA: BahTable = {
  location: "Joint Base San Antonio",
  asOf: 2026,
  yoyChangeNote:
    "2026 BAH rates for Joint Base San Antonio decreased about 2.9% from 2025.",
  sourceNote:
    "Source: published JBSA housing rates. Confirm your exact entitlement against the official DoD BAH calculator at https://www.defensetravel.dod.mil before you budget — your rate depends on rank, dependent status, and duty ZIP.",
  officialCalculatorUrl: "https://www.defensetravel.dod.mil",
  rows: [
    { rank: "E1–E4", withDependents: "$1,728", withoutDependents: "$1,359" },
    { rank: "E5", withDependents: "$1,869", withoutDependents: "$1,500" },
    { rank: "E6", withDependents: "$2,094", withoutDependents: "$1,596" },
    { rank: "E7", withDependents: "$2,112", withoutDependents: "$1,731" },
    { rank: "E8", withDependents: "$2,121", withoutDependents: "$1,920" },
    { rank: "E9", withDependents: "$2,157", withoutDependents: "$1,977" },
    { rank: "O1–O7", withDependents: "$1,905 – $2,490", withoutDependents: "$1,584 – $2,112" },
  ],
};
