const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      clientName = "",
      clientAddress = "",
      clientCityStateZip = "",
      clientPhone = "",
      clientEmail = "",
      marketArea = "",
      termStart = "",
      termEnd = "",
      brokerFeePct = "3.0",
      signatureData = null,
      broker = {},
      secondClient = null,
      clientInitials = "",
      client2Initials = "",
    } = body;

    // Fetch blank PDF template from storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const { data: fileData, error: dlError } = await sb.storage
      .from("agreement-templates")
      .download("TXR-1501-blank.pdf");

    if (dlError || !fileData) {
      return new Response(
        JSON.stringify({ error: "Could not load PDF template" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const templateBytes = await fileData.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const PAGE_H = 792;

    // Helper: pdfplumber top → pdf-lib y (bottom-left origin)
    const y = (top: number) => PAGE_H - top;

    const fontSize = 15;
    const smallSize = 12;
    const color = rgb(0.05, 0.05, 0.35); // dark navy for filled text

    // ─── PAGE 1 ───
    const p1 = pages[0];

    // Client name (top=169.8)
    p1.drawText(clientName, { x: 108, y: y(169.8 + 10), font, size: fontSize, color });

    // Client address (top=195.1)
    p1.drawText(clientAddress, { x: 144, y: y(195.1 + 10), font, size: fontSize, color });

    // Client city/state/zip (top=207.7)
    p1.drawText(clientCityStateZip, { x: 180, y: y(207.7 + 10), font, size: fontSize, color });

    // Client phone (top=220.4)
    p1.drawText(clientPhone, { x: 144, y: y(220.4 + 10), font, size: fontSize, color });

    // Client email (top=233.0)
    p1.drawText(clientEmail, { x: 144, y: y(233.0 + 10), font, size: fontSize, color });

    // Broker name (top=251.4)
    p1.drawText(broker.name || "Fathom Realty", { x: 108, y: y(251.4 + 10), font, size: fontSize, color });

    // Broker associate (second line top=264.1) — no prefix, form already labels this
    p1.drawText(broker.associate || "Emily Russell", { x: 108, y: y(264.1 + 10), font, size: smallSize, color });

    // Broker address (top=276.7)
    p1.drawText(broker.address || "Virtual Office — San Antonio, TX", { x: 144, y: y(276.7 + 10), font, size: fontSize, color });

    // Broker phone (top=302.0)
    p1.drawText(broker.phone || "(210) 912-0806", { x: 144, y: y(302.0 + 10), font, size: fontSize, color });

    // Broker email (top=314.6)
    p1.drawText(broker.email || "emily@streamwalkers.com", { x: 144, y: y(314.6 + 10), font, size: fontSize, color });

    // Market Area — Section 3C (top=472.1)
    p1.drawText(marketArea, { x: 95, y: y(472.1 + 10), font, size: fontSize, color });

    // Term — Section 4 (top=626.3)
    p1.drawText(termStart, { x: 252, y: y(626.3 + 10), font, size: fontSize, color });
    p1.drawText(termEnd, { x: 468, y: y(626.3 + 10), font, size: fontSize, color });

    // Client name at top of page 2 header (x=252)
    const p2 = pages[1];
    p2.drawText(clientName, { x: 252, y: y(34.4 + 12), font, size: 12, color });

    // ─── PAGE 2 — Broker fee (Section 7A, Purchases) ───
    p2.drawText(brokerFeePct, { x: 162, y: y(220.4 + 10), font: fontBold, size: fontSize, color });

    // Fill client name on header of pages 3-6
    for (let i = 2; i < pages.length; i++) {
      pages[i].drawText(clientName, { x: 252, y: y(34.4 + 12), font, size: 12, color });
    }

    // Stamp initials on pages 1-5 (indices 0-4) footer
    const brokerInitials = (broker.associate || "Emily Russell").split(" ").map((n: string) => n[0]).join("");
    for (let i = 0; i < Math.min(5, pages.length); i++) {
      const pg = pages[i];
      if (brokerInitials) {
        pg.drawText(brokerInitials, { x: 340, y: y(738), font: fontBold, size: smallSize, color });
      }
      if (clientInitials) {
        pg.drawText(clientInitials, { x: 445, y: y(738), font: fontBold, size: smallSize, color });
      }
      if (client2Initials) {
        pg.drawText(client2Initials, { x: 508, y: y(738), font: fontBold, size: smallSize, color });
      }
    }

    // ─── PAGE 6 — Signature block ───
    const p6 = pages[5];

    // Broker's Printed Name (above the label line)
    p6.drawText(broker.associate || "Emily Russell", { x: 36, y: y(230), font, size: fontSize, color });
    // License No
    p6.drawText(broker.license || "791742", { x: 252, y: y(230), font, size: fontSize, color });

    // Client's Printed Name
    p6.drawText(clientName, { x: 324, y: y(230), font, size: fontSize, color });

    // Dates — above the "Date" label line
    const signedDate = new Date().toLocaleDateString("en-US");
    p6.drawText(signedDate, { x: 252, y: y(254), font, size: smallSize, color });
    p6.drawText(signedDate, { x: 540, y: y(254), font, size: smallSize, color });

    // Embed client signature image
    if (signatureData) {
      try {
        const sigBytes = base64ToUint8Array(signatureData);
        const sigImage = await pdfDoc.embedPng(sigBytes);
        const sigDims = sigImage.scale(0.3);
        p6.drawImage(sigImage, {
          x: 360,
          y: y(260),
          width: Math.min(sigDims.width, 160),
          height: Math.min(sigDims.height, 40),
        });
      } catch (_e) {
        // signature embed failed, continue without
      }
    }

    // Broker's Associate printed name (above the label at top=307)
    p6.drawText(`${broker.associate || "Emily Russell"}, License #${broker.license || "791742"}`, {
      x: 36, y: y(294), font, size: smallSize, color,
    });

    // Second client if present
    if (secondClient?.name) {
      p6.drawText(secondClient.name, { x: 324, y: y(294), font, size: fontSize, color });

      if (secondClient.signatureData) {
        try {
          const sig2Bytes = base64ToUint8Array(secondClient.signatureData);
          const sig2Image = await pdfDoc.embedPng(sig2Bytes);
          p6.drawImage(sig2Image, {
            x: 360,
            y: y(342),
            width: 160,
            height: 40,
          });
        } catch (_e) { /* */ }
      }
      p6.drawText(signedDate, { x: 540, y: y(336), font, size: smallSize, color });
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="TXR-1501-Signed.pdf"`,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function base64ToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}
