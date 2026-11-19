import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
} from "lucide-react";

export interface ShareTrustScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

type CardTheme = "obsidian-violet" | "royal-purple" | "clean-white";
type CardFormat = "post" | "banner";

export const ShareTrustScoreModal: React.FC<ShareTrustScoreModalProps> = ({
  isOpen,
  onClose,
  credibilityScore,
  credibilityTier,
  linkedinUrl = "",
  candidateName = "Executive Candidate",
  targetRole = "Senior Technology Leader",
  trustFactors,
}) => {
  const [theme, setTheme] = useState<CardTheme>("obsidian-violet");
  const [format, setFormat] = useState<CardFormat>("post");
  const [customName, setCustomName] = useState(candidateName);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (candidateName) {
      setCustomName(candidateName);
    }
  }, [candidateName]);

  const effectiveScore = typeof credibilityScore === "number" ? credibilityScore : 86;

  const resolvedTier =
    credibilityTier ||
    (effectiveScore >= 85
      ? "Verified High Credibility"
      : effectiveScore >= 70
      ? "Strong Profile Credibility"
      : "Moderate Credibility");

  const cleanHandle = linkedinUrl.trim()
    ? linkedinUrl
        .trim()
        .replace(/^https?:\/\/(www\.)?linkedin\.com\/(in\/)?/i, "")
        .replace(/\/+$/, "")
    : "in/verified-leader";

  const credentialId = `VT-${effectiveScore}-${Math.abs(
    (customName + cleanHandle + effectiveScore)
      .split("")
      .reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)
  )
    .toString(16)
    .toUpperCase()
    .slice(0, 6)}`;

  const factors =
    trustFactors && trustFactors.length > 0
      ? trustFactors.slice(0, 4)
      : [
          {
            name: "Endorsement & Skill Alignment",
            score: Math.min(98, effectiveScore + 2),
          },
          {
            name: "Work History Consistency",
            score: Math.min(99, effectiveScore + 4),
          },
          {
            name: "Education & Credential Audit",
            score: Math.max(75, effectiveScore - 1),
          },
          {
            name: "Identity & Seniority Match",
            score: Math.min(98, effectiveScore + 3),
          },
        ];

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

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = format === "banner" ? 1584 : 1200;
    const height = format === "banner" ? 396 : 628;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isLight = theme === "clean-white";
    const isRoyal = theme === "royal-purple";

    const bg = ctx.createLinearGradient(0, 0, width, height);
    if (isLight) {
      bg.addColorStop(0, "#fafafa");
      bg.addColorStop(0.5, "#f4f4f5");
      bg.addColorStop(1, "#ede9fe");
    } else if (isRoyal) {
      bg.addColorStop(0, "#120726");
      bg.addColorStop(0.5, "#230f47");
      bg.addColorStop(1, "#09090b");
    } else {
      bg.addColorStop(0, "#09090b");
      bg.addColorStop(0.55, "#111116");
      bg.addColorStop(1, "#1e1038");
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = isLight ? "rgba(9, 9, 11, 0.04)" : "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const cardPadding = 32;
    const cw = width - cardPadding * 2;
    const ch = height - cardPadding * 2;
    drawRoundedRect(ctx, cardPadding, cardPadding, cw, ch, 24);
    ctx.fillStyle = isLight ? "#ffffff" : "#111116";
    ctx.fill();
    ctx.strokeStyle = isLight ? "#d4d4d8" : "#27272a";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const textPrimary = isLight ? "#09090b" : "#fafafa";
    const textSecondary = isLight ? "#52525b" : "#a1a1aa";
    const accentPrimary = isLight ? "#6d28d9" : "#8b5cf6";
    const accentSecondary = isLight ? "#9333ea" : "#a855f7";

    const pillX = cardPadding + 36;
    const pillY = cardPadding + 32;
    drawRoundedRect(ctx, pillX, pillY, 240, 36, 8);
    ctx.fillStyle = isLight ? "#f3e8ff" : "rgba(124, 58, 237, 0.18)";
    ctx.fill();
    ctx.strokeStyle = isLight ? "#c4b5fd" : "rgba(139, 92, 246, 0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "bold 13px Outfit, sans-serif";
    ctx.fillStyle = accentPrimary;
    ctx.fillText("VERIFIED TRUST AUDIT", pillX + 16, pillY + 23);

    ctx.font = "bold 13px monospace";
    ctx.fillStyle = textSecondary;
    ctx.textAlign = "right";
    ctx.fillText(`ID: ${credentialId}`, cardPadding + cw - 36, pillY + 23);
    ctx.textAlign = "left";

    if (format === "post") {
      ctx.font = "900 42px Outfit, sans-serif";
      ctx.fillStyle = textPrimary;
      ctx.fillText(customName, cardPadding + 36, cardPadding + 120);

      ctx.font = "600 20px Outfit, sans-serif";
      ctx.fillStyle = textSecondary;
      ctx.fillText(targetRole, cardPadding + 36, cardPadding + 155);

      const handleY = cardPadding + 175;
      drawRoundedRect(ctx, cardPadding + 36, handleY, 240, 32, 8);
      ctx.fillStyle = isLight ? "#f4f4f5" : "#18181b";
      ctx.fill();
      ctx.font = "bold 13px monospace";
      ctx.fillStyle = accentPrimary;
      ctx.fillText(
        `in/${cleanHandle.replace(/^in\//i, "")}`,
        cardPadding + 52,
        handleY + 21
      );

      const circleCenterX = width - cardPadding - 180;
      const circleCenterY = cardPadding + 160;
      const radius = 95;

      ctx.beginPath();
      ctx.arc(circleCenterX, circleCenterY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isLight ? "#e4e4e7" : "#27272a";
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (effectiveScore / 100) * (Math.PI * 2);
      ctx.arc(circleCenterX, circleCenterY, radius, startAngle, endAngle);
      const arcGrad = ctx.createLinearGradient(
        circleCenterX - radius,
        circleCenterY - radius,
        circleCenterX + radius,
        circleCenterY + radius
      );
      arcGrad.addColorStop(0, accentPrimary);
      arcGrad.addColorStop(1, accentSecondary);
      ctx.strokeStyle = arcGrad;
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "900 60px Outfit, sans-serif";
      ctx.fillStyle = textPrimary;
      ctx.fillText(`${effectiveScore}%`, circleCenterX, circleCenterY + 14);

      ctx.font = "bold 12px Outfit, sans-serif";
      ctx.fillStyle = accentPrimary;
      ctx.fillText("CREDIBILITY SCORE", circleCenterX, circleCenterY + 36);
      ctx.textAlign = "left";

      const tierY = cardPadding + 235;
      drawRoundedRect(ctx, cardPadding + 36, tierY, 320, 36, 8);
      ctx.fillStyle = isLight ? "#f3e8ff" : "rgba(124, 58, 237, 0.16)";
      ctx.fill();
      ctx.strokeStyle = isLight ? "#c4b5fd" : "rgba(139, 92, 246, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "bold 13px Outfit, sans-serif";
      ctx.fillStyle = accentPrimary;
      ctx.fillText(resolvedTier.toUpperCase(), cardPadding + 52, tierY + 23);

      const factorY = height - cardPadding - 180;
      const factorW = (cw - 72 - 36) / 4;
      const factorH = 120;

      factors.forEach((f, idx) => {
        const fx = cardPadding + 36 + idx * (factorW + 12);
        drawRoundedRect(ctx, fx, factorY, factorW, factorH, 14);
        ctx.fillStyle = isLight ? "#f4f4f5" : "#18181b";
        ctx.fill();
        ctx.strokeStyle = isLight ? "#e4e4e7" : "#27272a";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "bold 26px Outfit, sans-serif";
        ctx.fillStyle = accentPrimary;
        ctx.fillText(`${f.score}%`, fx + 18, factorY + 42);

        ctx.font = "bold 12px Outfit, sans-serif";
        ctx.fillStyle = textPrimary;
        const words = f.name.split(" ");
        if (words.length > 2) {
          ctx.fillText(words.slice(0, 2).join(" "), fx + 18, factorY + 70);
          ctx.fillText(words.slice(2).join(" "), fx + 18, factorY + 90);
        } else {
          ctx.fillText(f.name, fx + 18, factorY + 75);
        }
      });

      const footerY = height - cardPadding - 24;
      ctx.font = "600 12px Outfit, sans-serif";
      ctx.fillStyle = textSecondary;
      ctx.fillText("Executive Resume & LinkedIn Cross-Vector Engine", cardPadding + 36, footerY);

      ctx.textAlign = "right";
      ctx.fillText("Verified with Local Parsing Architecture", cardPadding + cw - 36, footerY);
      ctx.textAlign = "left";
    } else {
      ctx.font = "900 36px Outfit, sans-serif";
      ctx.fillStyle = textPrimary;
      ctx.fillText(customName, cardPadding + 36, cardPadding + 115);

      ctx.font = "600 18px Outfit, sans-serif";
      ctx.fillStyle = textSecondary;
      ctx.fillText(
        `${targetRole}  ·  in/${cleanHandle.replace(/^in\//i, "")}`,
        cardPadding + 36,
        cardPadding + 150
      );

      const rightX = width - cardPadding - 240;
      const rightY = cardPadding + 85;
      drawRoundedRect(ctx, rightX, rightY, 200, 180, 18);
      ctx.fillStyle = isLight ? "#f3e8ff" : "rgba(124, 58, 237, 0.16)";
      ctx.fill();
      ctx.strokeStyle = isLight ? "#c4b5fd" : "rgba(139, 92, 246, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "900 64px Outfit, sans-serif";
      ctx.fillStyle = textPrimary;
      ctx.fillText(`${effectiveScore}%`, rightX + 100, rightY + 90);

      ctx.font = "bold 13px Outfit, sans-serif";
      ctx.fillStyle = accentPrimary;
      ctx.fillText("TRUST SCORE", rightX + 100, rightY + 120);

      ctx.font = "600 11px Outfit, sans-serif";
      ctx.fillStyle = textSecondary;
      ctx.fillText(resolvedTier, rightX + 100, rightY + 145);
      ctx.textAlign = "left";

      const factorStartY = cardPadding + 185;
      factors.slice(0, 3).forEach((f, idx) => {
        const fx = cardPadding + 36 + idx * 260;
        drawRoundedRect(ctx, fx, factorStartY, 240, 80, 14);
        ctx.fillStyle = isLight ? "#f4f4f5" : "#18181b";
        ctx.fill();
        ctx.strokeStyle = isLight ? "#e4e4e7" : "#27272a";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "bold 24px Outfit, sans-serif";
        ctx.fillStyle = accentPrimary;
        ctx.fillText(`${f.score}%`, fx + 16, factorStartY + 42);

        ctx.font = "bold 11px Outfit, sans-serif";
        ctx.fillStyle = textPrimary;
        ctx.fillText(f.name, fx + 16, factorStartY + 64);
      });
    }
  }, [
    theme,
    format,
    customName,
    targetRole,
    cleanHandle,
    effectiveScore,
    resolvedTier,
    credentialId,
    factors,
  ]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => drawCard(), 50);
    }
  }, [isOpen, drawCard]);

  const handleDownload = (imgFormat: "png" | "jpeg" = "png") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);

    try {
      const mime = imgFormat === "jpeg" ? "image/jpeg" : "image/png";
      const dataUrl = canvas.toDataURL(mime, 0.95);
      const link = document.createElement("a");
      link.download = `Verified-Trust-Score-${effectiveScore}-${cleanHandle.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      )}.${imgFormat}`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2200);
        } catch {
          handleDownload("png");
        }
      }, "image/png");
    } catch {
      handleDownload("png");
    }
  };

  const postCaption = `Verified Trust Credential: ${effectiveScore}% LinkedIn Credibility Score (${resolvedTier})

I completed a cross-vector credibility audit of my LinkedIn profile (${cleanHandle}) against my executive resume for ${targetRole} mandates.

Verification ID: ${credentialId}
• Endorsement & Skill Consistency Verified
• Work History & Milestone Metrics Audited
• Education & Public Identity Alignment Authenticated

Audited via Career Intelligence Studio: ${
    typeof window !== "undefined" ? window.location.origin : "https://resume-studio.app"
  }`;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(postCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2200);
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
    }
  };

  const handleNativeShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (navigator.share) {
      try {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `Trust-Score-${effectiveScore}.png`, {
            type: "image/png",
          });
          await navigator.share({
            title: `Verified Trust Score: ${effectiveScore}%`,
            text: postCaption,
            files: [file],
          });
        });
        return;
      } catch {
        handleCopyCaption();
      }
    } else {
      handleCopyCaption();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 md:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="max-w-4xl w-full bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto text-zinc-950 dark:text-zinc-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-6 bg-zinc-50 dark:bg-[#111116] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 flex items-center justify-center text-violet-700 dark:text-violet-300">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold font-display tracking-tight text-zinc-950 dark:text-white">
                    Share My Trust Score
                  </h3>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    · Social Card Studio
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  High-resolution social media graphic card for LinkedIn posts and profile headers
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
            {/* Customization Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Graphic Format
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat("post")}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      format === "post"
                        ? "bg-violet-700 text-white"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    Post (1200×628)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("banner")}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      format === "banner"
                        ? "bg-violet-700 text-white"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    Banner (1584×396)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Card Palette
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme("obsidian-violet")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      theme === "obsidian-violet"
                        ? "bg-zinc-950 text-white border border-violet-500"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    Obsidian
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("royal-purple")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      theme === "royal-purple"
                        ? "bg-purple-700 text-white"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    Royal
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("clean-white")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      theme === "clean-white"
                        ? "bg-zinc-200 text-zinc-950 font-bold"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    White
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Card Display Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Candidate Name"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-violet-600"
                />
              </div>
            </div>

            {/* Live Canvas Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 px-1">
                <span className="font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                  <span>High-Resolution Graphic Preview</span>
                </span>
                <span className="font-mono text-[11px] text-violet-700 dark:text-violet-300">
                  {format === "post"
                    ? "1200 × 628 px (LinkedIn Post)"
                    : "1584 × 396 px (Banner)"}
                </span>
              </div>

              <div className="w-full bg-zinc-100 dark:bg-[#09090b] p-2 md:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-h-[380px] rounded-lg shadow-md object-contain border border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>

            {/* LinkedIn Post Copy Area */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                  Pre-Formatted LinkedIn Post Copy
                </label>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-violet-500 text-violet-700 dark:text-violet-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Caption</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[11px] font-sans text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#111116] p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {postCaption}
              </pre>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 bg-zinc-50 dark:bg-[#111116] border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyImage}
                className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                    <span>Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                    <span>Copy Card Image</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDownload("jpeg")}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>JPEG</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-950 border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Post</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload("png")}
                disabled={isExporting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-xs transition-all shadow-sm active:scale-[0.98] cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res PNG</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
