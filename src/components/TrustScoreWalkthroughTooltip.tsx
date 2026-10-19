import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Share2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  ChevronRight,
  Award,
} from "lucide-react";

export interface TrustScoreWalkthroughTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShareModal: () => void;
  credibilityScore: number | null;
  credibilityTier?: string;
  candidateName?: string;
  targetRole?: string;
}

export const TrustScoreWalkthroughTooltip: React.FC<TrustScoreWalkthroughTooltipProps> = ({
  isOpen,
  onClose,
  onOpenShareModal,
  credibilityScore,
  credibilityTier,
  candidateName = "Alex Mercer",
  targetRole = "Senior Technology Leader",
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const effectiveScore = typeof credibilityScore === "number" ? credibilityScore : 88;
  const resolvedTier =
    credibilityTier ||
    (effectiveScore >= 85
      ? "Verified High Credibility"
      : effectiveScore >= 70
      ? "Strong Profile Credibility"
      : "Moderate Credibility");

  // Attempt to locate the target button in the DOM and position tooltip
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      return;
    }

    const updatePosition = () => {
      // Look for the primary Share my Trust Score button
      const targetEl =
        document.getElementById("share-my-trust-score-btn") ||
        document.getElementById("share-trust-score-linkedin-btn") ||
        document.querySelector('[title*="Share my Trust Score"]') ||
        document.getElementById("verified-trust-badge-section");

      if (targetEl) {
        // Scroll target gently into view if out of viewport
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        const rect = targetEl.getBoundingClientRect();
        setButtonRect(rect);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    const timer = setTimeout(updatePosition, 300);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
      clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem("has_seen_trust_score_walkthrough", "true");
    } catch {
      // ignore
    }
    onClose();
  };

  const handleLaunchShare = () => {
    try {
      localStorage.setItem("has_seen_trust_score_walkthrough", "true");
    } catch {
      // ignore
    }
    onClose();
    onOpenShareModal();
  };

  return (
    <AnimatePresence>
      {/* Dimmed backdrop with cutout focus */}
      <motion.div
        key="trust-walkthrough-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-[2px] pointer-events-auto flex items-end sm:items-center justify-center p-4"
        onClick={handleDismiss}
      >
        {/* Pulsing beacon targeting the Share my Trust Score button if located */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {buttonRect && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{
                position: "fixed",
                top: Math.max(10, buttonRect.top - 8),
                left: Math.max(10, buttonRect.left - 8),
                width: buttonRect.width + 16,
                height: buttonRect.height + 16,
              }}
              className="rounded-2xl border-2 border-teal-400 bg-teal-400/20 shadow-[0_0_35px_rgba(20,184,166,0.6)] z-[131]"
            />
          )}
        </div>

        {/* Interactive Tour Tooltip Card */}
        <motion.div
          key="trust-walkthrough-card"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-lg w-full bg-slate-900/95 border-2 border-teal-500/50 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(20,184,166,0.25)] text-white z-[135] overflow-hidden"
        >
          {/* Ambient header glow */}
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-teal-500/20 via-indigo-500/10 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer border border-white/5"
            title="Dismiss walkthrough"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Badge */}
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" />
              <span>Interactive Guide · Step {currentStep} of 2</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-bold">
              Verified Credibility
            </span>
          </div>

          {/* Content: Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-500/30 to-indigo-500/30 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0 shadow-lg shadow-teal-500/20">
                  <ShieldCheck className="w-7 h-7 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-display tracking-tight flex items-center gap-2">
                    <span>Verification Complete!</span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-400 text-slate-950 text-xs font-black">
                      {effectiveScore}%
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Your public profile has been cross-referenced against your executive resume.
                    You earned the <span className="text-teal-300 font-bold">{resolvedTier}</span> status!
                  </p>
                </div>
              </div>

              {/* Callout highlighting Share button */}
              <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-200">
                  <Share2 className="w-4 h-4 text-teal-400" />
                  <span>Highlight: "Share my Trust Score"</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Notice the highlighted <strong className="text-white">"Share my Trust Score"</strong> button.
                  Clicking it generates a social media-ready card formatted for LinkedIn posts, profile banners,
                  and professional portfolios with your authenticated credential ID.
                </p>
              </div>

              {/* Trust breakdown pills */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 truncate">Cross-Vector Alignment</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="text-slate-300 truncate">Audit Hash Generated</span>
                </div>
              </div>
            </div>
          )}

          {/* Content: Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 shadow-lg shadow-indigo-500/20">
                  <ImageIcon className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-display tracking-tight">
                    Social Card & Embed Options
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Instantly customize high-resolution graphics and one-click copy snippets.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-teal-400" />
                    <span>1200×628 Post</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Landscape card formatted for LinkedIn feed announcements with credential ID.
                  </p>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>1584×396 Banner</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Custom header graphic tailored for your personal LinkedIn profile hero image.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-teal-400" />
                  <span>Includes pre-written LinkedIn announcement post</span>
                </span>
                <span className="text-[10px] text-teal-300 font-mono font-bold uppercase">Ready</span>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-white/10 relative z-10">
            {currentStep === 1 ? (
              <>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Skip Tour
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Formats</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleLaunchShare}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-teal-500/25 active:scale-95 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Try It Now</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Got It
                  </button>
                  <button
                    type="button"
                    onClick={handleLaunchShare}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-teal-500/25 active:scale-95 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Generate Card Now</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
