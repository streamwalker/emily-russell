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

async function parsePdf(file: File): Promise<string> {
  const buffer = await fileToArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    if (text.trim()) pages.push(text);
  }
  return pages.join("\n\n");
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
  "application/pdf": parsePdf,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": parseDocx,
  "application/msword": parseDocx,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": parseXlsx,
  "application/vnd.ms-excel": parseXlsx,
  "text/csv": async (f) => f.text(),
};

function getParserByName(name: string): ((f: File) => Promise<string>) | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return parsePdf;
  if (ext === "docx" || ext === "doc") return parseDocx;
  if (ext === "xlsx" || ext === "xls") return parseXlsx;
  if (ext === "csv" || ext === "txt") return async (f) => f.text();
  return null;
}

export async function parseFiles(files: FileList | File[]): Promise<ParsedFile[]> {
  const results: ParsedFile[] = [];
  for (const file of Array.from(files).slice(0, 10)) {
    if (IMAGE_TYPES.includes(file.type)) {
      const dataUrl = await fileToDataUrl(file);
      results.push({ name: file.name, type: "image", dataUrl });
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
