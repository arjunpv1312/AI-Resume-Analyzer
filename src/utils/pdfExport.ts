import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { AtsResumeData } from "./docxExport";

/**
 * Generates an ATS-compliant, standard 1-column PDF document
 * with standard 0.5-0.75 in margins, parseable vector text,
 * standard fonts (Helvetica / Helvetica-Bold), and consistent spacing.
 */
export async function generateAtsResumePdfBlob(data: AtsResumeData): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  // Standard US Letter (612 x 792 points)
  const pageWidth = 612;
  const pageHeight = 792;
  const marginX = 40;
  const marginTop = 42;
  const marginBottom = 42;
  const contentWidth = pageWidth - marginX * 2;

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const obliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - marginTop;

  // Helper to check page overflow and add a new page if needed
  const ensureSpace = (requiredHeight: number) => {
    if (currentY - requiredHeight < marginBottom) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - marginTop;
    }
  };

  // Helper to wrap text cleanly
  const wrapText = (text: string, maxWidth: number, font: any, fontSize: number): string[] => {
    const cleanText = text.replace(/[\r\n]+/g, " ").trim();
    if (!cleanText) return [];
    const words = cleanText.split(/\s+/);
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = `${currentLine} ${word}`;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  // Helper to draw horizontal divider
  const drawDivider = () => {
    ensureSpace(12);
    currentPage.drawLine({
      start: { x: marginX, y: currentY },
      end: { x: pageWidth - marginX, y: currentY },
      thickness: 0.75,
      color: rgb(0.75, 0.8, 0.85),
    });
    currentY -= 10;
  };

  // Helper to draw a section header (e.g. "PROFESSIONAL SUMMARY", "WORK EXPERIENCE")
  const drawSectionHeader = (title: string) => {
    ensureSpace(24);
    currentY -= 6;
    currentPage.drawText(title.toUpperCase(), {
      x: marginX,
      y: currentY,
      size: 10.5,
      font: boldFont,
      color: rgb(0.08, 0.12, 0.2),
    });
    currentY -= 4;
    currentPage.drawLine({
      start: { x: marginX, y: currentY },
      end: { x: pageWidth - marginX, y: currentY },
      thickness: 0.6,
      color: rgb(0.8, 0.85, 0.9),
    });
    currentY -= 8;
  };

  // 1. Candidate Name (Centered, Bold, 17pt)
  const nameText = (data.name || "Candidate Name").trim();
  const nameSize = 17;
  const nameWidth = boldFont.widthOfTextAtSize(nameText, nameSize);
  const nameX = Math.max(marginX, (pageWidth - nameWidth) / 2);

  currentPage.drawText(nameText, {
    x: nameX,
    y: currentY,
    size: nameSize,
    font: boldFont,
    color: rgb(0.06, 0.09, 0.16),
  });
  currentY -= 16;

  // 2. Target Title (Centered, 10.5pt)
  if (data.title) {
    const titleText = data.title.trim();
    const titleSize = 10.5;
    const titleWidth = boldFont.widthOfTextAtSize(titleText, titleSize);
    const titleX = Math.max(marginX, (pageWidth - titleWidth) / 2);

    currentPage.drawText(titleText, {
      x: titleX,
      y: currentY,
      size: titleSize,
      font: boldFont,
      color: rgb(0.25, 0.35, 0.48),
    });
    currentY -= 14;
  }

  // 3. Contact Line (Pipe-separated, Centered, 9pt)
  const contactItems: string[] = [];
  if (data.contact?.phone) contactItems.push(data.contact.phone);
  if (data.contact?.email) contactItems.push(data.contact.email);
  if (data.contact?.location) contactItems.push(data.contact.location);
  if (data.contact?.linkedin) contactItems.push(data.contact.linkedin);
  if (data.contact?.portfolio) contactItems.push(data.contact.portfolio);

  if (contactItems.length > 0) {
    const contactLine = contactItems.join("  |  ");
    const contactSize = 9;
    const contactWidth = regularFont.widthOfTextAtSize(contactLine, contactSize);
    const contactX = Math.max(marginX, (pageWidth - contactWidth) / 2);

    currentPage.drawText(contactLine, {
      x: contactX,
      y: currentY,
      size: contactSize,
      font: regularFont,
      color: rgb(0.35, 0.42, 0.52),
    });
    currentY -= 12;
  }

  drawDivider();

  // 4. Professional Summary
  if (data.summary) {
    drawSectionHeader("Professional Summary");
    const summaryLines = wrapText(data.summary, contentWidth, regularFont, 9.5);
    for (const line of summaryLines) {
      ensureSpace(13);
      currentPage.drawText(line, {
        x: marginX,
        y: currentY,
        size: 9.5,
        font: regularFont,
        color: rgb(0.12, 0.16, 0.24),
      });
      currentY -= 13;
    }
  }

  // 5. Work Experience
  if (data.experience && data.experience.length > 0) {
    drawSectionHeader("Professional Work Experience");

    for (const exp of data.experience) {
      ensureSpace(28);

      // Title & Company (Left) and Duration (Right)
      const titleCompany = `${exp.position || "Role"} — ${exp.company || "Company"}${exp.location ? ` (${exp.location})` : ""}`;
      const duration = exp.duration || "";

      currentPage.drawText(titleCompany, {
        x: marginX,
        y: currentY,
        size: 10,
        font: boldFont,
        color: rgb(0.08, 0.12, 0.2),
      });

      if (duration) {
        const durWidth = regularFont.widthOfTextAtSize(duration, 9);
        currentPage.drawText(duration, {
          x: pageWidth - marginX - durWidth,
          y: currentY,
          size: 9,
          font: regularFont,
          color: rgb(0.35, 0.42, 0.52),
        });
      }
      currentY -= 13;

      // Bullet Points
      if (exp.bulletPoints && exp.bulletPoints.length > 0) {
        for (const bp of exp.bulletPoints) {
          const bulletIndent = 12;
          const bulletTextWidth = contentWidth - bulletIndent;
          const wrapped = wrapText(bp, bulletTextWidth, regularFont, 9);

          for (let li = 0; li < wrapped.length; li++) {
            ensureSpace(12);
            if (li === 0) {
              // Draw bullet symbol
              currentPage.drawText("•", {
                x: marginX + 2,
                y: currentY,
                size: 9,
                font: boldFont,
                color: rgb(0.2, 0.25, 0.35),
              });
            }
            currentPage.drawText(wrapped[li], {
              x: marginX + bulletIndent,
              y: currentY,
              size: 9,
              font: regularFont,
              color: rgb(0.15, 0.2, 0.28),
            });
            currentY -= 12;
          }
        }
      }
      currentY -= 5;
    }
  }

  // 6. Core Skills
  if (data.skills) {
    drawSectionHeader("Skills & Technical Competencies");
    const skillCategories = Object.entries(data.skills);

    for (const [catName, skillList] of skillCategories) {
      if (skillList && skillList.length > 0) {
        const catLabel = `${catName.charAt(0).toUpperCase() + catName.slice(1)}: `;
        const skillsText = skillList.join(", ");
        const fullSkillLine = `${catLabel}${skillsText}`;
        const wrapped = wrapText(fullSkillLine, contentWidth, regularFont, 9);

        for (let li = 0; li < wrapped.length; li++) {
          ensureSpace(12);
          currentPage.drawText(wrapped[li], {
            x: marginX,
            y: currentY,
            size: 9,
            font: li === 0 ? boldFont : regularFont,
            color: rgb(0.12, 0.16, 0.24),
          });
          currentY -= 12;
        }
      }
    }
  }

  // 7. Education
  if (data.education && data.education.length > 0) {
    drawSectionHeader("Education & Credentials");

    for (const edu of data.education) {
      ensureSpace(15);
      const degreeInst = `${edu.degree || "Degree"}, ${edu.institution || "Institution"}`;
      const year = edu.year || "";

      currentPage.drawText(degreeInst, {
        x: marginX,
        y: currentY,
        size: 9.5,
        font: boldFont,
        color: rgb(0.1, 0.14, 0.22),
      });

      if (year) {
        const yearWidth = regularFont.widthOfTextAtSize(year, 9);
        currentPage.drawText(year, {
          x: pageWidth - marginX - yearWidth,
          y: currentY,
          size: 9,
          font: regularFont,
          color: rgb(0.35, 0.42, 0.52),
        });
      }
      currentY -= 14;
    }
  }

  // 8. Projects (if present)
  if (data.projects && data.projects.length > 0) {
    drawSectionHeader("Projects & Key Initiatives");

    for (const proj of data.projects) {
      ensureSpace(16);
      const projHeader = `${proj.name || "Project"}${proj.description ? ` — ${proj.description}` : ""}`;
      currentPage.drawText(projHeader, {
        x: marginX,
        y: currentY,
        size: 9.5,
        font: boldFont,
        color: rgb(0.1, 0.14, 0.22),
      });
      currentY -= 13;

      if (proj.bulletPoints) {
        for (const bp of proj.bulletPoints) {
          const bulletIndent = 12;
          const wrapped = wrapText(bp, contentWidth - bulletIndent, regularFont, 9);
          for (let li = 0; li < wrapped.length; li++) {
            ensureSpace(12);
            if (li === 0) {
              currentPage.drawText("•", {
                x: marginX + 2,
                y: currentY,
                size: 9,
                font: boldFont,
                color: rgb(0.2, 0.25, 0.35),
              });
            }
            currentPage.drawText(wrapped[li], {
              x: marginX + bulletIndent,
              y: currentY,
              size: 9,
              font: regularFont,
              color: rgb(0.15, 0.2, 0.28),
            });
            currentY -= 12;
          }
        }
      }
      currentY -= 4;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/**
 * Triggers an immediate download of the generated resume in PDF format
 */
export async function downloadAtsResumePdf(data: AtsResumeData): Promise<void> {
  const blob = await generateAtsResumePdfBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileName = (data.name || "Candidate").replace(/[^a-zA-Z0-9]/g, "_");
  a.download = `${fileName}_ATS_Optimized_Resume.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
