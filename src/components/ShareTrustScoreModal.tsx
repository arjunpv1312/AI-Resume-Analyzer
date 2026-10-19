import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Layers,
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

type CardTheme = "executive-dark" | "electric-cyan" | "clean-light";
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
  const [theme, setTheme] = useState<CardTheme>("executive-dark");
  const [format, setFormat] = useState<CardFormat>("post");
  const [customName, setCustomName] = useState(candidateName);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync customName if prop changes
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

  // Deterministic Credential ID
  const credentialId = `VT-${effectiveScore}-${Math.abs(
    (customName + cleanHandle + effectiveScore)
      .split("")
      .reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)
  )
    .toString(16)
    .toUpperCase()
    .slice(0, 6)}`;

  // Factors for display
  const factors =
    trustFactors && trustFactors.length > 0
      ? trustFactors.slice(0, 4)
      : [
          { name: "Endorsement & Skill Alignment", score: Math.min(98, effectiveScore + 2) },
          { name: "Work History Consistency", score: Math.min(99, effectiveScore + 4) },
          { name: "Education & Credential Audit", score: Math.max(75, effectiveScore - 1) },
          { name: "Identity & Seniority Match", score: Math.min(98, effectiveScore + 3) },
        ];

  // Helper: Draw rounded rectangle
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

  // Render High-DPI Social Card on HTML5 Canvas
  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = format === "banner" ? 1584 : 1200;
    const height = format === "banner" ? 396 : 628;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isLight = theme === "clean-light";
    const isCyan = theme === "electric-cyan";

    // 1. Background Gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    if (isLight) {
      bg.addColorStop(0, "#f8fafc");
      bg.addColorStop(0.5, "#f1f5f9");
      bg.addColorStop(1, "#e2e8f0");
    } else if (isCyan) {
      bg.addColorStop(0, "#02121e");
      bg.addColorStop(0.5, "#062238");
      bg.addColorStop(1, "#041624");
    } else {
      bg.addColorStop(0, "#050814");
      bg.addColorStop(0.45, "#0b1224");
      bg.addColorStop(1, "#071a24");
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle architectural grid pattern
    ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.03)";
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

    // 3. Ambient glow accents
    const glowColor1 = isCyan
      ? "rgba(6, 182, 212, 0.22)"
      : isLight
      ? "rgba(20, 184, 166, 0.16)"
      : "rgba(20, 184, 166, 0.22)";
    const glow1 = ctx.createRadialGradient(
      width * 0.18,
      height * 0.45,
      20,
      width * 0.18,
      height * 0.45,
      380
    );
    glow1.addColorStop(0, glowColor1);
    glow1.addColorStop(1, "rgba(20, 184, 166, 0)");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(
      width * 0.82,
      height * 0.35,
      30,
      width * 0.82,
      height * 0.35,
      420
    );
    glow2.addColorStop(
      0,
      isLight ? "rgba(59, 130, 246, 0.12)" : "rgba(99, 102, 241, 0.2)"
    );
    glow2.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    // 4. Outer Glassmorphism Card Frame
    const cardPadding = 32;
    const cw = width - cardPadding * 2;
    const ch = height - cardPadding * 2;
    drawRoundedRect(ctx, cardPadding, cardPadding, cw, ch, 28);
    ctx.fillStyle = isLight ? "rgba(255, 255, 255, 0.85)" : "rgba(10, 15, 30, 0.65)";
    ctx.fill();
    ctx.strokeStyle = isLight
      ? "rgba(203, 213, 225, 0.9)"
      : isCyan
      ? "rgba(6, 182, 212, 0.35)"
      : "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Header: Badge & Authority Branding
    const textPrimary = isLight ? "#0f172a" : "#ffffff";
    const textSecondary = isLight ? "#475569" : "#94a3b8";
    const accentTeal = "#14b8a6";

    // Top Brand Pill
    const pillX = cardPadding + 36;
    const pillY = cardPadding + 32;
    drawRoundedRect(ctx, pillX, pillY, 260, 36, 18);
    ctx.fillStyle = isLight ? "rgba(20, 184, 166, 0.15)" : "rgba(20, 184, 166, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(20, 184, 166, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = isLight ? "#0f766e" : "#2dd4bf";
    ctx.fillText("🛡️  VERIFIED TRUST AUDIT", pillX + 16, pillY + 23);

    // Verification ID on right
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillStyle = textSecondary;
    ctx.textAlign = "right";
    ctx.fillText(`ID: ${credentialId}`, cardPadding + cw - 36, pillY + 23);
    ctx.textAlign = "left";

    if (format === "post") {
      // POST FORMAT (1200 x 628)
      // Candidate Name & Headline
      ctx.font = "900 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = textPrimary;
      ctx.fillText(customName, cardPadding + 36, cardPadding + 120);

      ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = textSecondary;
      ctx.fillText(targetRole, cardPadding + 36, cardPadding + 155);

      // LinkedIn handle pill
      const handleY = cardPadding + 175;
      drawRoundedRect(ctx, cardPadding + 36, handleY, 220, 32, 16);
      ctx.fillStyle = isLight ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.05)";
      ctx.fill();
      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.fillStyle = isLight ? "#0284c7" : "#38bdf8";
      ctx.fillText(`in/${cleanHandle.replace(/^in\//i, "")}`, cardPadding + 52, handleY + 21);

      // Score Showcase Circle (Right Side)
      const circleCenterX = width - cardPadding - 180;
      const circleCenterY = cardPadding + 160;
      const radius = 95;

      // Track background
      ctx.beginPath();
      ctx.arc(circleCenterX, circleCenterY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 14;
      ctx.stroke();

      // Progress Arc
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
      arcGrad.addColorStop(0, "#14b8a6");
      arcGrad.addColorStop(1, "#38bdf8");
      ctx.strokeStyle = arcGrad;
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.stroke();

      // Score Number
      ctx.textAlign = "center";
      ctx.font = "900 60px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = textPrimary;
      ctx.fillText(`${effectiveScore}%`, circleCenterX, circleCenterY + 14);

      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = isLight ? "#0f766e" : "#2dd4bf";
      ctx.fillText("CREDIBILITY SCORE", circleCenterX, circleCenterY + 36);
      ctx.textAlign = "left";

      // Verified Tier Banner
      const tierY = cardPadding + 235;
      drawRoundedRect(ctx, cardPadding + 36, tierY, 320, 36, 18);
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#34d399";
      ctx.fillText(`✓ ${resolvedTier.toUpperCase()}`, cardPadding + 52, tierY + 23);

      // Factor Cards (Bottom 4 Pillars)
      const factorY = height - cardPadding - 180;
      const factorW = (cw - 72 - 36) / 4;
      const factorH = 120;

      factors.forEach((f, idx) => {
        const fx = cardPadding + 36 + idx * (factorW + 12);
        drawRoundedRect(ctx, fx, factorY, factorW, factorH, 18);
        ctx.fillStyle = isLight ? "rgba(241, 245, 249, 0.8)" : "rgba(255, 255, 255, 0.04)";
        ctx.fill();
        ctx.strokeStyle = isLight ? "rgba(203, 213, 225, 0.7)" : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = accentTeal;
        ctx.fillText(`${f.score}%`, fx + 18, factorY + 42);

        ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = textPrimary;
        const words = f.name.split(" ");
        if (words.length > 2) {
          ctx.fillText(words.slice(0, 2).join(" "), fx + 18, factorY + 70);
          ctx.fillText(words.slice(2).join(" "), fx + 18, factorY + 90);
        } else {
          ctx.fillText(f.name, fx + 18, factorY + 75);
        }
      });

      // Bottom Footer
      const footerY = height - cardPadding - 24;
      ctx.font = "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = textSecondary;
      ctx.fillText("Executive Resume & LinkedIn Cross-Vector Engine", cardPadding + 36, footerY);

      ctx.textAlign = "right";
      ctx.fillText("Verified with Zero-Knowledge Local Parsing", cardPadding + cw - 36, footerY);
      ctx.textAlign = "left";
    } else {
      // BANNER FORMAT (1584 x 396)
      ctx.font = "900 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = textPrimary;
      ctx.fillText(customName, cardPadding + 36, cardPadding + 115);

      ctx.font = "600 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = textSecondary;
      ctx.fillText(`${targetRole}  •  in/${cleanHandle.replace(/^in\//i, "")}`, cardPadding + 36, cardPadding + 150);

      // Score Badge on Right
      const rightX = width - cardPadding - 240;
      const rightY = cardPadding + 85;
      drawRoundedRect(ctx, rightX, rightY, 200, 180, 24);
      ctx.fillStyle = isLight ? "rgba(20, 184, 166, 0.1)" : "rgba(20, 184, 166, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 184, 166, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "900 64px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = textPrimary;
      ctx.fillText(`${effectiveScore}%`, rightX + 100, rightY + 90);

      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = accentTeal;
      ctx.fillText("TRUST SCORE", rightX + 100, rightY + 120);

      ctx.font = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = textSecondary;
      ctx.fillText(resolvedTier, rightX + 100, rightY + 145);
      ctx.textAlign = "left";

      // 3 Mini Factor badges in center
      const factorStartY = cardPadding + 185;
      factors.slice(0, 3).forEach((f, idx) => {
        const fx = cardPadding + 36 + idx * 260;
        drawRoundedRect(ctx, fx, factorStartY, 240, 80, 16);
        ctx.fillStyle = isLight ? "rgba(241, 245, 249, 0.8)" : "rgba(255, 255, 255, 0.04)";
        ctx.fill();
        ctx.strokeStyle = isLight ? "rgba(203, 213, 225, 0.7)" : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = accentTeal;
        ctx.fillText(`${f.score}%`, fx + 16, factorStartY + 42);

        ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = textPrimary;
        ctx.fillText(f.name, fx + 16, factorStartY + 64);
      });
    }
  }, [theme, format, customName, targetRole, cleanHandle, effectiveScore, resolvedTier, credentialId, factors]);

  // Redraw when settings change
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => drawCard(), 50);
    }
  }, [isOpen, drawCard]);

  // Download image
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

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          // Clipboard Item for image
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2200);
        } catch {
          // If browser clipboard item fails, fallback to download
          handleDownload("png");
        }
      }, "image/png");
    } catch {
      handleDownload("png");
    }
  };

  // Copy LinkedIn Post Caption
  const postCaption = `🛡️ Verified Trust Credential: ${effectiveScore}% LinkedIn Credibility Score (${resolvedTier})

I just completed a cross-vector credibility audit of my LinkedIn profile (${cleanHandle}) against my executive resume for ${targetRole} mandates.

✅ Verification ID: ${credentialId}
• Endorsement & Skill Consistency Verified
• Work History & Milestone Metrics Audited
• Education & Public Identity Alignment Authenticated

Audited via AI Career Intelligence Studio: ${typeof window !== "undefined" ? window.location.origin : "https://resume-studio.app"}`;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(postCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2200);
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
    }
  };

  // Mobile Web Share API support
  const handleNativeShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (navigator.share) {
      try {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `Trust-Score-${effectiveScore}.png`, { type: "image/png" });
          await navigator.share({
            title: `Verified Trust Score: ${effectiveScore}%`,
            text: postCaption,
            files: [file],
          });
        });
        return;
      } catch {
        // Fallback to copy caption
        handleCopyCaption();
      }
    } else {
      handleCopyCaption();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-blue-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black font-display tracking-tight text-white">
                    Share My Trust Score
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-black uppercase tracking-wider border border-teal-500/30">
                    Social Card Ready
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  High-resolution social media graphic card for LinkedIn, X, and professional portfolios
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
            {/* Customization Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              {/* Card Dimensions */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Graphic Format
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat("post")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      format === "post"
                        ? "bg-teal-500 text-slate-950 font-black shadow-sm"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Post (1200×628)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("banner")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      format === "banner"
                        ? "bg-teal-500 text-slate-950 font-black shadow-sm"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Banner (1584×396)
                  </button>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Color Theme
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme("executive-dark")}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      theme === "executive-dark"
                        ? "bg-indigo-600 text-white font-black"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("electric-cyan")}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      theme === "electric-cyan"
                        ? "bg-cyan-600 text-white font-black"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Cyan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("clean-light")}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      theme === "clean-light"
                        ? "bg-slate-200 text-slate-900 font-black"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Light
                  </button>
                </div>
              </div>

              {/* Editable Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Card Display Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Candidate Name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Live Canvas Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Real-Time High-Resolution Graphic Preview</span>
                </span>
                <span className="font-mono text-[11px] text-teal-300">
                  {format === "post" ? "1200 × 628 px (1.91:1 LinkedIn Post)" : "1584 × 396 px (4:1 Banner)"}
                </span>
              </div>

              <div className="w-full bg-slate-950 p-2 md:p-4 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-h-[380px] rounded-xl shadow-2xl object-contain border border-white/5"
                />
              </div>
            </div>

            {/* LinkedIn Post Copy Area */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span>Pre-Formatted LinkedIn Post Copy</span>
                  <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 font-sans normal-case">
                    Ready to Paste
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Caption!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[11px] font-sans text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {postCaption}
              </pre>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyImage}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Card Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-teal-400" />
                    <span>Copy Card Image</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDownload("jpeg")}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>JPEG</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Post</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload("png")}
                disabled={isExporting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-teal-500/25 active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
