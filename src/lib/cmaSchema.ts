import type { CmaSubject, CmaComp } from "./cmaPdf";

/**
 * Bump this whenever the CMA data shape changes. Older reports loaded from the
 * database are passed through `migrateCmaData` so any newly-added fields are
 * back-filled with safe defaults — without ever dropping fields the user
 * already saved (subjectSources, per-comp sourceUrl, etc.).
 *
 * History:
 *   1 — initial shape (address/beds/baths/sqft/etc.)
 *   2 — added comp fields: yearBuilt, builder, priorOwners, listingAgent,
 *       listingBroker, everRented, insuranceClaims; explicit subjectSources
 *       and comp.sourceUrl preservation.
 */
export const CMA_SCHEMA_VERSION = 2;

export type CmaSubjectV2 = CmaSubject & { _schemaVersion?: number };

const SUBJECT_DEFAULTS: CmaSubject = {
  address: "",
  beds: null,
  baths: null,
  sqft: null,
  yearBuilt: null,
  lotSize: "",
  builder: "",
  condition: "",
};

const COMP_DEFAULTS: CmaComp = {
  address: "",
  salePrice: 0,
  sqft: null,
  beds: null,
  baths: null,
  saleDate: "",
  distanceMiles: null,
  condition: "",
  adjustment: null,
  notes: "",
  sourceUrl: null,
  yearBuilt: null,
  builder: "",
  priorOwners: null,
  listingAgent: "",
  listingBroker: "",
  everRented: "unknown",
  insuranceClaims: "",
};

export function migrateSubject(raw: Partial<CmaSubject> | null | undefined): CmaSubjectV2 {
  const base = { ...SUBJECT_DEFAULTS, ...(raw || {}) } as CmaSubjectV2;
  base._schemaVersion = CMA_SCHEMA_VERSION;
  return base;
}

export function migrateComp(raw: Partial<CmaComp> | null | undefined): CmaComp {
  // Merge defaults under the saved values so previously-set fields
  // (sourceUrl, notes, adjustments) are always preserved.
  return { ...COMP_DEFAULTS, ...(raw || {}) };
}

export function migrateComps(raw: Partial<CmaComp>[] | null | undefined): CmaComp[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map(migrateComp);
}

export function migrateSubjectSources(
  raw: Record<string, unknown> | null | undefined,
): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" && v.trim()) out[k] = v;
  }
  return out;
}
