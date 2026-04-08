

## Fix PDF Extraction for Smart Add

### Problem

The client-side PDF parser (`pdfjs-dist`) extracts text natively, but this PDF (and many real-estate PDFs) contains styled/image-based content that yields empty or garbled text. The result: `[Failed to parse streamwalkers_property_portfolio.pdf]` gets sent to the AI, which returns 0 properties.

### Solution

Add a **vision fallback** in `documentParser.ts`: when native PDF text extraction produces poor results (short or empty text), render each PDF page to a canvas image and return those as base64 images instead. The existing vision pipeline in `parse-properties` already handles images via Gemini — so no edge function changes needed.

### Steps

**1. Update `src/lib/documentParser.ts` — enhance `parsePdf`**

- After native text extraction, check quality: if extracted text has fewer than ~50 meaningful characters, treat the PDF as image-based
- When quality is poor, use `pdf.getPage(i)` → render to an off-screen canvas at 150 DPI → convert to base64 JPEG data URL
- Return multiple `ParsedFile` entries: one per page as `type: "image"` with the rendered data URL
- Change `parseFiles` to support a parser returning multiple `ParsedFile` results (currently it expects a single text string)

**2. Update `ParsedFile` type and `parseFiles` function**

- Add a new internal parser return type that can produce either text or an array of images
- When a PDF falls back to image mode, push each page image as a separate `ParsedFile` with `type: "image"` so `getImagesAndText` in AdminDashboard automatically picks them up as vision inputs

### No other files change

The `AdminDashboard.tsx` `getImagesAndText` helper already separates images from documents and sends images to the edge function's vision pipeline. The edge function already sends images to Gemini 2.5 Flash for extraction. This fix is entirely in the document parser.

### Technical Detail

```typescript
// In parsePdf, after native extraction:
const hasGoodText = text.length > 50 && (text.match(/[a-zA-Z]/g) || []).length > 30;
if (!hasGoodText) {
  // Render pages to canvas → base64 JPEG
  const images: ParsedFile[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    images.push({ name: `${fileName}_page${i}.jpg`, type: "image", dataUrl: canvas.toDataURL("image/jpeg", 0.8) });
  }
  return images; // array of image ParsedFiles
}
```

### Files

| File | Action |
|------|--------|
| `src/lib/documentParser.ts` | Add vision fallback for PDFs with poor native text; update `parseFiles` to handle multi-result returns |

