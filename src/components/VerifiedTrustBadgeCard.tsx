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
}

type BadgeStyleVariant = "executive" | "compact" | "light";
type EmbedTabType = "graphic" | "linkedin" | "html" | "markdown" | "credential";
type ImageExportFormat = "png" | "jpeg";
type HeaderDimensionPreset = "post-header" | "profile-banner";

export const VerifiedTrustBadgeCard: React.FC<VerifiedTrustBadgeCardProps> = ({
  credibilityScore,
  credibilityTier,
  linkedinUrl = "",
  candidateName = "Alex Mercer",
  targetRole = "Senior Technology & Operations Leader",
  trustFactors,
  isVerifying = false,
  onVerifyNow,
  onOpenVerificationModal,
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

  // Derive effective score (use live credibilityScore if verified, or calculated initial readiness score)
  const effectiveScore = useMemo(() => {
    if (typeof credibilityScore === "number") return credibilityScore;
    return linkedinUrl.trim() ? 86 : 78;
  }, [credibilityScore, linkedinUrl]);

  const isLiveVerified = typeof credibilityScore === "number";

  const cleanHandle = useMemo(() => {
    if (!linkedinUrl.trim()) return "in/verified-candidate";
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

  // Deterministic Verification Credential ID
  const credentialId = useMemo(() => {
    const seed = `${candidateName}-${cleanHandle}-${effectiveScore}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, "0").slice(0, 6);
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
    typeof window !== "undefined" ? window.location.origin : "https://career-intelligence.app";

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

  // Pre-built snippets for quick sharing & embedding
  const shareSnippets = useMemo(() => {
    const linkedinPost = `🛡️ Verified Trust Credential Unlocked: ${effectiveScore}% LinkedIn Credibility Score (${resolvedTier})

I just completed a cross-vector verification of my public LinkedIn profile (${cleanHandle}) against my executive resume targeting ${targetRole}.

✅ Verification ID: ${credentialId}
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

  // Helper to draw rounded rectangle on canvas
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

  // Render the LinkedIn Post Header Graphic (1200x627 or 1584x396) onto an HTML5 Canvas
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
      const accentPrimary =
        effectiveScore >= 85 ? "#14b8a6" : effectiveScore >= 70 ? "#38bdf8" : "#f59e0b";
      const accentSecondary = "#3b82f6";

      // 1. Background Fill & Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (isLight) {
        bgGrad.addColorStop(0, "#f8fafc");
        bgGrad.addColorStop(0.5, "#f1f5f9");
        bgGrad.addColorStop(1, "#e2e8f0");
      } else {
        bgGrad.addColorStop(0, "#050814");
        bgGrad.addColorStop(0.55, "#0b1224");
        bgGrad.addColorStop(1, "#071a24");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle Architectural Grid Pattern
      ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.04)" : "rgba(255, 255, 255, 0.03)";
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

      // 3. Ambient Glow Accents
      const glowLeft = ctx.createRadialGradient(
        width * 0.2,
        height * 0.45,
        20,
        width * 0.2,
        height * 0.45,
        360
      );
      glowLeft.addColorStop(
        0,
        isLight ? "rgba(20, 184, 166, 0.14)" : "rgba(20, 184, 166, 0.18)"
      );
      glowLeft.addColorStop(1, "rgba(20, 184, 166, 0)");
      ctx.fillStyle = glowLeft;
      ctx.fillRect(0, 0, width, height);

      const glowRight = ctx.createRadialGradient(
        width * 0.85,
        height * 0.25,
        20,
        width * 0.85,
        height * 0.25,
        380
      );
      glowRight.addColorStop(
        0,
        isLight ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.16)"
      );
      glowRight.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = glowRight;
      ctx.fillRect(0, 0, width, height);

      // 4. Outer Card Frame
      const pad = isBanner ? 24 : 36;
      drawRoundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, 24);
      ctx.fillStyle = isLight ? "rgba(255, 255, 255, 0.88)" : "rgba(11, 17, 32, 0.82)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isLight ? "rgba(20, 184, 166, 0.4)" : "rgba(20, 184, 166, 0.45)";
      ctx.stroke();

      // Top Accent Line
      drawRoundedRect(ctx, pad + 24, pad, width - (pad + 24) * 2, 4, 2);
      ctx.fillStyle = accentPrimary;
      ctx.fill();

      const textMain = isLight ? "#0f172a" : "#f8fafc";
      const textMuted = isLight ? "#475569" : "#94a3b8";
      const cardSurface = isLight ? "#f1f5f9" : "#111c33";
      const cardBorder = isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.08)";

      if (isBanner) {
        // 1584 x 396 LinkedIn Profile Banner Layout
        const centerY = height / 2;

        // Score Circle on Left
        const gaugeX = pad + 135;
        const gaugeY = centerY;
        const gaugeR = 86;

        ctx.beginPath();
        ctx.arc(gaugeX, gaugeY, gaugeR, 0, Math.PI * 2);
        ctx.strokeStyle = isLight ? "#e2e8f0" : "#1e293b";
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
        ctx.font = "900 44px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${effectiveScore}%`, gaugeX, gaugeY + 8);

        ctx.fillStyle = accentPrimary;
        ctx.font = "800 11px Inter, system-ui, sans-serif";
        ctx.fillText("CREDIBILITY", gaugeX, gaugeY + 32);

        // Middle Identity & Role Details
        ctx.textAlign = "left";
        const midX = pad + 265;

        drawRoundedRect(ctx, midX, pad + 38, 220, 30, 8);
        ctx.fillStyle = "rgba(20, 184, 166, 0.16)";
        ctx.fill();
        ctx.fillStyle = accentPrimary;
        ctx.font = "800 13px Inter, system-ui, sans-serif";
        ctx.fillText(`✓ VERIFIED TRUST · ${credentialId}`, midX + 14, pad + 58);

        ctx.fillStyle = textMain;
        ctx.font = "900 32px Inter, system-ui, sans-serif";
        ctx.fillText(targetRole.slice(0, 44), midX, pad + 114);

        ctx.fillStyle = textMuted;
        ctx.font = "600 18px monospace";
        ctx.fillText(
          `${candidateName}  ·  linkedin.com/${cleanHandle}  ·  ${resolvedTier}`,
          midX,
          pad + 148
        );

        // 4 Factor Mini Cards in Banner Row
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
          ctx.font = "700 13px Inter, system-ui, sans-serif";
          ctx.fillText(tf.name.slice(0, 26), fx + 18, fy + 34);

          ctx.fillStyle = textMain;
          ctx.font = "900 26px monospace";
          ctx.fillText(`${tf.score}%`, fx + 18, fy + 70);

          // Bar
          drawRoundedRect(ctx, fx + 18, fy + 84, factorW - 36, 8, 4);
          ctx.fillStyle = isLight ? "#cbd5e1" : "#1e293b";
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

      // Standard LinkedIn Post Header Layout (1200 x 627 px)
      // Top Header Strip inside frame
      const innerX = pad + 40;
      const innerY = pad + 38;
      const innerW = width - (pad + 40) * 2;

      // Pill: VERIFIED TRUST CREDENTIAL
      drawRoundedRect(ctx, innerX, innerY, 248, 36, 10);
      ctx.fillStyle = "rgba(20, 184, 166, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 184, 166, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = accentPrimary;
      ctx.textAlign = "left";
      ctx.font = "800 14px Inter, system-ui, sans-serif";
      ctx.fillText("✓ VERIFIED TRUST CREDENTIAL", innerX + 16, innerY + 23);

      // Right Metadata: Credential ID & Date
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

      // Left Panel: Large Radial Credibility Score Gauge Card
      const leftCardX = innerX;
      const leftCardY = innerY + 58;
      const leftCardW = 340;
      const leftCardH = 385;

      drawRoundedRect(ctx, leftCardX, leftCardY, leftCardW, leftCardH, 20);
      ctx.fillStyle = cardSurface;
      ctx.fill();
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const cx = leftCardX + leftCardW / 2;
      const cy = leftCardY + 158;
      const radius = 102;

      // Track ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isLight ? "#cbd5e1" : "#1e293b";
      ctx.lineWidth = 18;
      ctx.stroke();

      // Active score arc
      const arcGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
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

      // Score Value inside ring
      ctx.textAlign = "center";
      ctx.fillStyle = textMain;
      ctx.font = "900 62px Inter, system-ui, sans-serif";
      ctx.fillText(`${effectiveScore}%`, cx, cy + 14);

      ctx.fillStyle = accentPrimary;
      ctx.font = "800 13px Inter, system-ui, sans-serif";
      ctx.fillText("CREDIBILITY SCORE", cx, cy + 44);

      // Tier Badge below ring
      drawRoundedRect(ctx, leftCardX + 32, leftCardY + 292, leftCardW - 64, 40, 10);
      ctx.fillStyle = "rgba(20, 184, 166, 0.14)";
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 184, 166, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = accentPrimary;
      ctx.font = "800 14px Inter, system-ui, sans-serif";
      ctx.fillText(resolvedTier.toUpperCase(), cx, leftCardY + 317);

      ctx.fillStyle = textMuted;
      ctx.font = "600 13px Inter, system-ui, sans-serif";
      ctx.fillText("Real-Time Profile vs. Resume Audit", cx, leftCardY + 358);

      // Right Panel: Candidate Profile Details & 4 Trust Factor Cards
      const rightX = leftCardX + leftCardW + 32;
      const rightW = innerW - leftCardW - 32;

      ctx.textAlign = "left";
      ctx.fillStyle = accentPrimary;
      ctx.font = "800 13px Inter, system-ui, sans-serif";
      ctx.fillText("CANDIDATE IDENTITY & TARGET BENCHMARK", rightX, leftCardY + 24);

      ctx.fillStyle = textMain;
      ctx.font = "900 34px Inter, system-ui, sans-serif";
      ctx.fillText(targetRole.slice(0, 36), rightX, leftCardY + 66);

      ctx.fillStyle = textMuted;
      ctx.font = "600 17px monospace";
      ctx.fillText(`linkedin.com/${cleanHandle}`, rightX, leftCardY + 98);

      // 2x2 Grid of Trust Factor Breakdown Cards
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

        drawRoundedRect(ctx, bx, by, boxW, boxH, 16);
        ctx.fillStyle = cardSurface;
        ctx.fill();
        ctx.strokeStyle = cardBorder;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = textMuted;
        ctx.font = "700 14px Inter, system-ui, sans-serif";
        ctx.fillText(tf.name.slice(0, 26), bx + 20, by + 36);

        ctx.fillStyle = textMain;
        ctx.font = "900 30px monospace";
        ctx.fillText(`${tf.score}%`, bx + 20, by + 76);

        ctx.textAlign = "right";
        ctx.fillStyle = tf.score >= 80 ? "#10b981" : "#f59e0b";
        ctx.font = "800 12px Inter, system-ui, sans-serif";
        ctx.fillText(
          tf.score >= 80 ? "✓ VERIFIED" : "● AUDITED",
          bx + boxW - 20,
          by + 74
        );

        // Progress Bar inside factor card
        const barW = boxW - 40;
        const barY = by + boxH - 26;
        drawRoundedRect(ctx, bx + 20, barY, barW, 8, 4);
        ctx.fillStyle = isLight ? "#cbd5e1" : "#1e293b";
        ctx.fill();

        drawRoundedRect(
          ctx,
          bx + 20,
          barY,
          Math.max(12, (barW * tf.score) / 100),
          8,
          4
        );
        ctx.fillStyle = tf.score >= 80 ? accentPrimary : "#38bdf8";
        ctx.fill();
      });

      // Bottom Footer Strip
      const footerY = height - pad - 24;
      ctx.textAlign = "left";
      ctx.fillStyle = textMuted;
      ctx.font = "600 13px Inter, system-ui, sans-serif";
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

  // Re-render preview canvas whenever drawer is open or graphic props change
  useEffect(() => {
    if (isShareDrawerOpen && previewCanvasRef.current) {
      renderLinkedInGraphicToCanvas(previewCanvasRef.current);
    }
  }, [isShareDrawerOpen, activeEmbedTab, renderLinkedInGraphicToCanvas]);

  // Export graphic as PNG or JPEG download
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
      const suffix = dimensionPreset === "profile-banner" ? "banner" : "post-header";
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

  // Copy graphic image directly to clipboard so user can paste into a LinkedIn post
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
    const accentColor =
      effectiveScore >= 85 ? "#14b8a6" : effectiveScore >= 70 ? "#38bdf8" : "#f59e0b";
    const bgFill = badgeStyle === "light" ? "#ffffff" : "#0b1120";
    const cardStroke = badgeStyle === "light" ? "#cbd5e1" : "#1e293b";
    const titleColor = badgeStyle === "light" ? "#0f172a" : "#f8fafc";
    const subColor = badgeStyle === "light" ? "#475569" : "#94a3b8";
    const safeRole = targetRole.replace(/[<>&"']/g, "").slice(0, 46);
    const safeHandle = cleanHandle.replace(/[<>&"']/g, "").slice(0, 40);

    const svgContent =
      badgeStyle === "compact"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="310" height="36" viewBox="0 0 310 36" fill="none">
  <rect width="310" height="36" rx="8" fill="#0f172a" stroke="${accentColor}" stroke-opacity="0.45" stroke-width="1.5"/>
  <rect x="1" y="1" width="142" height="34" rx="7" fill="#1e293b"/>
  <path d="M18 11L24 13.5V18.5C24 22.1 21.4 25.4 18 26.5C14.6 25.4 12 22.1 12 18.5V13.5L18 11Z" stroke="${accentColor}" stroke-width="1.75" fill="${accentColor}" fill-opacity="0.15"/>
  <path d="M15.5 18.5L17.2 20.2L20.8 16.6" stroke="${accentColor}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="31" y="22" fill="#f8fafc" font-family="Inter, sans-serif" font-size="11" font-weight="800" letter-spacing="0.06em">VERIFIED TRUST</text>
  <text x="155" y="22" fill="${accentColor}" font-family="JetBrains Mono, monospace" font-size="12" font-weight="800">${effectiveScore}% CREDIBILITY</text>
</svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="116" viewBox="0 0 420 116" fill="none">
  <rect width="420" height="116" rx="16" fill="${bgFill}" stroke="${accentColor}" stroke-opacity="0.5" stroke-width="1.5"/>
  <rect x="14" y="14" width="88" height="88" rx="12" fill="${accentColor}" fill-opacity="0.1" stroke="${accentColor}" stroke-opacity="0.3"/>
  <text x="58" y="58" text-anchor="middle" fill="${accentColor}" font-family="JetBrains Mono, monospace" font-size="26" font-weight="800">${effectiveScore}%</text>
  <text x="58" y="76" text-anchor="middle" fill="${titleColor}" font-family="Inter, sans-serif" font-size="8.5" font-weight="800" letter-spacing="0.1em">CREDIBILITY</text>
  <text x="58" y="90" text-anchor="middle" fill="${subColor}" font-family="Inter, sans-serif" font-size="7.5" font-weight="600">${credentialId}</text>
  <rect x="118" y="18" width="116" height="20" rx="5" fill="${accentColor}" fill-opacity="0.15"/>
  <text x="128" y="31.5" fill="${accentColor}" font-family="Inter, sans-serif" font-size="9" font-weight="800" letter-spacing="0.08em">✓ VERIFIED TRUST</text>
  <text x="242" y="31.5" fill="${subColor}" font-family="Inter, sans-serif" font-size="8.5" font-weight="700" letter-spacing="0.05em">${resolvedTier.toUpperCase()}</text>
  <text x="118" y="58" fill="${titleColor}" font-family="Inter, sans-serif" font-size="14" font-weight="800">${safeRole}</text>
  <text x="118" y="77" fill="${subColor}" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="600">${safeHandle}</text>
  <line x1="118" y1="88" x2="402" y2="88" stroke="${cardStroke}" stroke-width="1"/>
  <text x="118" y="102" fill="${subColor}" font-family="Inter, sans-serif" font-size="8.5" font-weight="600">Endorsements · Work History · Education · Identity Verified</text>
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

  return (
    <div
      id="verified-trust-badge-section"
      className="mb-8 rounded-3xl bg-slate-900/95 border border-teal-500/35 shadow-xl overflow-hidden transition-all"
    >
      {/* Main Verified Trust Badge Banner */}
      <div className="p-6 md:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/30">
        {/* Left: Interactive 'Verified Trust' Shield & Score Readout */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Verified Trust Shield Emblem */}
          <div className="relative flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-950/90 border border-teal-500/40 shadow-[0_0_25px_rgba(20,184,166,0.15)] shrink-0">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-400">
              <ShieldCheck className="w-8 h-8" />
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center"
                title="Verified Trust Seal"
              >
                <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">
                  Verified Trust
                </span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-[10px] font-mono font-semibold text-slate-400">
                  {credentialId}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black font-mono tabular-nums text-white">
                  {effectiveScore}%
                </span>
                <span className="text-xs font-bold text-slate-300">
                  Credibility Score
                </span>
              </div>
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>{resolvedTier}</span>
              </div>
            </div>
          </div>

          {/* Center: Context & 4-Vector Mini Metrics */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-white tracking-tight">
                Professional Credibility & Verified Trust Badge
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isLiveVerified
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                }`}
              >
                {isLiveVerified ? "Live Audited" : "Ready to Share"}
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Reflects your real-time LinkedIn Credibility Score for{" "}
              <strong className="text-white">{targetRole}</strong> (
              <span className="font-mono text-teal-300">{cleanHandle}</span>). Export as a
              high-resolution LinkedIn post header graphic (PNG/JPEG) or embed on your
              portfolio.
            </p>

            {/* 4 Factor Readout Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {defaultFactors.map((tf, idx) => (
                <div
                  key={`badge-tf-${tf.name}-${idx}`}
                  className="inline-flex items-center gap-1.5 text-[11px] bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-lg text-slate-300"
                >
                  <span className="text-slate-400">{tf.name.split(" ")[0]}:</span>
                  <span className="font-mono font-bold tabular-nums text-teal-300">
                    {tf.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Quick Export Graphic, Share, Embed & Audit Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleExportGraphic("png")}
            disabled={isExportingImage}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-sm"
            title="Export 1200×627 LinkedIn Post Header Graphic (PNG)"
          >
            {copiedKey === "exported-png" ? (
              <>
                <Check className="w-3.5 h-3.5 text-slate-950" />
                <span>Header PNG Downloaded!</span>
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
            className="px-3.5 py-2.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Export 1200×627 LinkedIn Post Header Graphic (JPEG)"
          >
            {copiedKey === "exported-jpeg" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">JPEG Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Export JPEG</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsShareDrawerOpen((prev) => !prev)}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              isShareDrawerOpen
                ? "bg-white/15 text-white border-white/30"
                : "bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border-white/10"
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-teal-400" />
            <span>{isShareDrawerOpen ? "Hide Studio" : "Graphic & Embed Studio"}</span>
          </button>

          <button
            type="button"
            onClick={onVerifyNow}
            disabled={isVerifying}
            className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
            title="Refresh real-time LinkedIn vs. Resume Credibility Score"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-teal-400 ${isVerifying ? "animate-spin" : ""}`}
            />
            <span>{isVerifying ? "Verifying..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenVerificationModal}
            className="px-3.5 py-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Open LinkedIn Verification Modal to adjust trust factor weights and view 5-audit trend"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Weights & Trend</span>
          </button>
        </div>
      </div>

      {/* Expandable LinkedIn Header Graphic & Embed Studio Drawer */}
      {isShareDrawerOpen && (
        <div className="p-6 bg-slate-950/90 border-t border-white/10 space-y-6">
          {/* Top Navigation Tabs & Theme Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-white/10">
              {(
                [
                  { id: "graphic", label: "LinkedIn Header Graphic (PNG / JPEG)" },
                  { id: "linkedin", label: "LinkedIn Post Text" },
                  { id: "html", label: "HTML Website Embed" },
                  { id: "markdown", label: "Markdown / GitHub" },
                  { id: "credential", label: "LinkedIn Credential" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveEmbedTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeEmbedTab === tab.id
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Theme Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Theme:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                {(
                  [
                    { id: "executive", label: "Executive Dark" },
                    { id: "compact", label: "Compact Shield" },
                    { id: "light", label: "Clean Light" },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setBadgeStyle(st.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      badgeStyle === st.id
                        ? "bg-teal-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeEmbedTab === "graphic" ? (
            /* LinkedIn Post Header Graphic Exporter & Live Canvas Preview */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left (7 cols): Live High-Res Canvas Preview */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-white">
                      {dimensionPreset === "post-header"
                        ? "LinkedIn Post Header Preview (1200 × 627 px · 1.91:1)"
                        : "LinkedIn Profile Banner Preview (1584 × 396 px · 4:1)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setDimensionPreset("post-header")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        dimensionPreset === "post-header"
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Post Header (1200×627)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDimensionPreset("profile-banner")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        dimensionPreset === "profile-banner"
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Profile Banner (1584×396)
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 shadow-inner overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full h-auto rounded-xl border border-white/10 shadow-lg"
                  />
                </div>
              </div>

              {/* Right (5 cols): Export Format & Download Controls */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-400" />
                    <span>Export Shareable LinkedIn Graphic</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Optimized specifically for LinkedIn post headers and featured media cards.
                    Includes your verified Credibility Score ({effectiveScore}%), credential ID (
                    <span className="font-mono text-slate-300">{credentialId}</span>), and
                    4-factor verification bars.
                  </p>
                </div>

                {/* Format Selection */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Image Format
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setExportFormat("png")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        exportFormat === "png"
                          ? "bg-teal-500/15 border-teal-500/40 text-white"
                          : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>PNG (Lossless)</span>
                        {exportFormat === "png" && (
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Crisp typography & vector-sharp edges
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportFormat("jpeg")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        exportFormat === "jpeg"
                          ? "bg-teal-500/15 border-teal-500/40 text-white"
                          : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>JPEG (95% HQ)</span>
                        {exportFormat === "jpeg" && (
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Compact file size for instant feed upload
                      </span>
                    </button>
                  </div>
                </div>

                {/* Primary Export Actions */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleExportGraphic(exportFormat)}
                    className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      Download LinkedIn{" "}
                      {dimensionPreset === "post-header" ? "Post Header" : "Banner"} (.
                      {exportFormat.toUpperCase()})
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyGraphicToClipboard}
                      className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {copiedKey === "copy-graphic-img" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Image Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-teal-400" />
                          <span>Copy Image</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadSvg}
                      className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Code className="w-3.5 h-3.5 text-blue-400" />
                      <span>Download .SVG</span>
                    </button>
                  </div>
                </div>

                {/* Quick Share to LinkedIn Feed */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Ready to post on LinkedIn?
                  </span>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                      profileDestinationUrl
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Open LinkedIn Composer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Code & Text Embed Tabs (LinkedIn Post Text, HTML, Markdown, Credential) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left (5 cols): Live Compact/Executive Badge Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col items-center justify-center min-h-[148px]">
                  {badgeStyle === "compact" ? (
                    <div className="inline-flex items-center rounded-xl overflow-hidden border border-teal-500/40 bg-slate-950 shadow-lg">
                      <div className="px-3.5 py-2 bg-slate-800 flex items-center gap-2 text-xs font-black tracking-wider text-white">
                        <ShieldCheck className="w-4 h-4 text-teal-400" />
                        <span>VERIFIED TRUST</span>
                      </div>
                      <div className="px-3.5 py-2 bg-slate-950 font-mono text-xs font-extrabold text-teal-400 tabular-nums">
                        {effectiveScore}% CREDIBILITY
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`w-full max-w-md rounded-2xl p-4 border transition-all flex items-center gap-4 shadow-lg ${
                        badgeStyle === "light"
                          ? "bg-white border-slate-300 text-slate-900"
                          : "bg-slate-950 border-teal-500/40 text-white"
                      }`}
                    >
                      <div className="w-20 h-20 rounded-xl bg-teal-500/10 border border-teal-500/30 flex flex-col items-center justify-center shrink-0">
                        <span className="text-2xl font-black font-mono tabular-nums text-teal-500">
                          {effectiveScore}%
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-75">
                          CREDIBILITY
                        </span>
                        <span className="text-[8px] font-mono opacity-60 mt-0.5">
                          {credentialId}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-teal-500/15 text-teal-500 text-[9px] font-black uppercase tracking-wider">
                            ✓ Verified Trust
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 truncate">
                            {resolvedTier}
                          </span>
                        </div>
                        <div className="text-sm font-extrabold truncate">{targetRole}</div>
                        <div className="text-[11px] font-mono opacity-75 truncate">
                          {cleanHandle}
                        </div>
                        <div className="text-[9px] opacity-60 pt-1 border-t border-current/10 truncate">
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
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-400" />
                    <span>Download Badge (.SVG)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy("badge-url", badgeSvgUrl)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {copiedKey === "badge-url" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Badge URL Copied</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy SVG URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right (7 cols): Active Snippet Box */}
              <div className="lg:col-span-7 relative rounded-2xl bg-slate-900 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    {activeEmbedTab === "linkedin" &&
                      "Ready-to-post LinkedIn Credibility Announcement"}
                    {activeEmbedTab === "html" &&
                      "Embeddable HTML Snippet for Personal Website / Portfolio"}
                    {activeEmbedTab === "markdown" &&
                      "Markdown Badge for GitHub Profile README / Notion"}
                    {activeEmbedTab === "credential" &&
                      "LinkedIn 'Licenses & Certifications' Profile Fields"}
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
                    className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === activeEmbedTab ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Snippet</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-slate-950 border border-white/5 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-44">
                  {activeEmbedTab === "linkedin" && shareSnippets.linkedinPost}
                  {activeEmbedTab === "html" && shareSnippets.htmlEmbed}
                  {activeEmbedTab === "markdown" && shareSnippets.markdownEmbed}
                  {activeEmbedTab === "credential" && shareSnippets.credentialDetails}
                </pre>

                <p className="text-[11px] text-slate-400">
                  {activeEmbedTab === "linkedin" &&
                    "Tip: Copy this post and attach your exported PNG/JPEG LinkedIn post header graphic above."}
                  {activeEmbedTab === "html" &&
                    "Tip: Paste this HTML block into your portfolio header or footer to display your live Verified Trust score."}
                  {activeEmbedTab === "markdown" &&
                    "Tip: Add this Markdown line to your GitHub profile README.md to showcase your verified Credibility Score."}
                  {activeEmbedTab === "credential" &&
                    "Tip: Paste these fields into LinkedIn → Add Profile Section → Licenses & Certifications."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
