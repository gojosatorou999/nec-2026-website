import { PDFDocument } from "pdfkit";
import { fileURLToPath } from "node:url";
import { submissionSections, isUpload } from "../shared/submissions.js";
const regular = fileURLToPath(
  new URL("./fonts/DejaVuSans.ttf", import.meta.url),
);
const bold = fileURLToPath(
  new URL("./fonts/DejaVuSans-Bold.ttf", import.meta.url),
);
export function submissionPdf(record, kind = "Application") {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 48, left: 48, right: 48, bottom: 76 },
      bufferPages: true,
      info: {
        Title: kind + " - " + (record.name || record.id),
        Author: "MGIT Startup & Innovation Expo",
      },
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("Body", regular).registerFont("Heading", bold);
    const width = doc.page.width - 96;
    const ensureSpace = (height) => {
      if (doc.y + height > doc.page.height - 70) doc.addPage();
    };
    doc
      .font("Heading")
      .fontSize(10)
      .fillColor("#39759a")
      .text("MGIT STARTUP & INNOVATION EXPO");
    doc
      .moveDown()
      .fontSize(23)
      .fillColor("#142135")
      .text(record.name || kind, { width });
    doc
      .moveDown(0.4)
      .font("Body")
      .fontSize(11)
      .fillColor("#506176")
      .text(kind + " | " + record.id);
    doc.moveDown();
    if (
      isUpload(record.logo) &&
      /^data:image\/(png|jpeg);/.test(record.logo.data)
    ) {
      try {
        doc.image(record.logo.data, 48, doc.y, { fit: [96, 72] });
        doc.y += 84;
      } catch {
        /* File name remains in the details if image decoding fails. */
      }
    }
    for (const section of submissionSections(record)) {
      ensureSpace(100);
      doc
        .moveDown(0.8)
        .font("Heading")
        .fontSize(14)
        .fillColor("#205a78")
        .text(section.title, { width });
      doc.moveDown(0.6);
      for (const field of section.fields) {
        doc.font("Heading").fontSize(10);
        ensureSpace(doc.heightOfString(field.label, { width }) + 52);
        doc.fillColor("#506176").text(field.label, { width });
        doc
          .moveDown(0.25)
          .font("Body")
          .fontSize(11)
          .fillColor("#142135")
          .text(field.value, { width, lineGap: 3 });
        doc.moveDown(0.8);
      }
    }
    ensureSpace(60);
    doc
      .font("Body")
      .fontSize(9)
      .fillColor("#506176")
      .text(
        "Uploaded files are listed by name. Download originals from the admin review page.",
        { width },
      );
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .font("Body")
        .fontSize(8)
        .fillColor("#607085")
        .text("PRIVATE - ORGANIZER COPY", 48, doc.page.height - 40, {
          lineBreak: false,
        });
      doc.text(
        i + 1 + " / " + pages.count,
        doc.page.width - 88,
        doc.page.height - 40,
        { lineBreak: false },
      );
    }
    doc.end();
  });
}
