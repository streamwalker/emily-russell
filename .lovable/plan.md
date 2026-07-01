## Rename uploaded property media using the home's address

### Goal
When a photo or video is uploaded to a property in a client dossier, name the stored file with the property's address as the root (e.g. `106-sam-plover-dr-photo-01.jpg`) instead of the current opaque UUID filename. This applies to both the storage path and the filename the browser uses on download / "Open in new tab".

### Current behavior
In `src/components/portal/PropertyMediaGallery.tsx`, `handleFiles` writes to:
```
${ownerUserId}/property-media/${propertyId}/${crypto.randomUUID()}.${ext}
```
Nothing in that path references the address, so downloads land as `a3f9…e2.mov`.

### Proposed changes (frontend only)

1. **Accept the address as a prop.** Add `propertyAddress?: string` to `PropertyMediaGallery`'s `Props`. Pass it in from `ClientDossierView.tsx` at every `<PropertyMediaGallery … />` call site using the property's existing `address` field (fall back to `"property"` if blank).

2. **Slugify helper.** Add a small local `slugifyAddress(addr)` that lowercases, strips punctuation, collapses whitespace to `-`, and truncates to ~60 chars. Example: `"106 Sam Plover Dr, San Antonio, TX"` → `106-sam-plover-dr-san-antonio-tx`.

3. **Build a friendly base name in `handleFiles`.** For each file:
   - `const base = slugifyAddress(propertyAddress ?? "property");`
   - Compute a per-upload index by counting existing items of the same `kind` plus the position of the current file in the batch, zero-padded (`01`, `02`…).
   - New storage path:
     ```
     ${ownerUserId}/property-media/${propertyId}/${base}-${kind}-${seq}-${shortId}.${ext}
     ```
     Keep a short `crypto.randomUUID().slice(0,8)` suffix so re-uploads of the same file name never collide and RLS/folder scoping stays intact.

4. **Preserve download filename.** When calling `supabase.storage.from("dossier-documents").upload(path, file, …)`, also pass:
   ```ts
   { contentType: file.type, upsert: false,
     metadata: { originalName: file.name },
     // Supabase JS forwards this to storage:
     cacheControl: "3600" }
   ```
   And when creating signed URLs for the "Open in new tab" / Download buttons in `VideoPlayer` and the image/video anchors, use:
   ```ts
   supabase.storage.from("dossier-documents").createSignedUrl(path, 3600, {
     download: `${base}-${kind}-${seq}${extDot}`
   });
   ```
   This makes the browser save the file as `106-sam-plover-dr-photo-03.jpg` regardless of the internal storage key.

5. **No migration of existing files.** Old rows keep their UUID paths; only new uploads get the address-based name. This avoids storage rewrites and keeps existing signed URLs valid. If we later want to backfill, that's a separate task.

6. **No schema changes.** `property_media.storage_path` already stores whatever we upload; no new columns needed.

### Files touched
- `src/components/portal/PropertyMediaGallery.tsx` — add prop, slugify, new path builder, `download` option on signed URLs.
- `src/components/portal/ClientDossierView.tsx` — pass `propertyAddress={prop.address}` at each usage.

### Verification
- Upload a photo to "106 Sam Plover Dr" → new row's `storage_path` ends with `106-sam-plover-dr-photo-01-XXXXXXXX.jpg`.
- Click Download in the lightbox → file saves as `106-sam-plover-dr-photo-01.jpg`.
- Upload a `.mov` → fallback panel's Open/Download buttons yield `106-sam-plover-dr-video-01.mov`.
- Existing UUID-named files still load and display.
- Properties with no address yet fall back to `property-photo-01-XXXXXXXX.jpg` and don't crash.
