import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ParsedFile {
  name: string;
  type: "image" | "document";
  /** base64 data URL — only for images */
  dataUrl?: string;
  /** extracted text — only for documents */
  text?: string;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/bmp"];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });
}

async function parsePdf(file: File): Promise<string | ParsedFile[]> {
  const buffer = await fileToArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  // Try native text extraction first
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    if (text.trim()) pages.push(text);
  }
  const fullText = pages.join("\n\n");

  // Check text quality
  const hasGoodText = fullText.length > 50 && (fullText.match(/[a-zA-Z]/g) || []).length > 30;
  if (hasGoodText) {
    return fullText;
  }

  // Fallback: render pages to images for vision pipeline
  const images: ParsedFile[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push({
      name: `${file.name}_page${i}.jpg`,
      type: "image",
      dataUrl: canvas.toDataURL("image/jpeg", 0.8),
    });
  }
  return images;
}

async function parseDocx(file: File): Promise<string> {
  const buffer = await fileToArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

async function parseXlsx(file: File): Promise<string> {
  const buffer = await fileToArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheets: string[] = [];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) sheets.push(`[Sheet: ${name}]\n${csv}`);
  }
  return sheets.join("\n\n");
}

const DOC_EXTENSIONS: Record<string, (f: File) => Promise<string>> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": parseDocx,
  "application/msword": parseDocx,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": parseXlsx,
  "application/vnd.ms-excel": parseXlsx,
  "text/csv": async (f) => f.text(),
};

function getParserByName(name: string): ((f: File) => Promise<string>) | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "docx" || ext === "doc") return parseDocx;
  if (ext === "xlsx" || ext === "xls") return parseXlsx;
  if (ext === "csv" || ext === "txt") return async (f) => f.text();
  return null;
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export async function parseFiles(files: FileList | File[]): Promise<ParsedFile[]> {
  const results: ParsedFile[] = [];
  for (const file of Array.from(files).slice(0, 10)) {
    if (IMAGE_TYPES.includes(file.type)) {
      const dataUrl = await fileToDataUrl(file);
      results.push({ name: file.name, type: "image", dataUrl });
    } else if (isPdf(file)) {
      try {
        const result = await parsePdf(file);
        if (Array.isArray(result)) {
          // Vision fallback — each page rendered as an image
          results.push(...result);
        } else {
          results.push({ name: file.name, type: "document", text: result });
        }
      } catch (e) {
        console.error(`Failed to parse ${file.name}:`, e);
        results.push({ name: file.name, type: "document", text: `[Failed to parse ${file.name}]` });
      }
    } else {
      const parser = DOC_EXTENSIONS[file.type] || getParserByName(file.name);
      if (parser) {
        try {
          const text = await parser(file);
          results.push({ name: file.name, type: "document", text });
        } catch (e) {
          console.error(`Failed to parse ${file.name}:`, e);
          results.push({ name: file.name, type: "document", text: `[Failed to parse ${file.name}]` });
        }
      }
    }
  }
  return results;
}

export const ACCEPTED_FILE_TYPES = [
  "image/*",
  ".pdf",
  ".doc", ".docx",
  ".xls", ".xlsx",
  ".csv", ".txt",
].join(",");
