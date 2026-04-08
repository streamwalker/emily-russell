

## Fix OSINT Analyst: Add Search Retries, Sibling Inference, and Broader Queries

### Problem
The OSINT Analyst finds "No search results" for all 9 properties because Firecrawl returns empty results for new construction addresses not yet indexed by major listing sites. The function gives up after a single failed search query.

### Solution — Three improvements

**1. Multi-query search strategy** (in `enrich-properties/index.ts`)

Instead of one search query, try up to 3 progressively broader queries before giving up:
- Query 1: `"12334 Winding Oak Ridge" TX property` (quoted address for exact match)
- Query 2: `12334 Winding Oak Ridge Conroe TX` (drop "property listing", add state)
- Query 3: `Tesoro Area Hoffmann new construction TX` (community + builder + "new construction")

Stop as soon as any query returns results.

**2. Sibling property inference** (new pass in `enrich-properties/index.ts`)

Before returning results, add a pass that fills fields from "sibling" properties in the same batch/dossier. For example, if 8 of 9 properties in "Hidden Oasis" community all have `city: "Conroe"`, fill the 9th. Apply to: `city`, `area`, `builder`, `type`, `status`, `stories`, `garages`.

Logic: for each missing field, check if all other properties in the same `community` have the same value for that field. If unanimous, apply it.

**3. Log Firecrawl response status** (debugging aid)

Add `console.log` for Firecrawl HTTP status and response body length so future debugging is easier.

### Files Changed

| File | Changes |
|------|--------|
| `supabase/functions/enrich-properties/index.ts` | Replace `firecrawlSearch` with multi-query retry, add sibling inference pass, improve logging |

### Key Code Changes

```typescript
// Multi-query strategy
function buildSearchQueries(prop: any): string[] {
  const queries: string[] = [];
  // Exact address quoted
  if (prop.address) queries.push(`"${prop.address}" TX property`);
  // Address + city/state
  if (prop.address) queries.push(`${prop.address} ${prop.city || ""} TX`.trim());
  // Community + builder broad search
  const broad = [prop.community, prop.builder, "new construction TX"].filter(Boolean).join(" ");
  if (broad.length > 20) queries.push(broad);
  return queries;
}

// Try queries in order until results found
for (const query of buildSearchQueries(prop)) {
  const results = await firecrawlSearch(query, FIRECRAWL_API_KEY);
  if (results.length > 0) { searchContext = ...; break; }
}
```

```typescript
// Sibling inference after all properties processed
const INFERRABLE = ["city", "area", "builder", "type", "status", "stories", "garages"];
const byCommunity: Record<string, any[]> = {};
for (const prop of properties) {
  if (prop.community) {
    (byCommunity[prop.community] ||= []).push(prop);
  }
}
for (const item of enriched) {
  const prop = properties.find(p => p.id === item.id);
  if (!prop?.community) continue;
  const siblings = byCommunity[prop.community].filter(s => s.id !== prop.id);
  for (const field of INFERRABLE) {
    if (prop[field] && prop[field] !== "" && prop[field] !== 0) continue;
    const vals = siblings.map(s => s[field]).filter(v => v && v !== "" && v !== 0);
    if (vals.length > 0 && vals.every(v => v === vals[0])) {
      item.updates[field] = vals[0];
    }
  }
}
```

### Deployment
Redeploy `enrich-properties` edge function after changes.

