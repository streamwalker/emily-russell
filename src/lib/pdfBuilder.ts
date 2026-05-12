import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export type PageSource =
  | { kind: "image"; blob: Blob }
  | { kind: "pdfPage"; pdfBytes: Uint8Array; pageIndex: number };

const LETTER_WIDTH = 612;   // 8.5 inch in pts
const LETTER_HEIGHT = 792;  // 11 inch in pts

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

/** Render a PDF page at moderate scale and return a JPEG blob (used for thumbnails). */
export async function renderPdfPageToImage(pdfBytes: Uint8Array, pageIndex: number, scale = 1.5): Promise<Blob> {
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("thumbnail failed"))), "image/jpeg", 0.7),
  );
}

export async function getPdfPageCount(pdfBytes: Uint8Array): Promise<number> {
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
  return pdf.numPages;
}

/**
 * Build a single PDF from a list of page sources (images or PDF pages).
 * Images are letter-size, centered, fitted while preserving aspect ratio.
 * PDF pages are copied at original size.
 */
export async function buildPdf(pages: PageSource[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();

  for (const src of pages) {
    if (src.kind === "image") {
      const bytes = await blobToBytes(src.blob);
      // Try jpg then png
      let img;
      try {
        img = await out.embedJpg(bytes);
      } catch {
        img = await out.embedPng(bytes);
      }
      const page = out.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
      const margin = 18;
      const maxW = LETTER_WIDTH - margin * 2;
      const maxH = LETTER_HEIGHT - margin * 2;
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      page.drawImage(img, {
        x: (LETTER_WIDTH - w) / 2,
        y: (LETTER_HEIGHT - h) / 2,
        width: w,
        height: h,
      });
    } else {
      const srcDoc = await PDFDocument.load(src.pdfBytes.slice());
      const [copied] = await out.copyPages(srcDoc, [src.pageIndex]);
      out.addPage(copied);
    }
  }

  return await out.save();
}

/**
 * Render a Word document into PDF bytes by extracting text and laying it out.
 * This is a low-fidelity fallback that always works in the browser.
 */
export async function docxToPdfBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  const { value: text } = await mammoth.extractRawText({ arrayBuffer: buffer });
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.TimesRoman);
  const fontBold = await out.embedFont(StandardFonts.TimesRomanBold);
  const margin = 54; // 0.75"
  const lineHeight = 14;
  const fontSize = 11;
  const maxWidth = LETTER_WIDTH - margin * 2;

  const wrapLine = (line: string): string[] => {
    if (!line.trim()) return [""];
    const words = line.split(/\s+/);
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
        if (cur) out.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) out.push(cur);
    return out;
  };

  let page = out.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
  let y = LETTER_HEIGHT - margin;
  // Header: filename
  page.drawText(file.name, { x: margin, y, size: 12, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= lineHeight * 1.5;

  const sourceLines = text.split(/\r?\n/);
  for (const raw of sourceLines) {
    const lines = wrapLine(raw);
    for (const ln of lines) {
      if (y < margin) {
        page = out.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
        y = LETTER_HEIGHT - margin;
      }
      // pdf-lib WinAnsi can't encode every unicode glyph; sanitize to safe range
      const safe = ln.replace(/[^\x20-\x7E]/g, " ");
      page.drawText(safe, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
      y -= lineHeight;
    }
  }

  return await out.save();
}
