## Fix video playback in the property media gallery

### Root cause
The file you uploaded is a `.mov` (QuickTime container from an iPhone). Chrome, Edge, and Firefox on desktop generally cannot decode `.mov` — even when the MIME type is `video/quicktime`, the `<video>` element loads silently and never plays. Our current lightbox has no error surface, so it just looks broken.

Two things need to change:

1. Make the `<video>` element as compatible and observable as possible.
2. When the browser truly can't play the file, show a clear fallback with an "Open in new tab" / "Download" link so the video is still accessible.

### Changes (frontend only, `src/components/portal/PropertyMediaGallery.tsx`)

- Replace the two bare `<video src=... controls />` tags (in `Lightbox` and `GalleryDialog`) with a small `<VideoPlayer>` component that:
  - Uses `<source src={url} type={mime_type} />` inside `<video>` so the browser can advertise capability.
  - Adds `controls`, `playsInline`, `preload="metadata"`, `controlsList="nodownload"` (still allow right-click), and `crossOrigin="anonymous"` off (signed URLs are same-scheme).
  - Listens for the `error` event and `canPlay` — if the media errors or `canPlayType(mime)` returns `""` for a `.mov`/quicktime, render a fallback panel:
    - "This video format (QuickTime .mov) isn't supported by your browser."
    - Buttons: **Open in new tab** (signed URL, `target="_blank"`) and **Download**.
  - Shows a small filename + type line under the player.

- On upload (`handleFiles`):
  - Keep accepting `.mov` (iPhone reality) but show a one-time `toast.info` when a QuickTime file is uploaded: *"Uploaded. Note: .mov may not preview in all browsers — open in new tab to view."* No transcoding, no server changes.

- On the thumbnail (`strip` and `full` grid) for videos, keep the existing `<Video>` icon tile — no change needed.

### Not changing

- No database changes.
- No storage changes. The signed URL flow (`createSignedUrl`, 1h TTL) is correct and already serves inline.
- No transcoding pipeline (out of scope; would need an edge function + ffmpeg service).

### Verification

- Reload the "106 Sam Plover" property, open the uploaded `.mov`.
- On desktop Chrome: expect the fallback panel with "Open in new tab" that plays the raw file in a new tab (Chrome's built-in QuickTime handler works standalone in many cases, and worst case triggers a download).
- Upload an `.mp4` and confirm it plays inline in the lightbox.
- Confirm the strip thumbnail and delete controls still work.
