import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface CmaSubject {
  address: string;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  yearBuilt?: number | null;
  lotSize?: string | null;
  builder?: string | null;
  condition?: string | null;
}

export interface CmaComp {
  address: string;
  salePrice: number;
  sqft?: number | null;
  beds?: number | null;
  baths?: number | null;
  saleDate?: string | null;
  distanceMiles?: number | null;
  condition?: string | null;
  adjustment?: number | null;
  notes?: string | null;
  sourceUrl?: string | null;
  yearBuilt?: number | null;
  builder?: string | null;
  priorOwners?: number | null;
  listingAgent?: string | null;
  listingBroker?: string | null;
  everRented?: "yes" | "no" | "unknown" | null;
  insuranceClaims?: string | null;
}


export interface CmaResult {
  executiveSummary?: string;
  narrative?: string;
  valueLow?: number;
  valueRecommended?: number;
  valueHigh?: number;
  ppsfLow?: number;
  ppsfRecommended?: number;
  ppsfHigh?: number;
  compAnalysis?: { address: string; adjustedValue: number; rationale: string }[];
}

const GOLD = rgb(0.73, 0.58, 0.34);
const CHARCOAL = rgb(0.18, 0.18, 0.18);
const MUTED = rgb(0.45, 0.45, 0.45);
const LINE = rgb(0.87, 0.84, 0.78);
const CREAM = rgb(0.992, 0.98, 0.953);

const fmt$ = (n?: number | null) =>
  n == null ? "—" : "$" + Math.round(n).toLocaleString("en-US");
const fmtNum = (n?: number | null, d = 0) =>
  n == null ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: d });

export async function buildCmaPdf(
  subject: CmaSubject,
  comps: CmaComp[],
  result: CmaResult,
  notes?: string | null,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 612;
  const H = 792;
  const margin = 54;
  let page = pdf.addPage([W, H]);
  let y = H - margin;

  const newPage = () => {
    page = pdf.addPage([W, H]);
    y = H - margin;
    drawHeaderBand();
  };

  const drawHeaderBand = () => {
    page.drawRectangle({ x: 0, y: H - 32, width: W, height: 32, color: CREAM });
    page.drawText("Alamo City CMA  ·  Emily Russell, REALTOR®", {
      x: margin,
      y: H - 21,
      size: 9,
      font: sans,
      color: MUTED,
    });
    y = H - 56;
  };

  const wrap = (text: string, font: any, size: number, maxWidth: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (cur) lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const drawText = (text: string, opts: { font?: any; size?: number; color?: any; gap?: number } = {}) => {
    const font = opts.font || serif;
    const size = opts.size || 11;
    const color = opts.color || CHARCOAL;
    const lines = wrap(text, font, size, W - margin * 2);
    for (const ln of lines) {
      if (y < margin + 40) newPage();
      page.drawText(ln, { x: margin, y, size, font, color });
      y -= size * 1.35;
    }
    y -= opts.gap ?? 4;
  };

  const heading = (text: string, size = 18) => {
    if (y < margin + 80) newPage();
    page.drawText(text, { x: margin, y, size, font: serifBold, color: CHARCOAL });
    y -= size + 4;
    page.drawLine({
      start: { x: margin, y: y + 2 },
      end: { x: margin + 50, y: y + 2 },
      thickness: 1.5,
      color: GOLD,
    });
    y -= 14;
  };

  const subheading = (text: string) => {
    if (y < margin + 60) newPage();
    page.drawText(text.toUpperCase(), {
      x: margin,
      y,
      size: 9,
      font: sansBold,
      color: GOLD,
    });
    y -= 16;
  };

  drawHeaderBand();

  // Title block
  page.drawText("Comparative Market Analysis", {
    x: margin,
    y,
    size: 24,
    font: serifBold,
    color: CHARCOAL,
  });
  y -= 30;
  page.drawText(subject.address, { x: margin, y, size: 14, font: serif, color: MUTED });
  y -= 18;
  page.drawText(`Prepared ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, {
    x: margin,
    y,
    size: 10,
    font: sans,
    color: MUTED,
  });
  y -= 28;

  // Value range box
  const boxH = 80;
  page.drawRectangle({
    x: margin,
    y: y - boxH,
    width: W - margin * 2,
    height: boxH,
    color: CREAM,
    borderColor: LINE,
    borderWidth: 1,
  });
  const colW = (W - margin * 2) / 3;
  const labels = ["Low", "Recommended", "High"];
  const vals = [result.valueLow, result.valueRecommended, result.valueHigh];
  const ppsf = [result.ppsfLow, result.ppsfRecommended, result.ppsfHigh];
  for (let i = 0; i < 3; i++) {
    const cx = margin + colW * i + colW / 2;
    page.drawText(labels[i].toUpperCase(), {
      x: cx - sans.widthOfTextAtSize(labels[i].toUpperCase(), 8) / 2,
      y: y - 16,
      size: 8,
      font: sansBold,
      color: i === 1 ? GOLD : MUTED,
    });
    const valStr = fmt$(vals[i]);
    page.drawText(valStr, {
      x: cx - serifBold.widthOfTextAtSize(valStr, 20) / 2,
      y: y - 44,
      size: 20,
      font: serifBold,
      color: i === 1 ? GOLD : CHARCOAL,
    });
    const ppsfStr = ppsf[i] != null ? `$${fmtNum(ppsf[i], 0)} / sqft` : "";
    page.drawText(ppsfStr, {
      x: cx - sans.widthOfTextAtSize(ppsfStr, 9) / 2,
      y: y - 62,
      size: 9,
      font: sans,
      color: MUTED,
    });
  }
  y -= boxH + 20;

  // Executive summary
  if (result.executiveSummary) {
    subheading("Executive Summary");
    drawText(result.executiveSummary, { size: 11, gap: 10 });
  }

  // Subject details
  subheading("Subject Property");
  const subjLine = [
    subject.beds != null ? `${subject.beds} bd` : null,
    subject.baths != null ? `${subject.baths} ba` : null,
    subject.sqft != null ? `${fmtNum(subject.sqft)} sqft` : null,
    subject.yearBuilt ? `Built ${subject.yearBuilt}` : null,
    subject.lotSize ? `Lot ${subject.lotSize}` : null,
  ].filter(Boolean).join("  ·  ");
  if (subjLine) drawText(subjLine, { font: sans, size: 10, color: MUTED });
  if (subject.condition) drawText(`Condition: ${subject.condition}`, { font: sans, size: 10, color: MUTED, gap: 8 });

  // Narrative
  if (result.narrative) {
    subheading("Market Analysis");
    const paras = result.narrative.split(/\n\n+/);
    for (const p of paras) drawText(p, { size: 11, gap: 8 });
  }

  // Comps table
  subheading("Comparable Sales");
  const headers = ["Address", "Sale", "Sqft", "Bd/Ba", "$/sqft"];
  const colWidths = [220, 78, 50, 50, 70];
  let x = margin;
  for (let i = 0; i < headers.length; i++) {
    page.drawText(headers[i], { x, y, size: 8, font: sansBold, color: MUTED });
    x += colWidths[i];
  }
  y -= 4;
  page.drawLine({
    start: { x: margin, y },
    end: { x: W - margin, y },
    thickness: 0.5,
    color: LINE,
  });
  y -= 12;

  for (const c of comps) {
    if (y < margin + 30) newPage();
    let cx = margin;
    const pps = c.salePrice && c.sqft ? c.salePrice / c.sqft : null;
    const cells = [
      c.address,
      fmt$(c.salePrice),
      c.sqft ? fmtNum(c.sqft) : "—",
      `${c.beds ?? "—"}/${c.baths ?? "—"}`,
      pps ? `$${fmtNum(pps, 0)}` : "—",
    ];
    for (let i = 0; i < cells.length; i++) {
      const maxW = colWidths[i] - 6;
      let txt = cells[i];
      while (serif.widthOfTextAtSize(txt, 10) > maxW && txt.length > 4) {
        txt = txt.slice(0, -1);
      }
      page.drawText(txt, { x: cx, y, size: 10, font: i === 0 ? serif : sans, color: CHARCOAL });
      cx += colWidths[i];
    }
    y -= 14;

    // Provenance & History sub-block (only fields with values)
    const provLine1Parts: string[] = [];
    if (c.yearBuilt) provLine1Parts.push(`Built ${c.yearBuilt}`);
    if (c.builder) provLine1Parts.push(c.builder);
    if (c.priorOwners != null) provLine1Parts.push(`${c.priorOwners} prior owner${c.priorOwners === 1 ? "" : "s"}`);
    const listingParts: string[] = [];
    if (c.listingAgent) listingParts.push(c.listingAgent);
    if (c.listingBroker) listingParts.push(`(${c.listingBroker})`);
    const extras: string[] = [];
    if (provLine1Parts.length) extras.push(provLine1Parts.join(" · "));
    if (listingParts.length) extras.push(`Listed by: ${listingParts.join(" ")}`);
    if (c.everRented && c.everRented !== "unknown") {
      extras.push(`Rental history: ${c.everRented === "yes" ? "Yes" : "No"}`);
    }
    if (c.insuranceClaims && c.insuranceClaims.trim()) {
      extras.push(`Claims: ${c.insuranceClaims.trim()}`);
    }
    for (const line of extras) {
      if (y < margin + 20) newPage();
      let txt = line;
      const maxW = W - margin * 2;
      while (sans.widthOfTextAtSize(txt, 8.5) > maxW && txt.length > 8) {
        txt = txt.slice(0, -1);
      }
      page.drawText(txt, { x: margin + 8, y, size: 8.5, font: sans, color: MUTED });
      y -= 11;
    }
    if (extras.length) y -= 2;
    else y -= 2;
  }
  y -= 10;

  // Comp analysis rationale
  if (result.compAnalysis?.length) {
    subheading("Comp-by-Comp Adjustments");
    for (const ca of result.compAnalysis) {
      if (y < margin + 60) newPage();
      page.drawText(`${ca.address} — adjusted to ${fmt$(ca.adjustedValue)}`, {
        x: margin,
        y,
        size: 10,
        font: sansBold,
        color: CHARCOAL,
      });
      y -= 14;
      drawText(ca.rationale, { size: 10, gap: 8 });
    }
  }

  if (notes) {
    subheading("Agent Notes");
    drawText(notes, { size: 10, gap: 8 });
  }

  // Footer on each page
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(
      `Emily Russell, REALTOR® · TREC #791742 · Fathom Realty · alamocitydesigns.com · Page ${i + 1} of ${pages.length}`,
      { x: margin, y: 24, size: 7.5, font: sans, color: MUTED },
    );
    p.drawText(
      "This CMA is an opinion of value based on comparable sales data and is not an appraisal.",
      { x: margin, y: 14, size: 7, font: sans, color: MUTED },
    );
  });

  return await pdf.save();
}
