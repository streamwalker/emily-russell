## Collision-proof uploads for property media

### Problem
`PropertyMediaGallery.handleFiles` builds each storage path as:
```
{owner}/property-media/{propertyId}/{address-slug}-{kind}-{seq}-{shortId}.{ext}
```
`seq` is derived from `items.filter(kind).length + batch index`. That count is stale in three real scenarios, so two uploads can land on the same `seq`:

1. **Deleted files free up numbers.** If photo `03` is deleted, the next upload reuses `03` — colliding with any historical row that still references that slot (and confusing chronological ordering).
2. **Concurrent uploaders.** Emily and the client both upload at once; both compute `seq = existing + 1` from their own stale `items` snapshot and produce the same `-photo-04-` prefix. The random 8-char `shortId` currently prevents a *storage* overwrite (upsert is off), but the filenames the browser downloads (`{base}-{kind}-{seq}.{ext}` — no shortId) still collide, so "Save as" replaces the earlier file on the user's disk.
3. **Re-uploads after refresh.** `items` may not be fully loaded when the picker fires, so `existingPhotos`/`existingVideos` count as 0 and everything restarts at `01`.

Storage-level collision is soft-guarded by `shortId` + `upsert:false`, but the *download filename* passed to `createSignedUrl(..., { download })` (planned in `plan.md` step 4 and already partially wired in `load()`) does not include `shortId`, so the human-visible filename is not unique.

### Goal
Guarantee that every uploaded file has a unique storage path **and** a unique download filename per property, even across concurrent uploads, deletions, and reloads — without changing the DB schema.

### Changes — frontend only, all inside `src/components/portal/PropertyMediaGallery.tsx`

1. **Compute `seq` from a monotonic high-water mark, not a count.**
   Parse existing `storage_path` values for this property, extract the numeric segment that follows `-{kind}-`, and take `max(seq) + 1` as the starting point for the batch. Deleted rows no longer free up numbers, so historical filenames stay stable and new uploads always advance.

   ```ts
   const seqRe = new RegExp(`-${kind}-(\\d{2,})-`);
   const maxSeq = items
     .filter(i => i.kind === kind)
     .map(i => Number(i.storage_path.match(seqRe)?.[1] ?? 0))
     .reduce((a, b) => Math.max(a, b), 0);
   ```
   Widen padding to `String(n).padStart(3, "0")` so we don't cap at 99.

2. **Refresh the high-water mark right before upload.** Re-query `property_media` for `(dossier_id, property_id)` at the top of `handleFiles` (a single `select('storage_path,kind')`) so concurrent uploads from another session are seen. Compute `maxSeq` from that fresh result, not from the possibly-stale `items` state.

3. **Always include `shortId` in the download filename.** Update every `createSignedUrl(..., { download })` call — in `load()`, in the lightbox "Download" button, and in the `VideoPlayer` fallback — to pass the full unique filename:
   ```ts
   download: `${base}-${kind}-${seq}-${shortId}.${ext}`
   ```
   Simplest implementation: use the last path segment of `storage_path` as the download name (that segment already contains base+kind+seq+shortId+ext), which also makes existing UUID-named rows download with their stored name instead of a fabricated one.

4. **Retry on the rare storage 409.** Wrap the `supabase.storage.upload(...)` call in a small retry (max 3 tries) that regenerates `shortId` and bumps `seq` by 1 whenever the error is a duplicate-key / `409` / "The resource already exists" response. This closes the last-mile race between two tabs picking the same `seq` + `shortId` in the same millisecond.

5. **Preserve address-less fallback.** When `propertyAddress` is empty, keep the existing `"property"` slug; the high-water logic works identically.

### Non-goals
- No schema change (no new column, no migration).
- No backfill of existing rows — legacy UUID filenames keep working via the "use last path segment as download name" rule.
- No change to RLS, buckets, or the storage folder shape.

### Verification
- Upload 3 photos, delete #2, upload 1 more → new file is `-photo-004-…`, not `-photo-002-…`.
- Open two browser tabs, upload simultaneously in both → 6 distinct storage rows, 6 distinct download filenames, no toast errors.
- Reload before thumbnails finish signing, then upload → new file's `seq` is still `max(existing) + 1`.
- Trigger a forced 409 (temporarily hardcode a duplicate `shortId`) → upload succeeds on retry with a new suffix.
- Legacy UUID-named row still downloads under its original UUID filename.
