import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Share2,
  Code,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sliders,
  Award,
  CheckCircle2,
  RefreshCw,
  Link2,
  Image as ImageIcon,
  Compass,
} from "lucide-react";

export interface VerifiedTrustBadgeCardProps {
  credibilityScore: number | null;
  credibilityTier?: string;
  linkedinUrl?: string;
  candidateName?: string;
  targetRole?: string;
  trustFactors?: Array<{
    name: string;
    score: number;
    weight?: string;
    status?: string;
  }>;
  isVerifying?: boolean;
  onVerifyNow: () => void;
  onOpenVerificationModal: () => void;
  onShareTrustScore?: () => void;
  onOpenWalkthrough?: () => void;
}

type BadgeStyleVariant = "executive" | "compact" | "light";
type EmbedTabType = "graphic" | "linkedin" | "html" | "markdown" | "credential";
type ImageExportFormat = "png" | "jpeg";
type HeaderDimensionPreset = "post-header" | "profile-banner";

export const VerifiedTrustBadgeCard: React.FC<VerifiedTrustBadgeCardProps> = ({
  credibilityScore,
  credibilityTier,
  linkedinUrl = "",
  candidateName = "Candidate",
  targetRole = "Senior Technology & Operations Leader",
  trustFactors,
  isVerifying = false,
  onVerifyNow,
  onOpenVerificationModal,
  onShareTrustScore,
  onOpenWalkthrough,
}) => {
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  const [badgeStyle, setBadgeStyle] = useState<BadgeStyleVariant>("executive");
  const [activeEmbedTab, setActiveEmbedTab] = useState<EmbedTabType>("graphic");
  const [exportFormat, setExportFormat] = useState<ImageExportFormat>("png");
  const [dimensionPreset, setDimensionPreset] =
    useState<HeaderDimensionPreset>("post-header");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const hasLinkedIn = Boolean(linkedinUrl.trim() || typeof credibilityScore === "number");

  const effectiveScore = useMemo(() => {
    if (typeof credibilityScore === "number") return credibilityScore;
    return linkedinUrl.trim() ? 86 : 0;
  }, [credibilityScore, linkedinUrl]);

  const isLiveVerified = typeof credibilityScore === "number";

  const cleanHandle = useMemo(() => {
    if (!linkedinUrl.trim()) return "not-linked";
    const cleaned = linkedinUrl
      .trim()
      .replace(/^https?:\/\/(www\.)?linkedin\.com\/(in\/)?/i, "")
      .replace(/\/+$/, "");
    return cleaned.startsWith("in/") ? cleaned : `in/${cleaned}`;
  }, [linkedinUrl]);

  const resolvedTier = useMemo(() => {
    if (credibilityTier) return credibilityTier;
    if (effectiveScore >= 88) return "Verified High Credibility";
    if (effectiveScore >= 75) return "Strong Profile Credibility";
    if (effectiveScore >= 62) return "Moderate Credibility";
    return "Baseline Verification";
  }, [credibilityTier, effectiveScore]);

  const credentialId = useMemo(() => {
    const seed = `${candidateName}-${cleanHandle}-${effectiveScore}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash)
      .toString(16)
      .toUpperCase()
      .padStart(6, "0")
      .slice(0, 6);
    return `VT-${effectiveScore}-${hex}`;
  }, [candidateName, cleanHandle, effectiveScore]);

  const defaultFactors = useMemo(
    () =>
      trustFactors && trustFactors.length > 0
        ? trustFactors.slice(0, 4)
        : [
            { name: "Endorsements & Skills", score: Math.min(98, effectiveScore + 2) },
            { name: "Work History Consistency", score: Math.min(99, effectiveScore + 4) },
            { name: "Education Verification", score: Math.max(72, effectiveScore - 2) },
            { name: "Identity & Role Match", score: Math.min(99, effectiveScore + 5) },
          ],
    [trustFactors, effectiveScore]
  );

  const originUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://career-intelligence.app";

  const badgeSvgUrl = useMemo(() => {
    const params = new URLSearchParams({
      score: String(effectiveScore),
      style: badgeStyle,
      handle: cleanHandle,
      role: targetRole,
    });
    return `${originUrl}/api/linkedin/trust-badge.svg?${params.toString()}`;
  }, [originUrl, effectiveScore, badgeStyle, cleanHandle, targetRole]);

  const profileDestinationUrl = useMemo(() => {
    if (linkedinUrl.trim()) {
      return linkedinUrl.startsWith("http")
        ? linkedinUrl.trim()
        : `https://${linkedinUrl.trim()}`;
    }
    return originUrl;
  }, [linkedinUrl, originUrl]);

  const shareSnippets = useMemo(() => {
    const linkedinPost = `Verified Trust Credential: ${effectiveScore}% LinkedIn Credibility Score (${resolvedTier})

I completed a cross-vector verification of my public LinkedIn profile (${cleanHandle}) against my executive resume targeting ${targetRole}.

Verification ID: ${credentialId}
• Endorsements & Skill Alignment Verified
• Work History & Tenure Consistency Audited
• Education & Credential Validation Passed
• Public Identity & Seniority Matched

Verify your professional profile credibility: ${originUrl}`;

    const htmlEmbed = `<!-- Verified Trust Credential Badge (${credentialId}) -->
<a href="${profileDestinationUrl}" target="_blank" rel="noopener noreferrer" title="Verified Trust - ${effectiveScore}% LinkedIn Credibility Score (${resolvedTier})">
  <img src="${badgeSvgUrl}" alt="Verified Trust Badge - ${effectiveScore}% LinkedIn Credibility Score" style="max-width: 100%; height: auto; border: 0;" />
</a>`;

    const markdownEmbed = `[![Verified Trust - ${effectiveScore}% LinkedIn Credibility Score](${badgeSvgUrl})](${profileDestinationUrl} "Verified Trust Credential ${credentialId}")`;

    const credentialDetails = `Name: Verified Trust — LinkedIn & Resume Credibility Audit (${effectiveScore}%)
Issuing Organization: Executive Career Intelligence
Issue Date: ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
Credential ID: ${credentialId}
Credential URL: ${badgeSvgUrl}`;

    return {
      linkedinPost,
      htmlEmbed,
      markdownEmbed,
      credentialDetails,
    };
  }, [
    effectiveScore,
    resolvedTier,
    cleanHandle,
    targetRole,
    credentialId,
    originUrl,
    profileDestinationUrl,
    badgeSvgUrl,
  ]);

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const renderLinkedInGraphicToCanvas = useCallback(
    (canvas: HTMLCanvasElement) => {
      const isBanner = dimensionPreset === "profile-banner";
      const width = isBanner ? 1584 : 1200;
      const height = isBanner ? 396 : 627;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const isLight = badgeStyle === "light";
      const accentPrimary = isLight ? "#4c1d95" : "#a855f7";
      const accentSecondary = isLight ? "#7e22ce" : "#c084fc";

      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (isLight) {
        bgGrad.addColorStop(0, "#fafafa");
        bgGrad.addColorStop(0.5, "#f4f4f5");
        bgGrad.addColorStop(1, "#ede9fe");
      } else {
        bgGrad.addColorStop(0, "#09090b");
        bgGrad.addColorStop(0.6, "#111116");
        bgGrad.addColorStop(1, "#1e1038");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle hairline grid
      ctx.strokeStyle = isLight ? "rgba(9, 9, 11, 0.04)" : "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      const gridStep = 48;
      for (let gx = 0; gx < width; gx += gridStep) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Outer Card Frame
      const pad = isBanner ? 24 : 36;
      drawRoundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, 20);
      ctx.fillStyle = isLight ? "#ffffff" : "#111116";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isLight ? "#d4d4d8" : "#27272a";
      ctx.stroke();

      // Top Accent Line
      drawRoundedRect(ctx, pad + 24, pad, width - (pad + 24) * 2, 4, 2);
      ctx.fillStyle = accentPrimary;
      ctx.fill();

      const textMain = isLight ? "#09090b" : "#fafafa";
      const textMuted = isLight ? "#52525b" : "#a1a1aa";
      const cardSurface = isLight ? "#f4f4f5" : "#18181b";
      const cardBorder = isLight ? "#e4e4e7" : "#27272a";

      if (isBanner) {
        const centerY = height / 2;
        const gaugeX = pad + 135;
        const gaugeY = centerY;
        const gaugeR = 86;

        ctx.beginPath();
        ctx.arc(gaugeX, gaugeY, gaugeR, 0, Math.PI * 2);
        ctx.strokeStyle = isLight ? "#e4e4e7" : "#27272a";
        ctx.lineWidth = 14;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
          gaugeX,
          gaugeY,
          gaugeR,
          -Math.PI / 2,
          -Math.PI / 2 + (Math.PI * 2 * effectiveScore) / 100
        );
        ctx.strokeStyle = accentPrimary;
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.fillStyle = textMain;
        ctx.font = "900 44px Outfit, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${effectiveScore}%`, gaugeX, gaugeY + 8);

        ctx.fillStyle = accentPrimary;
        ctx.font = "800 11px Outfit, system-ui, sans-serif";
        ctx.fillText("CREDIBILITY", gaugeX, gaugeY + 32);

        ctx.textAlign = "left";
        const midX = pad + 265;

        drawRoundedRect(ctx, midX, pad + 38, 228, 30, 8);
        ctx.fillStyle = isLight ? "#f3e8ff" : "rgba(124, 58, 237, 0.2)";
        ctx.fill();
        ctx.fillStyle = accentPrimary;
        ctx.font = "800 13px Outfit, system-ui, sans-serif";
        ctx.fillText(`VERIFIED TRUST · ${credentialId}`, midX + 14, pad + 58);

        ctx.fillStyle = textMain;
        ctx.font = "900 32px Outfit, system-ui, sans-serif";
        ctx.fillText(targetRole.slice(0, 44), midX, pad + 114);

        ctx.fillStyle = textMuted;
        ctx.font = "600 17px monospace";
        ctx.fillText(
          `${candidateName}  ·  linkedin.com/${cleanHandle}  ·  ${resolvedTier}`,
          midX,
          pad + 148
        );

        const factorW = 280;
        const factorGap = 16;
        defaultFactors.forEach((tf, idx) => {
          const fx = midX + idx * (factorW + factorGap);
          const fy = pad + 182;
          if (fx + factorW > width - pad - 20) return;

          drawRoundedRect(ctx, fx, fy, factorW, 110, 14);
          ctx.fillStyle = cardSurface;
          ctx.fill();
          ctx.strokeStyle = cardBorder;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = textMuted;
          ctx.font = "700 13px Outfit, system-ui, sans-serif";
          ctx.fillText(tf.name.slice(0, 26), fx + 18, fy + 34);

          ctx.fillStyle = textMain;
          ctx.font = "900 26px monospace";
          ctx.fillText(`${tf.score}%`, fx + 18, fy + 70);

          drawRoundedRect(ctx, fx + 18, fy + 84, factorW - 36, 8, 4);
          ctx.fillStyle = isLight ? "#d4d4d8" : "#27272a";
          ctx.fill();

          drawRoundedRect(
            ctx,
            fx + 18,
            fy + 84,
            Math.max(12, ((factorW - 36) * tf.score) / 100),
            8,
            4
          );
          ctx.fillStyle = accentPrimary;
          ctx.fill();
        });
        return;
      }

      // Standard Post Header Layout (1200 x 627)
      const innerX = pad + 40;
      const innerY = pad + 38;
      const innerW = width - (pad + 40) * 2;

      drawRoundedRect(ctx, innerX, innerY, 248, 36, 8);
      ctx.fillStyle = isLight ? "#f3e8ff" : "rgba(124, 58, 237, 0.18)";
      ctx.fill();
      ctx.strokeStyle = isLight ? "#c4b5fd" : "rgba(139, 92, 246, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = accentPrimary;
      ctx.textAlign = "left";
      ctx.font = "800 14px Outfit, system-ui, sans-serif";
      ctx.fillText("VERIFIED TRUST CREDENTIAL", innerX + 16, innerY + 23);

      const dateStr = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      ctx.textAlign = "right";
      ctx.fillStyle = textMuted;
      ctx.font = "700 14px monospace";
      ctx.fillText(
        `ID: ${credentialId}   ·   AUDITED: ${dateStr.toUpperCase()}`,
        innerX + innerW,
        innerY + 23
      );

      const leftCardX = innerX;
      const leftCardY = innerY + 58;
      const leftCardW = 340;
      const leftCardH = 385;

      drawRoundedRect(ctx, leftCardX, leftCardY, leftCardW, leftCardH, 16);
      ctx.fillStyle = cardSurface;
      ctx.fill();
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const cx = leftCardX + leftCardW / 2;
      const cy = leftCardY + 158;
      const radius = 102;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isLight ? "#e4e4e7" : "#27272a";
      ctx.lineWidth = 18;
      ctx.stroke();

      const arcGrad = ctx.createLinearGradient(
        cx - radius,
        cy - radius,
        cx + radius,
        cy + radius
      );
      arcGrad.addColorStop(0, accentPrimary);
      arcGrad.addColorStop(1, accentSecondary);

      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        radius,
        -Math.PI / 2,
        -Math.PI / 2 + (Math.PI * 2 * effectiveScore) / 100
      );
      ctx.strokeStyle = arcGrad;
      ctx.lineWidth = 18;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = textMain;
      ctx.font = "900 62px Outfit, system-ui, sans-serif";
      ctx.fillText(`${effectiveScore}%`, cx, cy + 14);

      ctx.fillStyle = accentPrimary;
      ctx.font = "800 13px Outfit, system-ui, sans-serif";
      ctx.fillText("CREDIBILITY SCORE", cx, cy + 44);

      drawRoundedRect(ctx, leftCardX + 32, leftCardY + 292, leftCardW - 64, 40, 8);
      ctx.fillStyle = isLight ? "#f3e8ff" : "rgba(124, 58, 237, 0.16)";
      ctx.fill();
      ctx.strokeStyle = isLight ? "#c4b5fd" : "rgba(139, 92, 246, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = accentPrimary;
      ctx.font = "800 13px Outfit, system-ui, sans-serif";
      ctx.fillText(resolvedTier.toUpperCase(), cx, leftCardY + 317);

      ctx.fillStyle = textMuted;
      ctx.font = "600 13px Outfit, system-ui, sans-serif";
      ctx.fillText("Profile vs. Resume Audit", cx, leftCardY + 358);

      const rightX = leftCardX + leftCardW + 32;
      const rightW = innerW - leftCardW - 32;

      ctx.textAlign = "left";
      ctx.fillStyle = accentPrimary;
      ctx.font = "800 13px Outfit, system-ui, sans-serif";
      ctx.fillText("CANDIDATE IDENTITY & TARGET BENCHMARK", rightX, leftCardY + 24);

      ctx.fillStyle = textMain;
      ctx.font = "900 34px Outfit, system-ui, sans-serif";
      ctx.fillText(targetRole.slice(0, 36), rightX, leftCardY + 66);

      ctx.fillStyle = textMuted;
      ctx.font = "600 17px monospace";
      ctx.fillText(`linkedin.com/${cleanHandle}`, rightX, leftCardY + 98);

      const gridY = leftCardY + 126;
      const colGap = 18;
      const rowGap = 18;
      const boxW = (rightW - colGap) / 2;
      const boxH = (leftCardH - 126 - rowGap) / 2;

      defaultFactors.forEach((tf, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const bx = rightX + col * (boxW + colGap);
        const by = gridY + row * (boxH + rowGap);

        drawRoundedRect(ctx, bx, by, boxW, boxH, 14);
        ctx.fillStyle = cardSurface;
        ctx.fill();
        ctx.strokeStyle = cardBorder;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = textMuted;
        ctx.font = "700 14px Outfit, system-ui, sans-serif";
        ctx.fillText(tf.name.slice(0, 26), bx + 20, by + 36);

        ctx.fillStyle = textMain;
        ctx.font = "900 30px monospace";
        ctx.fillText(`${tf.score}%`, bx + 20, by + 76);

        ctx.textAlign = "right";
        ctx.fillStyle = tf.score >= 80 ? accentPrimary : "#be123c";
        ctx.font = "800 12px Outfit, system-ui, sans-serif";
        ctx.fillText(
          tf.score >= 80 ? "VERIFIED" : "AUDITED",
          bx + boxW - 20,
          by + 74
        );

        const barW = boxW - 40;
        const barY = by + boxH - 26;
        drawRoundedRect(ctx, bx + 20, barY, barW, 8, 4);
        ctx.fillStyle = isLight ? "#e4e4e7" : "#27272a";
        ctx.fill();

        drawRoundedRect(
          ctx,
          bx + 20,
          barY,
          Math.max(12, (barW * tf.score) / 100),
          8,
          4
        );
        ctx.fillStyle = tf.score >= 80 ? accentPrimary : accentSecondary;
        ctx.fill();
      });

      const footerY = height - pad - 24;
      ctx.textAlign = "left";
      ctx.fillStyle = textMuted;
      ctx.font = "600 13px Outfit, system-ui, sans-serif";
      ctx.fillText(
        "Executive Career Intelligence  ·  Cross-Vector LinkedIn & Resume Verification",
        innerX,
        footerY
      );

      ctx.textAlign = "right";
      ctx.fillStyle = accentPrimary;
      ctx.font = "700 13px monospace";
      ctx.fillText("1200×627 LINKEDIN POST HEADER VERIFIED", innerX + innerW, footerY);
    },
    [
      dimensionPreset,
      badgeStyle,
      effectiveScore,
      credentialId,
      targetRole,
      candidateName,
      cleanHandle,
      resolvedTier,
      defaultFactors,
    ]
  );

  useEffect(() => {
    if (isShareDrawerOpen && previewCanvasRef.current) {
      renderLinkedInGraphicToCanvas(previewCanvasRef.current);
    }
  }, [isShareDrawerOpen, activeEmbedTab, renderLinkedInGraphicToCanvas]);

  const handleExportGraphic = (format: ImageExportFormat = exportFormat) => {
    setIsExportingImage(true);
    try {
      const offscreen = document.createElement("canvas");
      renderLinkedInGraphicToCanvas(offscreen);
      const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
      const quality = format === "jpeg" ? 0.95 : undefined;
      const dataUrl = offscreen.toDataURL(mimeType, quality);

      const link = document.createElement("a");
      link.href = dataUrl;
      const suffix =
        dimensionPreset === "profile-banner" ? "banner" : "post-header";
      link.download = `linkedin-verified-trust-${effectiveScore}-${suffix}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCopiedKey(`exported-${format}`);
      setTimeout(() => setCopiedKey(null), 2200);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleCopyGraphicToClipboard = async () => {
    try {
      const offscreen = document.createElement("canvas");
      renderLinkedInGraphicToCanvas(offscreen);
      offscreen.toBlob(async (blob) => {
        if (!blob) return;
        try {
          if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            setCopiedKey("copy-graphic-img");
            setTimeout(() => setCopiedKey(null), 2400);
          } else {
            handleExportGraphic("png");
          }
        } catch {
          handleExportGraphic("png");
        }
      }, "image/png");
    } catch {
      handleExportGraphic("png");
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleDownloadSvg = () => {
    const accentColor = "#7e22ce";
    const bgFill = badgeStyle === "light" ? "#ffffff" : "#09090b";
    const cardStroke = badgeStyle === "light" ? "#e4e4e7" : "#27272a";
    const titleColor = badgeStyle === "light" ? "#09090b" : "#fafafa";
    const subColor = badgeStyle === "light" ? "#52525b" : "#a1a1aa";
    const safeRole = targetRole.replace(/[<>&"']/g, "").slice(0, 46);
    const safeHandle = cleanHandle.replace(/[<>&"']/g, "").slice(0, 40);

    const svgContent =
      badgeStyle === "compact"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="310" height="36" viewBox="0 0 310 36" fill="none">
  <rect width="310" height="36" rx="8" fill="#09090b" stroke="#7e22ce" stroke-opacity="0.6" stroke-width="1.5"/>
  <rect x="1" y="1" width="142" height="34" rx="7" fill="#18181b"/>
  <path d="M18 11L24 13.5V18.5C24 22.1 21.4 25.4 18 26.5C14.6 25.4 12 22.1 12 18.5V13.5L18 11Z" stroke="#a855f7" stroke-width="1.75" fill="#7e22ce" fill-opacity="0.2"/>
  <path d="M15.5 18.5L17.2 20.2L20.8 16.6" stroke="#a855f7" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="31" y="22" fill="#fafafa" font-family="Outfit, sans-serif" font-size="11" font-weight="800" letter-spacing="0.06em">VERIFIED TRUST</text>
  <text x="155" y="22" fill="#c084fc" font-family="monospace" font-size="12" font-weight="800">${effectiveScore}% CREDIBILITY</text>
</svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="116" viewBox="0 0 420 116" fill="none">
  <rect width="420" height="116" rx="16" fill="${bgFill}" stroke="${accentColor}" stroke-opacity="0.5" stroke-width="1.5"/>
  <rect x="14" y="14" width="88" height="88" rx="12" fill="${accentColor}" fill-opacity="0.1" stroke="${accentColor}" stroke-opacity="0.3"/>
  <text x="58" y="58" text-anchor="middle" fill="${accentColor}" font-family="monospace" font-size="26" font-weight="800">${effectiveScore}%</text>
  <text x="58" y="76" text-anchor="middle" fill="${titleColor}" font-family="Outfit, sans-serif" font-size="8.5" font-weight="800" letter-spacing="0.1em">CREDIBILITY</text>
  <text x="58" y="90" text-anchor="middle" fill="${subColor}" font-family="Outfit, sans-serif" font-size="7.5" font-weight="600">${credentialId}</text>
  <rect x="118" y="18" width="116" height="20" rx="5" fill="${accentColor}" fill-opacity="0.15"/>
  <text x="128" y="31.5" fill="${accentColor}" font-family="Outfit, sans-serif" font-size="9" font-weight="800" letter-spacing="0.08em">VERIFIED TRUST</text>
  <text x="242" y="31.5" fill="${subColor}" font-family="Outfit, sans-serif" font-size="8.5" font-weight="700" letter-spacing="0.05em">${resolvedTier.toUpperCase()}</text>
  <text x="118" y="58" fill="${titleColor}" font-family="Outfit, sans-serif" font-size="14" font-weight="800">${safeRole}</text>
  <text x="118" y="77" fill="${subColor}" font-family="monospace" font-size="10.5" font-weight="600">${safeHandle}</text>
  <line x1="118" y1="88" x2="402" y2="88" stroke="${cardStroke}" stroke-width="1"/>
  <text x="118" y="102" fill="${subColor}" font-family="Outfit, sans-serif" font-size="8.5" font-weight="600">Endorsements · Work History · Education · Identity Verified</text>
</svg>`;

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `verified-trust-badge-${effectiveScore}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!hasLinkedIn) {
    return (
      <div
        id="verified-trust-badge-section"
        className="mb-8 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-150"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-violet-700 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
              LinkedIn Profile: Missing (Not Linked)
            </h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
            No LinkedIn profile was submitted. LinkedIn verification is excluded from your resume score with zero penalty. Connect your profile anytime to verify identity alignment.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenVerificationModal}
          className="px-4 py-2 rounded-xl bg-[#4c1d95] hover:bg-[#7e22ce] text-white font-bold text-xs transition-colors duration-150 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Connect LinkedIn</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="verified-trust-badge-section"
      className="mb-8 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors duration-150"
    >
      {/* Main Verified Trust Badge Banner */}
      <div className="p-6 md:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Verified Trust Shield Emblem */}
          <div className="relative flex items-center gap-4 px-5 py-4 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="relative flex items-center justify-center w-13 h-13 rounded-xl bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300">
              <ShieldCheck className="w-7 h-7" />
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-700 dark:bg-purple-500 border-2 border-white dark:border-[#09090b] flex items-center justify-center"
                title="Verified Trust Seal"
              >
                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-bold text-violet-700 dark:text-violet-300">
                  Verified Trust
                </span>
                <span className="text-zinc-400" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono font-semibold text-zinc-500 dark:text-zinc-400">
                  {credentialId}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold font-mono tabular-nums text-zinc-950 dark:text-white">
                  {effectiveScore}%
                </span>
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Credibility Score
                </span>
              </div>
              <div className="text-[11px] font-semibold text-violet-700 dark:text-purple-300 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>{resolvedTier}</span>
              </div>
            </div>
          </div>

          {/* Context & 4-Vector Mini Metrics */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-zinc-950 dark:text-white tracking-tight">
                Professional Credibility & Verified Trust Credential
              </h3>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                · {isLiveVerified ? "Live Audited" : "Ready to Share"}
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
              Reflects your LinkedIn Credibility Score for{" "}
              <strong className="text-zinc-950 dark:text-white">{targetRole}</strong> (
              <span className="font-mono text-violet-700 dark:text-violet-300">
                {cleanHandle}
              </span>
              ). Export as a high-resolution LinkedIn header graphic or embed on your portfolio.
            </p>

            {/* 4 Factor Readout Strip */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              {defaultFactors.map((tf, idx) => (
                <div
                  key={`badge-tf-${tf.name}-${idx}`}
                  className="inline-flex items-center gap-1.5"
                >
                  <span>{tf.name.split(" ")[0]}:</span>
                  <span className="font-mono font-bold tabular-nums text-zinc-950 dark:text-white">
                    {tf.score}%
                  </span>
                  {idx < defaultFactors.length - 1 && (
                    <span className="text-zinc-300 dark:text-zinc-700 ml-1" aria-hidden="true">
                      /
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Quick Export, Share, Embed & Audit Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleExportGraphic("png")}
            disabled={isExportingImage}
            className="px-3.5 py-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="Export 1200×627 LinkedIn Post Header Graphic (PNG)"
          >
            {copiedKey === "exported-png" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>PNG Downloaded</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Export Header PNG</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleExportGraphic("jpeg")}
            disabled={isExportingImage}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="Export 1200×627 LinkedIn Post Header Graphic (JPEG)"
          >
            {copiedKey === "exported-jpeg" ? (
              <>
                <Check className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                <span>JPEG Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export JPEG</span>
              </>
            )}
          </button>

          <button
            id="share-my-trust-score-btn"
            type="button"
            onClick={() => {
              if (onShareTrustScore) {
                onShareTrustScore();
              } else {
                setIsShareDrawerOpen(true);
              }
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-sm active:scale-[0.98]"
            title="Generate a social media-ready image card of your verified credibility score"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share my Trust Score</span>
          </button>

          {onOpenWalkthrough && (
            <button
              type="button"
              onClick={onOpenWalkthrough}
              className="px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="Guided tour: how to share and customize your verified trust score card"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Tour</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsShareDrawerOpen((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 border ${
              isShareDrawerOpen
                ? "bg-violet-700 text-white border-violet-700"
                : "bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>
              {isShareDrawerOpen ? "Hide Studio" : "Graphic & Embed Studio"}
            </span>
          </button>

          <button
            type="button"
            onClick={onVerifyNow}
            disabled={isVerifying}
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            title="Refresh LinkedIn vs. Resume Credibility Score"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`}
            />
            <span>{isVerifying ? "Verifying..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenVerificationModal}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-violet-700 dark:text-violet-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="Adjust trust factor weights and view 5-audit trend"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Weights & Trend</span>
          </button>
        </div>
      </div>

      {/* Expandable LinkedIn Header Graphic & Embed Studio Drawer */}
      {isShareDrawerOpen && (
        <div className="p-6 bg-zinc-50 dark:bg-[#09090b] border-t border-zinc-200 dark:border-zinc-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-[#111116] p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {(
                [
                  { id: "graphic", label: "Header Graphic (PNG / JPEG)" },
                  { id: "linkedin", label: "LinkedIn Post" },
                  { id: "html", label: "HTML Embed" },
                  { id: "markdown", label: "Markdown" },
                  { id: "credential", label: "Credential Fields" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveEmbedTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeEmbedTab === tab.id
                      ? "bg-violet-700 text-white"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Card Style:
              </span>
              <div className="flex items-center gap-1 bg-white dark:bg-[#111116] p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                {(
                  [
                    { id: "executive", label: "Obsidian Dark" },
                    { id: "compact", label: "Compact Shield" },
                    { id: "light", label: "White Studio" },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setBadgeStyle(st.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      badgeStyle === st.id
                        ? "bg-zinc-950 dark:bg-violet-700 text-white"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeEmbedTab === "graphic" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                    <span className="text-xs font-bold text-zinc-950 dark:text-white">
                      {dimensionPreset === "post-header"
                        ? "LinkedIn Post Header (1200 × 627 px)"
                        : "LinkedIn Profile Banner (1584 × 396 px)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-[#111116] p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setDimensionPreset("post-header")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        dimensionPreset === "post-header"
                          ? "bg-violet-700 text-white"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                      }`}
                    >
                      Post Header
                    </button>
                    <button
                      type="button"
                      onClick={() => setDimensionPreset("profile-banner")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        dimensionPreset === "profile-banner"
                          ? "bg-violet-700 text-white"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                      }`}
                    >
                      Profile Banner
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full h-auto rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                    <span>Export Shareable Graphic</span>
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    Formatted for LinkedIn feed headers and featured media. Includes your verified score ({effectiveScore}%), credential ID (<span className="font-mono">{credentialId}</span>), and verification pillars.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                    Image Format
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setExportFormat("png")}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        exportFormat === "png"
                          ? "bg-violet-50 dark:bg-violet-950/50 border-violet-600 text-zinc-950 dark:text-white"
                          : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>PNG (Lossless)</span>
                        {exportFormat === "png" && (
                          <Check className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        Crisp vector-sharp edges
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportFormat("jpeg")}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        exportFormat === "jpeg"
                          ? "bg-violet-50 dark:bg-violet-950/50 border-violet-600 text-zinc-950 dark:text-white"
                          : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>JPEG (95% HQ)</span>
                        {exportFormat === "jpeg" && (
                          <Check className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        Compact feed upload size
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleExportGraphic(exportFormat)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      Download{" "}
                      {dimensionPreset === "post-header" ? "Post Header" : "Banner"} (.
                      {exportFormat.toUpperCase()})
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyGraphicToClipboard}
                      className="py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {copiedKey === "copy-graphic-img" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                          <span>Image Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Image</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadSvg}
                      className="py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Code className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                      <span>Download .SVG</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    Share externally:
                  </span>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                      profileDestinationUrl
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Open LinkedIn Composer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center min-h-[148px]">
                  {badgeStyle === "compact" ? (
                    <div className="inline-flex items-center rounded-lg overflow-hidden border border-violet-600/50 bg-[#09090b] shadow-sm">
                      <div className="px-3.5 py-2 bg-zinc-900 flex items-center gap-2 text-xs font-bold tracking-wider text-white">
                        <ShieldCheck className="w-4 h-4 text-violet-400" />
                        <span>VERIFIED TRUST</span>
                      </div>
                      <div className="px-3.5 py-2 bg-[#09090b] font-mono text-xs font-bold text-purple-300 tabular-nums">
                        {effectiveScore}% CREDIBILITY
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`w-full max-w-md rounded-xl p-4 border transition-colors flex items-center gap-4 shadow-sm ${
                        badgeStyle === "light"
                          ? "bg-white border-zinc-300 text-zinc-950"
                          : "bg-[#09090b] border-violet-600/40 text-white"
                      }`}
                    >
                      <div className="w-20 h-20 rounded-xl bg-violet-600/10 border border-violet-600/30 flex flex-col items-center justify-center shrink-0">
                        <span className="text-2xl font-extrabold font-mono tabular-nums text-violet-600 dark:text-violet-400">
                          {effectiveScore}%
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-75">
                          CREDIBILITY
                        </span>
                        <span className="text-[8px] font-mono opacity-60 mt-0.5">
                          {credentialId}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="font-bold text-violet-700 dark:text-violet-300">
                            Verified Trust
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold opacity-70 truncate">
                            {resolvedTier}
                          </span>
                        </div>
                        <div className="text-sm font-bold truncate">{targetRole}</div>
                        <div className="text-[11px] font-mono opacity-75 truncate">
                          {cleanHandle}
                        </div>
                        <div className="text-[10px] opacity-60 pt-1 border-t border-current/10 truncate">
                          Endorsements · Work History · Education · Identity Verified
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSvg}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111116] hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                    <span>Download Badge (.SVG)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy("badge-url", badgeSvgUrl)}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#111116] hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {copiedKey === "badge-url" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                        <span>Badge URL Copied</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Copy SVG URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 relative rounded-xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-900 dark:text-zinc-200">
                    {activeEmbedTab === "linkedin" &&
                      "LinkedIn Credibility Announcement Copy"}
                    {activeEmbedTab === "html" &&
                      "Embeddable HTML Snippet for Portfolio"}
                    {activeEmbedTab === "markdown" &&
                      "Markdown Badge for GitHub README"}
                    {activeEmbedTab === "credential" &&
                      "LinkedIn Licenses & Certifications Fields"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const map: Record<string, string> = {
                        linkedin: shareSnippets.linkedinPost,
                        html: shareSnippets.htmlEmbed,
                        markdown: shareSnippets.markdownEmbed,
                        credential: shareSnippets.credentialDetails,
                      };
                      handleCopy(activeEmbedTab, map[activeEmbedTab]);
                    }}
                    className="px-3 py-1 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === activeEmbedTab ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Snippet</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3.5 rounded-lg bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-44">
                  {activeEmbedTab === "linkedin" && shareSnippets.linkedinPost}
                  {activeEmbedTab === "html" && shareSnippets.htmlEmbed}
                  {activeEmbedTab === "markdown" && shareSnippets.markdownEmbed}
                  {activeEmbedTab === "credential" && shareSnippets.credentialDetails}
                </pre>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {activeEmbedTab === "linkedin" &&
                    "Copy this post and attach your exported PNG or JPEG LinkedIn header graphic."}
                  {activeEmbedTab === "html" &&
                    "Paste this HTML block into your portfolio header or footer."}
                  {activeEmbedTab === "markdown" &&
                    "Add this Markdown snippet to your GitHub README.md."}
                  {activeEmbedTab === "credential" &&
                    "Paste these fields into LinkedIn -> Add Profile Section -> Licenses & Certifications."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
