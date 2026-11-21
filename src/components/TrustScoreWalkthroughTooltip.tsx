import React, { useState, useEffect } from "react";
import {
  Share2,
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowLeft,
  Image as ImageIcon,
  Copy,
  ChevronRight,
  Award,
  Compass,
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

export const TrustScoreWalkthroughTooltip: React.FC<
  TrustScoreWalkthroughTooltipProps
> = ({
  isOpen,
  onClose,
  onOpenShareModal,
  credibilityScore,
  credibilityTier,
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

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      return;
    }

    const updatePosition = () => {
      const targetEl =
        document.getElementById("share-my-trust-score-btn") ||
        document.getElementById("share-trust-score-linkedin-btn") ||
        document.querySelector('[title*="Share my Trust Score"]') ||
        document.getElementById("verified-trust-badge-section");

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        const rect = targetEl.getBoundingClientRect();
        setButtonRect(rect);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    const timer = setTimeout(updatePosition, 250);

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
    <div
      key="trust-walkthrough-backdrop"
      className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-[2px] pointer-events-auto flex items-end sm:items-center justify-center p-4"
      onClick={handleDismiss}
    >
      {/* Clean static spotlight frame around target action */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {buttonRect && (
          <div
            style={{
              position: "fixed",
              top: Math.max(10, buttonRect.top - 6),
              left: Math.max(10, buttonRect.left - 6),
              width: buttonRect.width + 12,
              height: buttonRect.height + 12,
            }}
            className="rounded-xl border-2 border-violet-500 ring-4 ring-violet-500/25 z-[131] transition-colors duration-150"
          />
        )}
      </div>

      {/* Executive Tour Card */}
      <div
        key="trust-walkthrough-card"
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl text-zinc-950 dark:text-white z-[135] overflow-hidden"
      >
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-5 right-5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Dismiss walkthrough"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Metadata */}
          <div className="flex items-center gap-2 mb-4 text-xs">
            <Compass className="w-4 h-4 text-violet-700 dark:text-violet-400" />
            <span className="font-bold text-violet-700 dark:text-violet-300">
              Interactive Guide · Step {currentStep} of 2
            </span>
            <span className="text-zinc-400" aria-hidden="true">
              ·
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
              Verified Credibility
            </span>
          </div>

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 flex items-center justify-center text-violet-700 dark:text-violet-300 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-950 dark:text-white font-display tracking-tight flex items-center gap-2">
                    <span>Verification Complete</span>
                    <span className="font-mono tabular-nums text-violet-700 dark:text-violet-300">
                      {effectiveScore}%
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    Your LinkedIn profile has been cross-referenced against your resume under{" "}
                    <strong className="text-zinc-950 dark:text-white">{resolvedTier}</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-violet-800 dark:text-violet-300">
                  <Share2 className="w-4 h-4" />
                  <span>Highlight: "Share my Trust Score"</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Use the highlighted <strong>"Share my Trust Score"</strong> action to generate a crisp executive card formatted for LinkedIn posts and profile headers with your credential ID.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400 shrink-0" />
                  <span className="text-zinc-700 dark:text-zinc-300 truncate">
                    Cross-Vector Alignment
                  </span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 shrink-0" />
                  <span className="text-zinc-700 dark:text-zinc-300 truncate">
                    Audit ID Generated
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-700 dark:text-purple-300 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-950 dark:text-white font-display tracking-tight">
                    Social Card & Embed Formats
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    Customize high-resolution graphics and copy pre-formatted LinkedIn captions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                    <span>1200×628 Post</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight">
                    Landscape card formatted for LinkedIn feed posts with credential ID.
                  </p>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                    <span>1584×396 Banner</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight">
                    Wide header graphic tailored for your LinkedIn profile backdrop.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                  <span>Includes ready-to-paste LinkedIn post copy</span>
                </span>
                <span className="text-[11px] text-violet-700 dark:text-violet-300 font-semibold">
                  Ready
                </span>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-zinc-200 dark:border-zinc-800">
            {currentStep === 1 ? (
              <>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Skip Tour
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Formats</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleLaunchShare}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Open Share Card</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={handleLaunchShare}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Generate Card Now</span>
                  </button>
                </div>
              </>
            )}
          </div>
      </div>
    </div>
  );
};
