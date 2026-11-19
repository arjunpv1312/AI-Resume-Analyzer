import { PDFDocument, PDFPage, PDFFont, RGB, rgb, StandardFonts } from "pdf-lib";
import {
  CIRCLE_CONFIG,
  CircleCategory,
  EXECUTIVE_NETWORK_CONTACTS,
} from "../components/LinkedInConnectionNetwork";

export interface NetworkDossierTrustFactor {
  name: string;
  score: number;
  weight?: string;
  status?: string;
}

export interface NetworkDossierInput {
  candidateName: string;
  targetRole: string;
  linkedinUrl?: string;
  credibilityScore: number | null;
  credibilityTier?: string;
  trustFactors?: NetworkDossierTrustFactor[];
  verificationSummary?: string;
  linkedinComparison?: {
    hasLinkedIn?: boolean;
    resumeHeadline?: string;
    linkedinHeadline?: string;
    matchAnalysis?: string;
    missingFromResume?: string[];
    missingFromLinkedIn?: string[];
  };
  overallAtsScore?: number;
}

/**
 * Sanitizes text to safe WinAnsi characters supported by pdf-lib StandardFonts.
 */
function sanitizeWinAnsi(input: unknown): string {
  const raw = String(input ?? "");
  return raw
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2192/g, "->")
    .replace(/\u2713|\u2714/g, "[Verified]")
    .replace(/\u2022|\u25CF/g, "-")
    .replace(/[\r\n\t]+/g, " ")
    // Strip characters outside printable ASCII + basic Latin-1 supplement
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return rgb(0.08, 0.72, 0.65);
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function wrapText(
  text: string,
  maxWidth: number,
  font: PDFFont,
  fontSize: number
): string[] {
  const clean = sanitizeWinAnsi(text);
  if (!clean) return [];
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  if (current) lines.push(current);
  return lines;
}

function deriveCleanHandle(linkedinUrl?: string): string {
  if (!linkedinUrl || !linkedinUrl.trim()) return "in/executive-candidate";
  const cleaned = linkedinUrl
    .trim()
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/(in\/)?/i, "")
    .replace(/\/+$/, "");
  return sanitizeWinAnsi(cleaned.startsWith("in/") ? cleaned : `in/${cleaned}`);
}

function deriveCredentialId(name: string, handle: string, score: number): string {
  const seed = `${name}-${handle}-${score}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, "0").slice(0, 6);
  return `VT-${score}-${hex}`;
}

/**
 * Generates a structured, multi-page vector PDF dossier capturing the candidate's
 * LinkedIn professional network graph, circle coverage, and trust credibility metrics.
 */
export async function generateNetworkDossierPdfBlob(
  input: NetworkDossierInput
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612; // US Letter
  const pageHeight = 792;
  const marginX = 40;
  const marginTop = 42;
  const marginBottom = 46;
  const contentWidth = pageWidth - marginX * 2;

  const palette = {
    navy: rgb(0.04, 0.04, 0.05),
    slate: rgb(0.24, 0.24, 0.28),
    muted: rgb(0.45, 0.45, 0.5),
    border: rgb(0.86, 0.86, 0.9),
    surface: rgb(0.97, 0.96, 0.99),
    surfaceDark: rgb(0.04, 0.04, 0.06),
    teal: rgb(0.43, 0.16, 0.85), // Deep Violet primary accent
    blue: rgb(0.58, 0.2, 0.92), // Royal Purple secondary accent
    emerald: rgb(0.36, 0.13, 0.71), // Dark Violet high-trust accent
    amber: rgb(0.66, 0.33, 0.97), // Soft Lavender secondary accent
    white: rgb(1, 1, 1),
  };

  const candidateName = sanitizeWinAnsi(input.candidateName || "Executive Candidate");
  const targetRole = sanitizeWinAnsi(input.targetRole || "Executive Leadership");
  const cleanHandle = deriveCleanHandle(input.linkedinUrl);
  const effectiveScore =
    typeof input.credibilityScore === "number"
      ? Math.max(0, Math.min(100, Math.round(input.credibilityScore)))
      : input.linkedinUrl?.trim()
      ? 86
      : 78;
  const isLiveVerified = typeof input.credibilityScore === "number";
  const resolvedTier = sanitizeWinAnsi(
    input.credibilityTier ||
      (effectiveScore >= 88
        ? "Verified High Credibility"
        : effectiveScore >= 75
        ? "Strong Profile Credibility"
        : effectiveScore >= 62
        ? "Moderate Credibility"
        : "Baseline Verification")
  );
  const credentialId = deriveCredentialId(candidateName, cleanHandle, effectiveScore);

  const trustFactors: NetworkDossierTrustFactor[] =
    input.trustFactors && input.trustFactors.length > 0
      ? input.trustFactors.slice(0, 6).map((tf) => ({
          name: sanitizeWinAnsi(tf.name),
          score: Math.max(0, Math.min(100, Math.round(tf.score))),
          weight: tf.weight ? sanitizeWinAnsi(tf.weight) : undefined,
          status: tf.status ? sanitizeWinAnsi(tf.status) : undefined,
        }))
      : [
          { name: "Endorsements & Skills", score: Math.min(98, effectiveScore + 2), weight: "25%", status: "Verified" },
          { name: "Work History Consistency", score: Math.min(99, effectiveScore + 4), weight: "25%", status: "Verified" },
          { name: "Education Verification", score: Math.max(72, effectiveScore - 2), weight: "25%", status: "Audited" },
          { name: "Identity & Role Match", score: Math.min(99, effectiveScore + 5), weight: "25%", status: "Verified" },
        ];

  const contacts = [...EXECUTIVE_NETWORK_CONTACTS].sort(
    (a, b) => b.referralScore - a.referralScore
  );
  const firstDegreeCount = contacts.filter((c) => c.degree === "1st").length;
  const secondDegreeCount = contacts.filter((c) => c.degree === "2nd").length;
  const avgReferralScore = Math.round(
    contacts.reduce((acc, c) => acc + c.referralScore, 0) / Math.max(1, contacts.length)
  );
  const generatedAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const pages: PDFPage[] = [];
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  pages.push(page);
  let y = pageHeight - marginTop;

  const newPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    pages.push(page);
    y = pageHeight - marginTop;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < marginBottom) {
      newPage();
    }
  };

  const drawSectionHeading = (title: string, subtitle?: string) => {
    ensureSpace(subtitle ? 36 : 26);
    y -= 6;
    page.drawText(sanitizeWinAnsi(title).toUpperCase(), {
      x: marginX,
      y,
      size: 10,
      font: boldFont,
      color: palette.teal,
    });
    y -= 5;
    page.drawLine({
      start: { x: marginX, y },
      end: { x: pageWidth - marginX, y },
      thickness: 1,
      color: palette.border,
    });
    y -= 12;
    if (subtitle) {
      page.drawText(sanitizeWinAnsi(subtitle), {
        x: marginX,
        y,
        size: 8.5,
        font: regularFont,
        color: palette.muted,
      });
      y -= 12;
    }
  };

  // ===========================================================================
  // HEADER BANNER (Page 1)
  // ===========================================================================
  const bannerHeight = 84;
  page.drawRectangle({
    x: marginX,
    y: y - bannerHeight,
    width: contentWidth,
    height: bannerHeight,
    color: palette.surfaceDark,
    borderColor: palette.teal,
    borderWidth: 1.2,
  });

  page.drawText("LINKEDIN PROFESSIONAL NETWORK & TRUST DOSSIER", {
    x: marginX + 16,
    y: y - 22,
    size: 8.5,
    font: boldFont,
    color: palette.teal,
  });

  page.drawText(candidateName, {
    x: marginX + 16,
    y: y - 42,
    size: 17,
    font: boldFont,
    color: palette.white,
  });

  page.drawText(`${targetRole}  |  linkedin.com/${cleanHandle}`, {
    x: marginX + 16,
    y: y - 59,
    size: 9,
    font: regularFont,
    color: rgb(0.76, 0.76, 0.82),
  });

  page.drawText(`Credential ID: ${credentialId}  |  Generated: ${generatedAt}`, {
    x: marginX + 16,
    y: y - 74,
    size: 8,
    font: regularFont,
    color: rgb(0.62, 0.62, 0.7),
  });

  // Right Score Callout Box inside Header Banner
  const scoreBoxW = 114;
  const scoreBoxH = 60;
  const scoreBoxX = marginX + contentWidth - scoreBoxW - 14;
  const scoreBoxY = y - bannerHeight + 12;
  page.drawRectangle({
    x: scoreBoxX,
    y: scoreBoxY,
    width: scoreBoxW,
    height: scoreBoxH,
    color: rgb(0.09, 0.05, 0.16),
    borderColor: palette.teal,
    borderWidth: 1,
  });

  const scoreStr = `${effectiveScore}%`;
  const scoreW = boldFont.widthOfTextAtSize(scoreStr, 22);
  page.drawText(scoreStr, {
    x: scoreBoxX + (scoreBoxW - scoreW) / 2,
    y: scoreBoxY + 29,
    size: 22,
    font: boldFont,
    color: palette.white,
  });
  const labelStr = "TRUST SCORE";
  const labelW = boldFont.widthOfTextAtSize(labelStr, 7.5);
  page.drawText(labelStr, {
    x: scoreBoxX + (scoreBoxW - labelW) / 2,
    y: scoreBoxY + 14,
    size: 7.5,
    font: boldFont,
    color: palette.teal,
  });

  y -= bannerHeight + 14;

  // ===========================================================================
  // KPI STRIP (4 Summary Metrics)
  // ===========================================================================
  const kpiGap = 10;
  const kpiW = (contentWidth - kpiGap * 3) / 4;
  const kpiH = 44;
  const kpis = [
    {
      label: "CREDIBILITY TIER",
      value: resolvedTier.length > 22 ? `${resolvedTier.slice(0, 20)}..` : resolvedTier,
      sub: isLiveVerified ? "Live Audited" : "Baseline Readiness",
      accent: palette.teal,
    },
    {
      label: "WARM NETWORK",
      value: `${contacts.length} Contacts`,
      sub: `${firstDegreeCount} 1st-Deg  /  ${secondDegreeCount} 2nd-Deg`,
      accent: palette.blue,
    },
    {
      label: "AVG REFERRAL MATCH",
      value: `${avgReferralScore}%`,
      sub: "Across 5 Industry Circles",
      accent: palette.emerald,
    },
    {
      label: "EXECUTIVE FIT",
      value: typeof input.overallAtsScore === "number" ? `${Math.round(input.overallAtsScore)}% ATS` : `${effectiveScore}% Trust`,
      sub: "Cross-Vector Signal",
      accent: palette.amber,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const kx = marginX + idx * (kpiW + kpiGap);
    page.drawRectangle({
      x: kx,
      y: y - kpiH,
      width: kpiW,
      height: kpiH,
      color: palette.surface,
      borderColor: palette.border,
      borderWidth: 0.8,
    });
    page.drawText(kpi.label, {
      x: kx + 8,
      y: y - 12,
      size: 6.8,
      font: boldFont,
      color: palette.muted,
    });
    page.drawText(kpi.value, {
      x: kx + 8,
      y: y - 26,
      size: 10,
      font: boldFont,
      color: palette.navy,
    });
    page.drawText(kpi.sub, {
      x: kx + 8,
      y: y - 38,
      size: 7,
      font: regularFont,
      color: kpi.accent,
    });
  });

  y -= kpiH + 14;

  // ===========================================================================
  // SECTION 1: TRUST METRICS & FACTOR BREAKDOWN
  // ===========================================================================
  drawSectionHeading(
    "1. Trust Credibility Vector Breakdown",
    "Audited alignment across identity, seniority, work tenure, endorsements, and academic credentials."
  );

  const colW = (contentWidth - 12) / 2;
  const cardH = 38;
  for (let i = 0; i < trustFactors.length; i += 2) {
    ensureSpace(cardH + 8);
    for (let c = 0; c < 2; c++) {
      const tf = trustFactors[i + c];
      if (!tf) continue;
      const fx = marginX + c * (colW + 12);
      const fy = y - cardH;
      page.drawRectangle({
        x: fx,
        y: fy,
        width: colW,
        height: cardH,
        color: palette.surface,
        borderColor: palette.border,
        borderWidth: 0.75,
      });

      const titleText = tf.name.length > 30 ? `${tf.name.slice(0, 28)}..` : tf.name;
      page.drawText(titleText, {
        x: fx + 10,
        y: fy + 24,
        size: 8.5,
        font: boldFont,
        color: palette.navy,
      });

      const scoreBadge = `${tf.score}%${tf.weight ? ` (${tf.weight})` : ""}`;
      const badgeW = boldFont.widthOfTextAtSize(scoreBadge, 8.5);
      page.drawText(scoreBadge, {
        x: fx + colW - badgeW - 10,
        y: fy + 24,
        size: 8.5,
        font: boldFont,
        color: tf.score >= 85 ? palette.emerald : tf.score >= 70 ? palette.blue : palette.amber,
      });

      // Progress Track & Fill
      const barW = colW - 20;
      const barY = fy + 10;
      page.drawRectangle({
        x: fx + 10,
        y: barY,
        width: barW,
        height: 6,
        color: rgb(0.87, 0.9, 0.94),
      });
      page.drawRectangle({
        x: fx + 10,
        y: barY,
        width: Math.max(6, (barW * tf.score) / 100),
        height: 6,
        color: tf.score >= 85 ? palette.teal : palette.blue,
      });
    }
    y -= cardH + 8;
  }

  // Optional Verification Summary & Profile Headline Comparison
  const summaryNotes: string[] = [];
  if (input.verificationSummary) {
    summaryNotes.push(`Audit Summary: ${input.verificationSummary}`);
  }
  if (input.linkedinComparison?.hasLinkedIn) {
    if (input.linkedinComparison.linkedinHeadline) {
      summaryNotes.push(`LinkedIn Headline: ${input.linkedinComparison.linkedinHeadline}`);
    }
    if (input.linkedinComparison.matchAnalysis) {
      summaryNotes.push(`Cross-Vector Match: ${input.linkedinComparison.matchAnalysis}`);
    }
  }
  if (summaryNotes.length > 0) {
    for (const note of summaryNotes) {
      const lines = wrapText(note, contentWidth - 16, regularFont, 8.5);
      const boxH = lines.length * 11 + 10;
      ensureSpace(boxH + 6);
      page.drawRectangle({
        x: marginX,
        y: y - boxH,
        width: contentWidth,
        height: boxH,
        color: rgb(0.96, 0.95, 0.99),
        borderColor: palette.border,
        borderWidth: 0.7,
      });
      let lineY = y - 13;
      for (const ln of lines) {
        page.drawText(ln, {
          x: marginX + 8,
          y: lineY,
          size: 8.5,
          font: regularFont,
          color: palette.slate,
        });
        lineY -= 11;
      }
      y -= boxH + 6;
    }
  }

  // ===========================================================================
  // SECTION 2: VECTOR NETWORK GRAPH TOPOLOGY & CIRCLE DISTRIBUTION
  // ===========================================================================
  drawSectionHeading(
    "2. Professional Network Graph & Industry Circle Map",
    "Radial topology of candidate connections across 5 executive referral clusters (1st-degree direct & 2nd-degree warm paths)."
  );

  const diagramH = 228;
  ensureSpace(diagramH + 14);

  // Dark canvas backdrop for sharp graph readability
  page.drawRectangle({
    x: marginX,
    y: y - diagramH,
    width: contentWidth,
    height: diagramH,
    color: palette.surfaceDark,
    borderColor: palette.teal,
    borderWidth: 0.9,
  });

  const centerX = marginX + contentWidth / 2;
  const centerY = y - diagramH / 2 + 6;
  const circleCats = Object.keys(CIRCLE_CONFIG) as CircleCategory[];
  const hubRadiusDist = 66;
  const contactRadiusDist = 104;

  // Compute hub positions symmetrically around center
  const hubCoords: Record<CircleCategory, { x: number; y: number; angle: number }> = {} as any;
  circleCats.forEach((cat, idx) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / circleCats.length;
    const hx = centerX + Math.cos(angle) * (hubRadiusDist * 1.35);
    const hy = centerY + Math.sin(angle) * (hubRadiusDist * 0.95);
    hubCoords[cat] = { x: hx, y: hy, angle };
  });

  // Draw Candidate -> Hub lines
  circleCats.forEach((cat) => {
    const hub = hubCoords[cat];
    page.drawLine({
      start: { x: centerX, y: centerY },
      end: { x: hub.x, y: hub.y },
      thickness: 1.4,
      color: rgb(0.49, 0.23, 0.93),
    });
  });

  // Draw Contacts clustered near their Circle Hub
  const byCircle: Record<CircleCategory, typeof contacts> = {
    faang: [],
    scaleup: [],
    "vc-exec": [],
    architecture: [],
    alumni: [],
  };
  contacts.forEach((c) => byCircle[c.circle].push(c));

  circleCats.forEach((cat) => {
    const hub = hubCoords[cat];
    const group = byCircle[cat];
    const spread = 0.44;
    group.forEach((contact, idx) => {
      const offset = group.length === 1 ? 0 : (idx - (group.length - 1) / 2) * spread;
      const cAngle = hub.angle + offset;
      const cx = centerX + Math.cos(cAngle) * (contactRadiusDist * 1.48);
      const cy = centerY + Math.sin(cAngle) * (contactRadiusDist * 0.92);

      // Edge from Hub to Contact
      page.drawLine({
        start: { x: hub.x, y: hub.y },
        end: { x: cx, y: cy },
        thickness: contact.degree === "1st" ? 1.1 : 0.7,
        color:
          contact.degree === "1st"
            ? rgb(0.55, 0.36, 0.96)
            : rgb(0.75, 0.52, 0.99),
      });

      // Contact Node Circle
      page.drawCircle({
        x: cx,
        y: cy,
        size: contact.degree === "1st" ? 6.5 : 5.2,
        color: rgb(0.05, 0.05, 0.08),
        borderColor:
          contact.degree === "1st"
            ? rgb(0.55, 0.36, 0.96)
            : rgb(0.75, 0.52, 0.99),
        borderWidth: 1.4,
      });

      // Contact Name Label (positioned radially outward)
      const labelText = sanitizeWinAnsi(`${contact.name} (${contact.company})`);
      const labelSize = 6.3;
      const lw = regularFont.widthOfTextAtSize(labelText, labelSize);
      const isRightSide = cx >= centerX;
      const lx = isRightSide ? cx + 9 : cx - lw - 9;
      const ly = cy - 2;
      page.drawText(labelText, {
        x: Math.max(marginX + 6, Math.min(pageWidth - marginX - lw - 6, lx)),
        y: ly,
        size: labelSize,
        font: regularFont,
        color: rgb(0.9, 0.9, 0.94),
      });
    });
  });

  // Draw Hub Nodes over edges
  circleCats.forEach((cat) => {
    const hub = hubCoords[cat];
    const hubColor = hexToRgb(CIRCLE_CONFIG[cat].color);
    page.drawCircle({
      x: hub.x,
      y: hub.y,
      size: 10,
      color: rgb(0.07, 0.07, 0.1),
      borderColor: hubColor,
      borderWidth: 1.8,
    });
    const shortHub = sanitizeWinAnsi(CIRCLE_CONFIG[cat].label.split(" ")[0]);
    const hw = boldFont.widthOfTextAtSize(shortHub, 6.2);
    page.drawText(shortHub, {
      x: hub.x - hw / 2,
      y: hub.y - 2,
      size: 6.2,
      font: boldFont,
      color: hubColor,
    });
  });

  // Draw Candidate Center Node on top
  page.drawCircle({
    x: centerX,
    y: centerY,
    size: 16,
    color: rgb(0.14, 0.07, 0.28),
    borderColor: palette.teal,
    borderWidth: 2.2,
  });
  const youW = boldFont.widthOfTextAtSize("YOU", 7.5);
  page.drawText("YOU", {
    x: centerX - youW / 2,
    y: centerY - 2.5,
    size: 7.5,
    font: boldFont,
    color: rgb(0.84, 0.74, 0.99),
  });

  // Diagram Legend Bar at bottom inside dark frame
  page.drawText(
    "Legend:  Deep Violet Center = Candidate   |   Violet Node = 1st-Degree Direct   |   Lavender Node = 2nd-Degree Warm Intro   |   Ring = Circle Hub",
    {
      x: marginX + 12,
      y: y - diagramH + 9,
      size: 6.5,
      font: regularFont,
      color: rgb(0.7, 0.7, 0.78),
    }
  );

  y -= diagramH + 12;

  // Circle Coverage Summary Table
  const rowH = 18;
  ensureSpace(rowH * (circleCats.length + 2));
  page.drawRectangle({
    x: marginX,
    y: y - rowH,
    width: contentWidth,
    height: rowH,
    color: palette.navy,
  });
  page.drawText("INDUSTRY CIRCLE", { x: marginX + 8, y: y - 12, size: 7.5, font: boldFont, color: palette.white });
  page.drawText("CONTACTS", { x: marginX + 165, y: y - 12, size: 7.5, font: boldFont, color: palette.white });
  page.drawText("AVG MATCH", { x: marginX + 225, y: y - 12, size: 7.5, font: boldFont, color: palette.white });
  page.drawText("STRATEGIC FOCUS", { x: marginX + 290, y: y - 12, size: 7.5, font: boldFont, color: palette.white });
  y -= rowH;

  circleCats.forEach((cat, idx) => {
    const group = byCircle[cat];
    const avg = group.length
      ? Math.round(group.reduce((s, c) => s + c.referralScore, 0) / group.length)
      : 0;
    page.drawRectangle({
      x: marginX,
      y: y - rowH,
      width: contentWidth,
      height: rowH,
      color: idx % 2 === 0 ? palette.surface : palette.white,
      borderColor: palette.border,
      borderWidth: 0.4,
    });
    page.drawText(sanitizeWinAnsi(CIRCLE_CONFIG[cat].label), {
      x: marginX + 8,
      y: y - 12,
      size: 8,
      font: boldFont,
      color: palette.navy,
    });
    page.drawText(`${group.length}`, {
      x: marginX + 178,
      y: y - 12,
      size: 8,
      font: regularFont,
      color: palette.slate,
    });
    page.drawText(`${avg}%`, {
      x: marginX + 235,
      y: y - 12,
      size: 8,
      font: boldFont,
      color: palette.teal,
    });
    const desc = sanitizeWinAnsi(CIRCLE_CONFIG[cat].description);
    page.drawText(desc.length > 52 ? `${desc.slice(0, 50)}..` : desc, {
      x: marginX + 290,
      y: y - 12,
      size: 7.5,
      font: regularFont,
      color: palette.muted,
    });
    y -= rowH;
  });

  // ===========================================================================
  // SECTION 3: RANKED REFERRAL CONTACTS & WARM INTRO PLAYBOOK
  // ===========================================================================
  y -= 10;
  drawSectionHeading(
    "3. Ranked Referral Pathways & Warm Intro Playbook",
    "Prioritized executive contacts ordered by referral match score, mutual connections, and tailored outreach notes."
  );

  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    const introLines = wrapText(
      `Warm Path: ${c.warmIntroVia || "Direct"}  |  Hiring Signal: ${c.hiringStatus}`,
      contentWidth - 20,
      regularFont,
      8
    );
    const noteLines = wrapText(
      `Outreach Draft: "${c.suggestedNote}"`,
      contentWidth - 20,
      regularFont,
      7.8
    );
    const blockH = 26 + introLines.length * 10.5 + noteLines.length * 10 + 8;

    ensureSpace(blockH + 8);

    page.drawRectangle({
      x: marginX,
      y: y - blockH,
      width: contentWidth,
      height: blockH,
      color: i % 2 === 0 ? palette.surface : palette.white,
      borderColor: palette.border,
      borderWidth: 0.7,
    });

    // Left colored stripe indicator inside card bounds
    page.drawRectangle({
      x: marginX,
      y: y - blockH,
      width: 3.5,
      height: blockH,
      color: c.degree === "1st" ? palette.emerald : palette.amber,
    });

    const headerTitle = sanitizeWinAnsi(
      `${i + 1}. ${c.name} — ${c.role} at ${c.company}`
    );
    page.drawText(headerTitle, {
      x: marginX + 10,
      y: y - 14,
      size: 9,
      font: boldFont,
      color: palette.navy,
    });

    const rightTag = sanitizeWinAnsi(
      `${c.degree} Degree  |  ${CIRCLE_CONFIG[c.circle].label.split(" ")[0]}  |  ${c.referralScore}% Match`
    );
    const tagW = boldFont.widthOfTextAtSize(rightTag, 8);
    page.drawText(rightTag, {
      x: marginX + contentWidth - tagW - 10,
      y: y - 14,
      size: 8,
      font: boldFont,
      color: c.degree === "1st" ? palette.emerald : palette.amber,
    });

    let cursorY = y - 27;
    for (const ln of introLines) {
      page.drawText(ln, {
        x: marginX + 10,
        y: cursorY,
        size: 8,
        font: boldFont,
        color: palette.slate,
      });
      cursorY -= 10.5;
    }
    for (const ln of noteLines) {
      page.drawText(ln, {
        x: marginX + 10,
        y: cursorY,
        size: 7.8,
        font: regularFont,
        color: palette.muted,
      });
      cursorY -= 10;
    }

    y -= blockH + 7;
  }

  // ===========================================================================
  // FOOTER STAMP ON EVERY PAGE
  // ===========================================================================
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    p.drawLine({
      start: { x: marginX, y: 30 },
      end: { x: pageWidth - marginX, y: 30 },
      thickness: 0.5,
      color: palette.border,
    });
    p.drawText(
      `Executive Network & Trust Dossier  |  ${candidateName} (${credentialId})`,
      {
        x: marginX,
        y: 18,
        size: 7.5,
        font: regularFont,
        color: palette.muted,
      }
    );
    const pageLabel = `Page ${idx + 1} of ${totalPages}`;
    const plW = regularFont.widthOfTextAtSize(pageLabel, 7.5);
    p.drawText(pageLabel, {
      x: pageWidth - marginX - plW,
      y: 18,
      size: 7.5,
      font: regularFont,
      color: palette.muted,
    });
  });

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

/**
 * Generates and downloads the structured LinkedIn Network & Trust Dossier PDF.
 */
export async function downloadNetworkDossierPdf(
  input: NetworkDossierInput
): Promise<void> {
  const blob = await generateNetworkDossierPdfBlob(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = sanitizeWinAnsi(input.candidateName || "Executive")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  a.download = `${safeName || "Executive"}_LinkedIn_Network_Trust_Dossier.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
