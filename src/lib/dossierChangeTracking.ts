/**
 * Stamps `createdAt` / `updatedAt` on each property and `lastUpdatedAt` on the
 * dossier so the client portal can highlight what's new since the user's last
 * visit. Pure function — call right before persisting `dossier_data`.
 */

type Prop = Record<string, unknown> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DossierLike = {
  tabs?: { key: string }[];
  properties?: Record<string, Prop[]>;
  lastUpdatedAt?: string;
  [k: string]: unknown;
};

// Fields whose changes should bump `updatedAt`. Excludes our own stamps.
const TRACKED_FIELDS = [
  "address", "city", "community", "area", "builder", "price", "beds", "baths",
  "sqft", "stories", "garages", "status", "plan", "type", "notes", "sourceUrl",
  "rentEst", "rentNote", "yieldEst", "expenses",
];

function propChanged(prev: Prop, next: Prop): boolean {
  for (const f of TRACKED_FIELDS) {
    if (JSON.stringify(prev[f] ?? null) !== JSON.stringify(next[f] ?? null)) {
      return true;
    }
  }
  return false;
}

export function stampDossierChanges<T extends DossierLike>(
  prev: DossierLike | null | undefined,
  next: T,
): T {
  const now = new Date().toISOString();
  const prevById = new Map<string, Prop>();
  if (prev?.properties) {
    Object.values(prev.properties).forEach(arr => {
      (arr || []).forEach(p => { if (p?.id) prevById.set(p.id, p); });
    });
  }

  let anyChange = false;
  const nextProperties: Record<string, Prop[]> = {};
  for (const [tabKey, arr] of Object.entries(next.properties || {})) {
    nextProperties[tabKey] = (arr || []).map(p => {
      if (!p?.id) return p;
      const previous = prevById.get(p.id);
      if (!previous) {
        anyChange = true;
        return { ...p, createdAt: p.createdAt || now, updatedAt: now };
      }
      // Strip prior stamps for comparison
      const { createdAt: _c, updatedAt: _u, ...nextRest } = p;
      const { createdAt: _pc, updatedAt: _pu, ...prevRest } = previous;
      if (propChanged(prevRest as Prop, nextRest as Prop)) {
        anyChange = true;
        return { ...p, createdAt: previous.createdAt || p.createdAt || now, updatedAt: now };
      }
      // Preserve previous stamps if caller didn't set them
      return {
        ...p,
        createdAt: p.createdAt || previous.createdAt,
        updatedAt: p.updatedAt || previous.updatedAt,
      };
    });
  }

  return {
    ...next,
    properties: nextProperties,
    lastUpdatedAt: anyChange ? now : (next.lastUpdatedAt || prev?.lastUpdatedAt),
  };
}
