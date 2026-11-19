import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wand2,
  Layout,
  Table,
  Type,
  Check,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

export interface FormattingFixesState {
  standardizeMargins: boolean;
  removeComplexTables: boolean;
  convertToStandardFont: boolean;
  standardizeHeaders: boolean;
  selectedFont: "Inter" | "Arial" | "Calibri" | "Georgia";
}

export interface ResumeQuickFixToolbarProps {
  fixes: FormattingFixesState;
  onToggleFix: (fixKey: keyof Omit<FormattingFixesState, "selectedFont">) => void;
  onSelectFont: (font: "Inter" | "Arial" | "Calibri" | "Georgia") => void;
  onApplyAll: () => void;
  onReset: () => void;
  baseFormattingScore: number;
  effectiveFormattingScore: number;
  activeToastMessage?: string | null;
}

export const ResumeQuickFixToolbar: React.FC<ResumeQuickFixToolbarProps> = ({
  fixes,
  onToggleFix,
  onSelectFont,
  onApplyAll,
  onReset,
  effectiveFormattingScore,
  activeToastMessage,
}) => {
  const [showFontDropdown, setShowFontDropdown] = useState(false);

  const allActive =
    fixes.standardizeMargins &&
    fixes.removeComplexTables &&
    fixes.convertToStandardFont &&
    fixes.standardizeHeaders;

  const anyActive =
    fixes.standardizeMargins ||
    fixes.removeComplexTables ||
    fixes.convertToStandardFont ||
    fixes.standardizeHeaders;

  const activeCount = [
    fixes.standardizeMargins,
    fixes.removeComplexTables,
    fixes.convertToStandardFont,
    fixes.standardizeHeaders,
  ].filter(Boolean).length;

  return (
    <div className="sticky top-3 z-30 w-full max-w-4xl mx-auto px-2">
      <motion.div
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl bg-white/95 dark:bg-[#111116]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-2.5 sm:p-3 text-zinc-950 dark:text-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left Title & Status */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-700 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-950 dark:text-white">
                  Quick Fix Toolbar
                </span>
                <span className="text-[10px] font-mono font-bold text-violet-700 dark:text-violet-400 tabular-nums">
                  {activeCount}/4 Active
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium hidden sm:block">
                1-click automated ATS formatting & layout stabilization
              </p>
            </div>
          </div>

          {/* Center / Right: Formatting Health Score & All-in-One CTA */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 text-xs">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold">
                ATS Health:
              </span>
              <span
                className={`font-mono font-black tabular-nums ${
                  effectiveFormattingScore >= 85
                    ? "text-violet-700 dark:text-violet-400"
                    : effectiveFormattingScore >= 70
                    ? "text-purple-700 dark:text-purple-400"
                    : "text-rose-700 dark:text-rose-400"
                }`}
              >
                {effectiveFormattingScore}%
              </span>
              {effectiveFormattingScore >= 95 && (
                <ShieldCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 inline" />
              )}
            </div>

            <button
              type="button"
              onClick={onApplyAll}
              disabled={allActive}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                allActive
                  ? "bg-violet-50 dark:bg-violet-950/50 border border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-200 cursor-default"
                  : "bg-gradient-to-r from-violet-700 to-purple-600 hover:from-violet-600 hover:to-purple-500 text-white"
              }`}
              title="Apply all ATS compliance formatting fixes simultaneously"
            >
              {allActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-300" />
                  <span>All Fixes Applied</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Apply All Fixes</span>
                </>
              )}
            </button>

            {anyActive && (
              <button
                type="button"
                onClick={onReset}
                className="p-1.5 rounded-xl bg-zinc-100 dark:bg-[#16161d] hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                title="Reset formatting to raw upload state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Button Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-zinc-200 dark:border-zinc-800">
          {/* Fix 1: Standardize Margins */}
          <button
            type="button"
            onClick={() => onToggleFix("standardizeMargins")}
            className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
              fixes.standardizeMargins
                ? "bg-violet-50 dark:bg-violet-950/40 border-violet-400 dark:border-violet-600 text-zinc-950 dark:text-white"
                : "bg-zinc-50/70 dark:bg-[#16161d] hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
            title="Set uniform 1.0 inch margins with standard ATS coordinate guides"
          >
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  fixes.standardizeMargins
                    ? "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                    : "bg-white dark:bg-[#09090b] text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>Standardize Margins</span>
                  {fixes.standardizeMargins && (
                    <span className="text-[9px] px-1.5 rounded bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 font-mono">
                      1.0"
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  0.75" - 1" ATS Uniform Grid
                </div>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                fixes.standardizeMargins
                  ? "bg-violet-700 border-violet-600 text-white"
                  : "border-zinc-300 dark:border-zinc-600 bg-transparent text-transparent"
              }`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          </button>

          {/* Fix 2: Remove Complex Tables */}
          <button
            type="button"
            onClick={() => onToggleFix("removeComplexTables")}
            className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
              fixes.removeComplexTables
                ? "bg-violet-50 dark:bg-violet-950/40 border-violet-400 dark:border-violet-600 text-zinc-950 dark:text-white"
                : "bg-zinc-50/70 dark:bg-[#16161d] hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
            title="Linearize columns, grids, and pipe tables into single-column ATS semantic flow"
          >
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  fixes.removeComplexTables
                    ? "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                    : "bg-white dark:bg-[#09090b] text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">
                  <span>Remove Complex Tables</span>
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Linearize Multi-Column Data
                </div>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                fixes.removeComplexTables
                  ? "bg-violet-700 border-violet-600 text-white"
                  : "border-zinc-300 dark:border-zinc-600 bg-transparent text-transparent"
              }`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          </button>

          {/* Fix 3: Convert to Standard Font */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleFix("convertToStandardFont")}
              className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
                fixes.convertToStandardFont
                  ? "bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 text-zinc-950 dark:text-white"
                  : "bg-zinc-50/70 dark:bg-[#16161d] hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
              title="Apply certified ATS web-safe font (Arial, Calibri, Inter, or Georgia)"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    fixes.convertToStandardFont
                      ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                      : "bg-white dark:bg-[#09090b] text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    <span>Convert Standard Font</span>
                    {fixes.convertToStandardFont && (
                      <span className="text-[9px] px-1.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-mono">
                        {fixes.selectedFont}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Universal ATS Typography
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {fixes.convertToStandardFont && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFontDropdown(!showFontDropdown);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        setShowFontDropdown(!showFontDropdown);
                      }
                    }}
                    className="p-1 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer"
                    title="Choose ATS font family"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </span>
                )}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    fixes.convertToStandardFont
                      ? "bg-purple-700 border-purple-600 text-white"
                      : "border-zinc-300 dark:border-zinc-600 bg-transparent text-transparent"
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>
            </button>

            {/* Font Picker Menu */}
            {showFontDropdown && fixes.convertToStandardFont && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-1.5 z-40 space-y-1">
                {(["Inter", "Arial", "Calibri", "Georgia"] as const).map((font) => (
                  <button
                    key={font}
                    type="button"
                    onClick={() => {
                      onSelectFont(font);
                      setShowFontDropdown(false);
                    }}
                    className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                      fixes.selectedFont === font
                        ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{font} (ATS Certified)</span>
                    {fixes.selectedFont === font && (
                      <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Toast / Feedback Notification */}
        <AnimatePresence>
          {activeToastMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
              <span>{activeToastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
